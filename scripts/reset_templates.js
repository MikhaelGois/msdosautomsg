const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbfile = path.join(__dirname, '..', 'data', 'msdos.db');

console.log('Using DB file:', dbfile);
const db = new sqlite3.Database(dbfile);

const templates = [
  {
    name: 'Extend Expired Account Access',
    text: `Email Address:
Employee ID or External Reference:
Expiration Date:
Ticket BR:

Olá,

Solicito a extensão do acesso da conta acima com base nas informações fornecidas. Favor confirmar e executar as ações necessárias.

Obrigado.`
  },
  {
    name: 'Request for MFA Reset',
    text: `User Email:
User Name:
Ticket BR:

Hello,

Please reset MFA for the account above and inform the user when complete.

Thanks.`
  },
  {
    name: 'Request to Add Email to Distribution Group(s)',
    text: `Email Address:
Distribution Group:
Requester:
Ticket BR:

Olá,

Solicito inclusão do e-mail no(s) grupo(s) indicados.

Obrigado.`
  },
  {
    name: 'Request to Remove Email from Distribution Group(s)',
    text: `Email Address:
Distribution Group:
Requester:
Ticket BR:

Olá,

Solicito remoção do e-mail do(s) grupo(s).

Obrigado.`
  }
];

function resetAndInsert(){
  db.serialize(() => {
    db.run('DELETE FROM templates', [], function(err){
      if(err){ console.error('Error deleting templates:', err.message); process.exit(1); }
      console.log('Deleted existing templates');

      const stmt = db.prepare('INSERT INTO templates (name,text) VALUES (?,?)');
      for(const t of templates){
        stmt.run([t.name, t.text], function(err2){
          if(err2) console.error('Insert error for', t.name, err2.message);
          else console.log('Inserted template', t.name, 'id=', this.lastID);
        });
      }
      stmt.finalize((e)=>{
        if(e) console.error('Finalize error', e.message);
        // show count
        db.get('SELECT COUNT(*) as c FROM templates', [], (err3,row)=>{
          if(err3) console.error('Count error', err3.message);
          else console.log('Templates count after insert:', row.c);
          db.close();
        });
      });
    });
  });
}

resetAndInsert();
