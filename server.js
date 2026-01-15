const express = require('express');
const path = require('path');
const multer = require('multer');
const mammoth = require('mammoth');
const fs = require('fs');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const compression = require('compression');
const expressStaticGzip = require('express-static-gzip');

// Template name translations
const templateTranslations = {
  'Request to Extend Expired Account Access': 'Solicitação de Extensão de Acesso de Conta Expirada',
  'Request for MFA Reset': 'Solicitação de Reset de MFA',
  'Request for Third-Party Luxottica Account': 'Solicitação de Conta Luxottica de Terceiros',
  'Request for New Luxottica Account': 'Solicitação de Nova Conta Luxottica',
  'Request to Add Email to Distribution Group(s)': 'Solicitação para Adicionar E-mail ao(s) Grupo(s) de Distribuição',
  'Request to Remove Email from Distribution Group(s)': 'Solicitação para Remover E-mail do(s) Grupo(s) de Distribuição',
  'Request to Delete Email Account': 'Solicitação de Exclusão de Conta de E-mail',
  'Request to Modify Existing Luxottica Account': 'Solicitação de Modificação de Conta Luxottica Existente',
  'Request to Modify Account by Mirroring Existing User': 'Solicitação de Modificação de Conta Espelhando Usuário Existente',
  'Request to Reactivate Email Account': 'Solicitação de Reativação de Conta de E-mail',
  'User Not Receiving Third-Party Emails': 'Usuário Não Recebendo E-mails de Terceiros',
  'Request to Upgrade Office License from E1 to E3': 'Solicitação de Upgrade de Licença Office de E1 para E3',
  'Request to Renew Expired Office License (E3)': 'Solicitação de Renovação de Licença Office Expirada (E3)',
  'Request to Unlock User Account': 'Solicitação de Desbloqueio de Conta de Usuário',
  'Request to Block and Deactivate User Access': 'Solicitação de Bloqueio e Desativação de Acesso de Usuário'
};

const app = express();
const upload = multer({ dest: path.join(__dirname,'uploads') });
app.use(cors());
app.use(express.json({limit:'1mb'}));

// enable gzip/brotli compression for dynamic responses
app.use(compression({ level: 6 }));

