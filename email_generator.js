// email_generator.js
// Cliente simples para geração de e-mails via API com templates do PDF

// Field name translations
const fieldTranslations = {
  'Email_Address': 'Endereço de E-mail',
  'Employee_ID_or_External_Reference': 'ID do Funcionário ou Referência Externa',
  'Ticket_BR': 'Ticket BR',
  'Ticket_Number': 'Número do Ticket',
  'ID_or_Reference': 'ID ou Referência',
  'User_Email': 'E-mail do Usuário',
  'User_Name': 'Nome do Usuário',
  'Distribution_Group': 'Grupo de Distribuição',
  'Current_License': 'Licença Atual',
  'New_License': 'Nova Licença',
  'Account_Name': 'Nome da Conta',
  'Mirror_User': 'Usuário Espelho',
  'Reason': 'Motivo',
  'Third_Party_Domain': 'Domínio de Terceiros',
  'External_Email': 'E-mail Externo'
};

function translateFieldName(fieldName) {
  return fieldTranslations[fieldName] || fieldName.replace(/_/g, ' ');
}

document.addEventListener('DOMContentLoaded', ()=>{
  const templateSelect = document.getElementById('templateSelect');
  const fieldsBox = document.getElementById('templateFields');
  const fieldsContainer = document.getElementById('templateFieldsContainer');
  const generateBtn = document.getElementById('generateEmailBtn');
  const copyBtn = document.getElementById('copyEmailBtn');
  const subjectEl = document.getElementById('emailSubject');
  const bodyOut = document.getElementById('emailBodyOutput');
  const newRequirementsRow = document.getElementById('newRequirementsRow');
  const newRequirementsEl = document.getElementById('newRequirements');

  // Auto-resize textareas
  function autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, parseInt(getComputedStyle(this).maxHeight)) + 'px';
    });
  }

  [subjectEl, bodyOut, newRequirementsEl].forEach(el => autoResizeTextarea(el));

  async function refreshTemplates(){
    try{
      const res = await fetch('/api/templates');
      const list = await res.json();
      const prev = templateSelect.value;
      templateSelect.innerHTML = '';
      const newOpt = document.createElement('option'); newOpt.value='__new__'; newOpt.textContent='✨ Novo (via IA)'; templateSelect.appendChild(newOpt);
      for(const t of list){
        const opt = document.createElement('option'); opt.value = t.id; opt.textContent = t.name; templateSelect.appendChild(opt);
      }
      if(prev && Array.from(templateSelect.options).some(o=>o.value==prev)){
        templateSelect.value = prev; await loadTemplate(prev);
      } else if(list.length){ templateSelect.value = list[0].id; await loadTemplate(list[0].id); }
    }catch(e){ console.error('refreshTemplates error:', e); }
  }

  async function loadTemplate(id){
    console.log('Loading template:', id);
    const isNew = id === '__new__';
    newRequirementsRow.style.display = isNew ? 'block' : 'none';
    fieldsContainer.style.display = isNew ? 'none' : (id && id !== '__new__' ? 'block' : 'none');
    document.getElementById('saveTemplateBtn').style.display = 'none';
    
    try{
      if(isNew){ 
        fieldsBox.innerHTML = ''; 
        subjectEl.value = ''; 
        bodyOut.value = ''; 
        newRequirementsEl.value = '';
        return; 
      }
      
      const res = await fetch('/api/template/' + id);
      if (!res.ok) throw new Error('Template not found');
      
      const data = await res.json();
      subjectEl.value = data.name || '';
      fieldsBox.innerHTML = '';
      if (data.placeholders && data.placeholders.length > 0) {
        (data.placeholders||[]).forEach(ph=>{
          const div = document.createElement('div'); div.className='form-row';
          // show exact placeholder label (with brackets) when available
          const rawLabel = ph.includes('[') ? ph : ('[' + ph.replace(/_/g,' ') + ']');
          const lbl = document.createElement('label'); lbl.textContent = rawLabel;
          // keep id safe: remove non-alphanum
          const safeId = ph.replace(/[^A-Za-z0-9_]/g,'');
          const inp = document.createElement('input'); inp.id = 'fld_'+safeId; inp.type='text'; inp.placeholder = 'Insira ' + rawLabel;
          div.appendChild(lbl); div.appendChild(inp); fieldsBox.appendChild(div);
        });
      }
      bodyOut.value = data.text || '';
    }catch(e){ 
      console.error('loadTemplate error:', e);
      fieldsBox.innerHTML = '';
      bodyOut.value = '';
    }
  }

  // Helper: find template id by name (case-insensitive contains) and populate fields
  async function populateTemplateFieldsByName(templateName, generatedText){
    try{
      const res = await fetch('/api/templates');
      if(!res.ok) return false;
      const list = await res.json();
      const match = list.find(t => (t.name||'').toLowerCase() === (templateName||'').toLowerCase()) || list.find(t => (t.name||'').toLowerCase().includes((templateName||'').toLowerCase()));
      if(match){
        // load placeholders
        const tpl = await fetch('/api/template/' + match.id);
        if(tpl.ok){
          const data = await tpl.json();
          // build fields UI
          fieldsBox.innerHTML = '';
          if(data.placeholders && data.placeholders.length){
            data.placeholders.forEach(ph=>{
              const div = document.createElement('div'); div.className='form-row';
              const rawLabel = ph.includes('[') ? ph : ('[' + ph.replace(/_/g,' ') + ']');
              const lbl = document.createElement('label'); lbl.textContent = rawLabel;
              const safeId = ph.replace(/[^A-Za-z0-9_]/g,'');
              const inp = document.createElement('input'); inp.id = 'fld_'+safeId; inp.type='text'; inp.placeholder = 'Insira ' + rawLabel;
              div.appendChild(lbl); div.appendChild(inp); fieldsBox.appendChild(div);
            });
          }
          // set body to generated text (override template text)
          if(generatedText) bodyOut.value = generatedText;
          fieldsContainer.style.display = 'block';
          newRequirementsRow.style.display = 'none';
          return true;
        }
      }
      return false;
    }catch(e){ console.error('populateTemplateFieldsByName error', e); return false; }
  }

  function analystName(){ return localStorage.getItem('analystName') || ''; }
  function updateButtons(){ const disabled = !analystName(); generateBtn.disabled = disabled; copyBtn.disabled = disabled; }
  updateButtons();
  window.addEventListener('storage', updateButtons);

  templateSelect?.addEventListener('change', ()=>{ loadTemplate(templateSelect.value); });

  generateBtn?.addEventListener('click', async ()=>{
    console.log('Generate button clicked');
    const id = templateSelect.value; 
    if(!id) return alert('Selecione um modelo');
    
    const analyst = localStorage.getItem('analystName') || '';
    let text = '';
    let finalSubject = '';
    
    if(id === '__new__'){
      const prompt = newRequirementsEl.value || '';
      const subject = subjectEl.value || '';
      
      console.log('Generating new template with prompt:', prompt);
      if(!prompt) return alert('Preencha a descrição do que precisa para gerar um novo modelo.');
      if(!subject) return alert('Preencha o assunto do e-mail.');
      
      finalSubject = subject;
      
      try{
        console.log('Calling ML service at http://127.0.0.1:5001/generate');
        const ml = await fetch('http://127.0.0.1:5001/generate', { 
          method:'POST', 
          headers:{'Content-Type':'application/json'}, 
          body: JSON.stringify({ text: prompt, fields: { subject: subject, analyst } }) 
        });
        
        if(ml.ok){ 
          const jd = await ml.json(); 
          if(jd && jd.text) {
            text = jd.text;
            finalSubject = jd.subject || subject;
            console.log('ML generated successfully:', {intent: jd.intent, template_used: jd.template_used});
            // If ML reports a template_used, try to populate exact placeholders from that template
            if(jd.template_used){
              const ok = await populateTemplateFieldsByName(jd.template_used, jd.text);
              if(ok){
                // ensure subject is set from ML
                subjectEl.value = finalSubject;
                // stop further fallback handling
              } else {
                // fallback: try to extract placeholders from generated text
                const phs = Array.from(new Set((text.match(/\[([^\]]+)\]/g)||[]).map(s=>s.replace(/\[|\]/g,'').trim().replace(/\s+/g,'_'))));
                if(phs.length){
                  fieldsBox.innerHTML = '';
                  phs.forEach(ph=>{
                    const div = document.createElement('div'); div.className='form-row';
                    const rawLabel = ph.includes('[') ? ph : ('[' + ph.replace(/_/g,' ') + ']');
                    const lbl = document.createElement('label'); lbl.textContent = rawLabel;
                    const safeId = ph.replace(/[^A-Za-z0-9_]/g,'');
                    const inp = document.createElement('input'); inp.id = 'fld_'+safeId; inp.type='text'; inp.placeholder = 'Insira ' + rawLabel;
                    div.appendChild(lbl); div.appendChild(inp); fieldsBox.appendChild(div);
                  });
                  fieldsContainer.style.display = 'block'; newRequirementsRow.style.display='none';
                }
              }
            }
          }
        } else {
          console.warn('ML service returned status:', ml.status);
          throw new Error(`ML service returned ${ml.status}`);
        }
      }catch(e){
        console.warn('ML service error:', e.message);
        // Fallback: usar template padrão
        text = `Dear Team,\n\n${prompt}\n\nLet me know if you need any additional information.\n\nThank you for your assistance.`;
        finalSubject = subject;
      }
      
      // show save button
      document.getElementById('saveTemplateBtn').style.display = 'inline-block';
    } else {
      // substitute placeholders in existing template
      const inputs = {};
      fieldsBox.querySelectorAll('input').forEach(i=>{ inputs[i.id.replace('fld_','')] = i.value; });
      let body = bodyOut.value;
      for(const k of Object.keys(inputs)){
        const re = new RegExp('('+k+'):\\s*\\[[^\\]]+\\]','gi');
        body = body.replace(re, '$1: ' + (inputs[k] || ''));
      }
      text = body;
      finalSubject = subjectEl.value || '';
      document.getElementById('saveTemplateBtn').style.display = 'none';
    }
    
    // Garantir que o assunto não aparece no corpo
    if(text.startsWith('Subject:')) {
      text = text.split('\n').slice(1).join('\n').trim();
    }
    
    console.log('Final text length:', text.length);
    bodyOut.value = text;
    subjectEl.value = finalSubject;
    
    // Trigger auto-resize
    bodyOut.style.height = 'auto';
    bodyOut.style.height = Math.min(bodyOut.scrollHeight, parseInt(getComputedStyle(bodyOut).maxHeight)) + 'px';
  });

  copyBtn?.addEventListener('click', async ()=>{
    const subject = subjectEl.value.trim();
    const body = bodyOut.value.trim();
    
    if(!subject) return alert('Preencha o assunto primeiro'); 
    if(!body) return alert('Gere um e-mail primeiro'); 
    
    const full = `Subject: ${subject}\n\n${body}`;
    
    try{ 
      await navigator.clipboard.writeText(full); 
      alert('✓ Copiado para área de transferência!\n\nAssunto: ' + subject.substring(0, 50) + '...'); 
    }catch(e){ 
      console.error('Copy error:', e);
      alert('Não foi possível copiar'); 
    }
  });

  document.getElementById('clearEmailBtn')?.addEventListener('click', ()=>{
    templateSelect.value = '__new__';
    subjectEl.value = '';
    newRequirementsEl.value = '';
    bodyOut.value = '';
    fieldsBox.innerHTML = '';
    newRequirementsRow.style.display = 'block';
    fieldsContainer.style.display = 'none';
    document.getElementById('saveTemplateBtn').style.display = 'none';
    [subjectEl, bodyOut, newRequirementsEl].forEach(el => {
      el.style.height = 'auto';
    });
  });

  document.getElementById('saveTemplateBtn')?.addEventListener('click', async ()=>{
    const text = bodyOut.value || '';
    if(!text) return alert('Gere o e-mail antes de salvar.');
    // use subject as name; if empty, create IA-generated name
    const defaultName = subjectEl.value && subjectEl.value.trim() ? subjectEl.value.trim() : ('IA_Template_' + Date.now());
    const name = defaultName;
    try{
      const res = await fetch('/api/save-template', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, text }) });
      if(res.ok){ alert('Modelo salvo com sucesso!'); refreshTemplates(); document.getElementById('saveTemplateBtn').style.display='none'; }
      else{ const jd = await res.json().catch(()=>({})); alert('Erro ao salvar: '+(jd.error||res.statusText)); }
    }catch(e){ console.error('saveTemplate error', e); alert('Erro ao salvar: ' + e.message); }
  });

  refreshTemplates();
});