// serve pre-compressed assets when available (prefer brotli then gzip)
app.use('/', expressStaticGzip(path.join(__dirname), {
  enableBrotli: true,
  orderPreference: ['br', 'gz'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// fallback to plain static serving
app.use(express.static(path.join(__dirname)));

// inicializa ou abre DB
const DBFILE = path.join(__dirname,'data','msdos.db');
fs.mkdirSync(path.join(__dirname,'data'),{recursive:true});
const db = new sqlite3.Database(DBFILE);
db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, text TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket TEXT, requester TEXT, username TEXT, category TEXT, subcategory TEXT, message TEXT, analyst TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS passwords (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, name TEXT, password TEXT, analyst TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
});

// ensure older DBs get new columns
function ensureColumn(table, column){
  db.all(`PRAGMA table_info(${table})`, [], (err, rows)=>{
    if(err) return;
    const cols = rows.map(r=>r.name);
    if(!cols.includes(column)){
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
    }
  });
}
ensureColumn('tickets','analyst');
ensureColumn('passwords','analyst');

// upload template (.docx) -> extract text and store
app.post('/api/upload-template', upload.single('template'), async (req,res)=>{
  try{
    if(!req.file) return res.status(400).json({error:'no file'});
    const filePath = req.file.path;
    const result = await mammoth.extractRawText({path:filePath});
    const text = result.value || '';
    const name = req.file.originalname || ('template_'+Date.now());
    db.run('INSERT INTO templates (name,text) VALUES (?,?)', [name, text], function(err){
      fs.unlink(filePath, ()=>{});
      if(err) return res.status(500).json({error:err.message});
      res.json({id:this.lastID, name});
    });
  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

// serve extracted pdf parts (produced by pdf_extract.py)
app.get('/api/pdfparts', (req,res)=>{
  const fp = path.join(__dirname,'data','pdf_templates.jsonl');
  if(!fs.existsSync(fp)) return res.json([]);
  const lines = fs.readFileSync(fp,'utf8').split(/\r?\n/).filter(Boolean);
  const arr = lines.map(l=>{ try{ return JSON.parse(l); }catch(e){ return null; } }).filter(Boolean);
  res.json(arr);
});

// import pdf parts into templates table (avoid duplicates)
app.post('/api/import-pdf-templates', (req,res)=>{
  const fp = path.join(__dirname,'data','pdf_templates.jsonl');
  if(!fs.existsSync(fp)) return res.status(404).json({error:'pdf templates file not found'});
  const lines = fs.readFileSync(fp,'utf8').split(/\r?\n/).filter(Boolean);
  const parts = lines.map(l=>{ try{ return JSON.parse(l); }catch(e){ return null; } }).filter(Boolean).map(p=>p.text||'');
  const results = [];
  // group by headings that start with 'Modelo' or 'Subject:' markers
  let curName = null; let curBuf = [];
  function flush(){
    if(curName && curBuf.length){
      const text = curBuf.join('\n').trim();
      // check if name exists
      db.get('SELECT id FROM templates WHERE name=?',[curName], (err,row)=>{
        if(err){ console.error('db check',err); }
        if(row) { results.push({name:curName,skipped:true}); }
        else{
          db.run('INSERT INTO templates (name,text) VALUES (?,?)',[curName,text], function(err2){ if(err2) console.error('insert',err2); else results.push({name:curName,id:this.lastID}); });
        }
      });
    }
    curName = null; curBuf = [];
  }
  for(const t of parts){
    if(!t) continue;
    if(/^Modelo\b/i.test(t) || /^Model/i.test(t) || /^Subject:/i.test(t)){
      // treat as title when it contains 'Modelo' or 'Subject:' and it's short
      if(/^Subject:/i.test(t)){
        // if we already have a current name, keep subject as part of body
        if(!curName) curName = t.replace(/[^a-zA-Z0-9 \-_:]/g,'').slice(0,80);
        curBuf.push(t);
      } else {
        // new template header
        flush();
        curName = t;
      }
    } else {
      curBuf.push(t);
    }
  }
  flush();
  // respond after a brief delay allowing DB inserts to finish
  setTimeout(()=>{ res.json({imported: results}); }, 400);
});

// improved import that replaces null-name imports: deletes null-name templates and re-imports
// delete all templates endpoint
app.post('/api/delete-all-templates', (req,res)=>{
  db.run('DELETE FROM templates', [], (err)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json({ok:true});
  });
});

app.post('/api/import-pdf-templates-fix', (req,res)=>{
  const fp = path.join(__dirname,'data','pdf_templates.jsonl');
  if(!fs.existsSync(fp)) return res.status(404).json({error:'pdf templates file not found'});
  const lines = fs.readFileSync(fp,'utf8').split(/\r?\n/).filter(Boolean);
  const parts = lines.map(l=>{ try{ return JSON.parse(l); }catch(e){ return null; } }).filter(Boolean).map(p=>p.text||'');

  // delete all existing templates
  db.run('DELETE FROM templates', [], (derr)=>{
    // split parts by Subject: (each Subject = 1 template)
    const imports = [];
    let curSubject = null; let subjectBuf = [];
    for(const t of parts){
      if(!t) continue;
      const s = t.trim();
      const m = s.match(/^Subject:\s*(.+)/i);
      if(m){
        // new subject starts a new template
        if(curSubject && subjectBuf.length){
          imports.push({ name: curSubject, text: subjectBuf.join('\n').trim() });
        }
        curSubject = m[1].trim();
        subjectBuf = [];
      } else {
        subjectBuf.push(t);
      }
    }
    if(curSubject && subjectBuf.length){
      imports.push({ name: curSubject, text: subjectBuf.join('\n').trim() });
    }

    // insert sequentially
    let inserted = [];
    (function insertNext(i){
      if(i>=imports.length) return res.json({imported: inserted});
      const item=imports[i];
      // apply translation if available
      const translatedName = templateTranslations[item.name] || item.name;
      db.run('INSERT INTO templates (name,text) VALUES (?,?)',[translatedName,item.text], function(e2){
        if(e2) console.error(e2);
        inserted.push({name:translatedName,id:this.lastID});
        insertNext(i+1);
      });
    })(0);
  });
});

// append labeled sample (from labeler)
app.post('/api/save-sample', (req,res)=>{
  const s = req.body || {};
  const outp = path.join(__dirname,'data','labeled_samples.jsonl');
  const line = JSON.stringify({ text: s.text||'', label: s.label||'' }, null, 0) + '\n';
  fs.appendFile(outp, line, (err)=>{ if(err) return res.status(500).json({error:err.message}); res.json({ok:true}); });
});

app.get('/api/get-samples', (req,res)=>{
  const fp = path.join(__dirname,'data','labeled_samples.jsonl');
  const labelset = new Set();
  const samples = [];
  if(fs.existsSync(fp)){
    const lines = fs.readFileSync(fp,'utf8').split(/\r?\n/).filter(Boolean);
    for(const l of lines){ try{ const o=JSON.parse(l); samples.push(o); if(o.label) labelset.add(o.label); }catch(e){} }
  }
  res.json({ samples, labels: Array.from(labelset) });
});

app.get('/api/templates', (req,res)=>{
  db.all('SELECT id,name,createdAt FROM templates ORDER BY createdAt DESC',[], (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

// save a generated template programmatically
app.post('/api/save-template', (req,res)=>{
  const { name, text } = req.body || {};
  if(!name || !text) return res.status(400).json({error:'name and text required'});
  db.run('INSERT INTO templates (name,text) VALUES (?,?)', [name, text], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({id:this.lastID});
  });
});

app.get('/api/template/:id', (req,res)=>{
  const id = req.params.id;
  db.get('SELECT id,name,text FROM templates WHERE id=?', [id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'not found'});
    // detect placeholders: any field with format "FieldName: " anywhere in text
    const text = row.text || '';
    const placeholders = [];
    // Match "FieldName:" where FieldName starts with letter and contains alphanumeric/spaces/underscores
    const regex = /\b([A-Za-z][A-Za-z0-9_\s]*?):\s/g;
    let match;
    while((match = regex.exec(text)) !== null){
      const field = match[1].trim().replace(/\s+/g,'_');
      if(field && !placeholders.includes(field)){
        placeholders.push(field);
      }
    }
    res.json({id:row.id, name:row.name, text, placeholders: Array.from(new Set(placeholders))});
  });
});

app.post('/api/generate-email', (req,res)=>{
  const { templateId, fields } = req.body || {};
  if(!templateId) return res.status(400).json({error:'templateId required'});
  db.get('SELECT text FROM templates WHERE id=?',[templateId], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!row) return res.status(404).json({error:'template not found'});
    let out = row.text;
    for(const k of Object.keys(fields||{})){
      const re = new RegExp('{{\\s*'+k+'\\s*}}','g');
      out = out.replace(re, fields[k] || '');
    }
    res.json({text: out});
  });
});

// generate-from-template: more robust replacement using lines with ':' and [placeholders]
app.post('/api/generate-from-template', (req, res) => {
  const { templateId, fields } = req.body || {};
  if(!templateId) return res.status(400).json({ error: 'templateId required' });
  db.get('SELECT text,name FROM templates WHERE id=?', [templateId], (err,row)=>{
    if(err) return res.status(500).json({ error: err.message });
    if(!row) return res.status(404).json({ error: 'template not found' });
    const text = row.text || '';
    const inFields = {};
    // normalize provided field keys: allow both 'Email Address' and 'email_address'
    for(const k of Object.keys(fields || {})){
      const nk = String(k).trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
      inFields[nk] = fields[k];
    }

    function normalizeKey(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''); }

    const outLines = [];
    for(const ln of String(text).split(/\r?\n/)){
      if(ln.indexOf(':') === -1){
        // replace bracketed placeholders inside line
        let s = ln;
        const brs = s.match(/\[([^\]]+)\]/g) || [];
        for(const b of brs){
          const key = normalizeKey(b.replace(/\[|\]/g,''));
          const v = inFields[key] || '';
          s = s.replace(b, v);
        }
        outLines.push(s);
        continue;
      }
      const idx = ln.indexOf(':');
      const leftRaw = ln.slice(0, idx);
      const left = leftRaw.replace(/^\s*[-•\*\u2022\t\s]+/, '').trim();
      const key = normalizeKey(left);
      const right = ln.slice(idx+1);
      let val = '';
      if(inFields.hasOwnProperty(key)) val = inFields[key];
      else {
        // try bracket placeholder in right
        const m = right.match(/\[([^\]]+)\]/);
        if(m){ val = inFields[normalizeKey(m[1])] || ''; }
      }
      // preserve leading bullets/whitespace
      const lead = leftRaw.match(/^\s*[-•\*\u2022\t\s]*/);
      const prefix = lead ? lead[0] : '';
      outLines.push(prefix + left + ': ' + (val || '').toString());
    }

    const generated = outLines.join('\n');
    res.json({ id: row.id, name: row.name, text: generated });
  });
});

// tickets
app.post('/api/save-ticket', (req,res)=>{
  const t = req.body || {};
  const analyst = t.analyst || '';
  db.run('INSERT INTO tickets (ticket,requester,username,category,subcategory,message,analyst) VALUES (?,?,?,?,?,?,?)', [t.ticket,t.requester,t.username,t.category,t.subcategory,t.message, analyst], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({id:this.lastID});
  });
});

app.get('/api/tickets', (req,res)=>{
  db.all('SELECT * FROM tickets ORDER BY createdAt DESC', [], (err,rows)=>{ if(err) return res.status(500).json({error:err.message}); res.json(rows); });
});

// passwords
app.post('/api/save-password', (req,res)=>{
  const p = req.body || {};
  const analyst = p.analyst || '';
  db.run('INSERT INTO passwords (username,name,password,analyst) VALUES (?,?,?,?)', [p.username,p.name,p.password, analyst], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({id:this.lastID});
  });
});

app.get('/api/passwords', (req,res)=>{
  db.all('SELECT * FROM passwords ORDER BY createdAt DESC', [], (err,rows)=>{ if(err) return res.status(500).json({error:err.message}); res.json(rows); });
});

// simple admin page served statically: ensure admin.html exists in folder

const http = require('http');
const PORT = process.env.PORT || 3000;

// create HTTP server so we can later close it gracefully
const server = http.createServer(app);
let activeClients = 0;

server.listen(PORT, ()=>{ console.log('Server listening on', PORT); });

// Simple SSE endpoint for clients to announce presence; when the last client disconnects, shutdown
app.get('/_sse', (req, res) => {
  // keep the connection open
  req.socket.setTimeout(0);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  // send initial keep-alive
  res.write('retry: 10000\n\n');
  activeClients++;
  console.log('SSE client connected, count=', activeClients);
  res.write(`data: ${JSON.stringify({ connected: true, clients: activeClients })}\n\n`);

  req.on('close', () => {
    activeClients = Math.max(0, activeClients - 1);
    console.log('SSE client disconnected, count=', activeClients);
    // if no clients remain, close the server after a short delay
    if (activeClients === 0) {
      // allow disabling auto-shutdown via environment for testing
      if (process.env.AUTO_SHUTDOWN === 'false') {
        console.log('AUTO_SHUTDOWN is false — keeping server running for tests');
        return;
      }
      console.log('No active clients remain — shutting down server in 1s');
      setTimeout(() => {
        try{
          server.close(() => {
            console.log('Server closed due to no active clients');
            process.exit(0);
          });
        }catch(e){ console.error('Error during server close', e); }
      }, 1000);
    }
  });
});

app.get('/_clients', (req, res) => { res.json({ clients: activeClients }); });
