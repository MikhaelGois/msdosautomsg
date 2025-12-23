// Database functionality removed — this script is intentionally empty.
// Authentication removed: do not force redirects. If CloudAuth/CloudDB are present,
// the page will integrate with them; otherwise the page works in local mode.

async function fetchRecords(q={}){
  const params = new URLSearchParams();
  Object.keys(q).forEach(k=>{ if(q[k]) params.set(k,q[k]); });
  const res = await fetch('/api/records?'+params.toString());
  if(!res.ok) throw new Error('failed');
  return await res.json();
} 

function rowHtml(r, isAdmin){
  const actions = isAdmin ? `<button class="btn" data-action="edit" data-id="${r.id}" title="Editar registro">✎</button> <button class="btn ghost" data-action="delete" data-id="${r.id}" title="Excluir registro">🗑</button>` : '';
  return `<tr><td class="small monospace">${r.id}</td><td class="monospace">${r.ticket}</td><td>${r.agent}</td><td>${r.datetime}</td><td>${r.category}</td><td>${r.subcategory}</td><td>${r.requester}</td><td class="monospace">${r.createdAt}</td><td class="small">${actions}</td></tr>`;
}

// Modal helpers (reusable)
function openModal(){ const bd = document.getElementById('modalBackdrop'); if(!bd) return; bd.classList.add('show'); bd.setAttribute('aria-hidden','false'); const close = document.getElementById('modalClose'); if(close) close.focus(); }
function closeModal(){ const bd = document.getElementById('modalBackdrop'); if(!bd) return; bd.classList.remove('show'); bd.setAttribute('aria-hidden','true'); const t = document.getElementById('modalTitle'); const b = document.getElementById('modalBody'); const f = document.getElementById('modalFooter'); if(t) t.textContent=''; if(b) b.innerHTML=''; if(f) f.innerHTML=''; }

function showConfirm(message){ return new Promise((resolve)=>{
  document.getElementById('modalTitle').textContent = 'Confirmação';
  document.getElementById('modalBody').innerHTML = `<p>${message}</p>`;
  document.getElementById('modalFooter').innerHTML = `<button class="btn" id="_confirmYes">Sim</button><button class="btn ghost" id="_confirmNo">Não</button>`;
  openModal();
  document.getElementById('_confirmYes').addEventListener('click', ()=>{ closeModal(); resolve(true); });
  document.getElementById('_confirmNo').addEventListener('click', ()=>{ closeModal(); resolve(false); });
}); }

function showEditModal(rec){ return new Promise((resolve)=>{
  const body = document.getElementById('modalBody');
  if(!body) return resolve(null);
  body.innerHTML = `
    <div class="form-row"><label>Ticket</label><input id="_m_ticket" value="${rec.ticket||''}" /></div>
    <div class="form-row"><label>Atendente</label><input id="_m_agent" value="${rec.agent||''}" /></div>
    <div class="form-row"><label>Data/Hora</label><input id="_m_datetime" value="${rec.datetime||''}" /></div>
    <div class="form-row"><label>Categoria</label><input id="_m_category" value="${rec.category||''}" /></div>
    <div class="form-row"><label>Subcategoria</label><input id="_m_subcategory" value="${rec.subcategory||''}" /></div>
    <div class="form-row"><label>Solicitante</label><input id="_m_requester" value="${rec.requester||''}" /></div>
  `;
  document.getElementById('modalTitle').textContent = `Editar registro ${rec.id}`;
  document.getElementById('modalFooter').innerHTML = `<button class="btn" id="_saveEdit">Salvar</button><button class="btn ghost" id="_cancelEdit">Cancelar</button>`;
  openModal();
  document.getElementById('_cancelEdit').addEventListener('click', ()=>{ closeModal(); resolve(null); });
  document.getElementById('_saveEdit').addEventListener('click', async ()=>{
    const ticket = document.getElementById('_m_ticket').value.trim();
    const agent = document.getElementById('_m_agent').value.trim();
    const datetime = document.getElementById('_m_datetime').value.trim();
    const category = document.getElementById('_m_category').value.trim();
    const subcategory = document.getElementById('_m_subcategory').value.trim();
    const requester = document.getElementById('_m_requester').value.trim();
    closeModal();
    try{ await CloudDB.updateRecord(rec.id, { ticket, agent, datetime, category, subcategory, requester }); toast('Registro atualizado'); resolve(true); }
    catch(err){ toast('Falha ao salvar: '+(err.message||err)); resolve(false); }
  });
}); }

async function load(){
  const q = { ticket:document.getElementById('f-ticket').value.trim(), agent:document.getElementById('f-agent').value.trim(), requester:document.getElementById('f-requester').value.trim(), category:document.getElementById('f-category').value.trim() };
  try{
    // determine admin state
    let isAdmin = false;
    if(typeof CloudAuth !== 'undefined' && typeof CloudAuth.getUser === 'function' && CloudAuth.getUser()){
      try{ const doc = await CloudAuth.fetchCurrentUserDoc(); if(doc && doc.isAdmin) isAdmin = true; }catch(e){}
    }

    const data = (typeof CloudDB !== 'undefined' && typeof CloudDB.fetchRecords === 'function') ? await CloudDB.fetchRecords(q) : await fetchRecords(q);
    const tbody = document.querySelector('#records-table tbody');
    tbody.innerHTML = data.map(d=> rowHtml(d, isAdmin)).join('') || '<tr><td colspan="9" class="muted">Nenhum registro</td></tr>';
    const exportHref = '/api/export.csv?'+ new URLSearchParams(q).toString();
    document.getElementById('btn-export').href = exportHref;

    // wire admin actions
    if(isAdmin){
      document.querySelectorAll('button[data-action="edit"]').forEach(btn=> btn.addEventListener('click', onEditRecord));
      document.querySelectorAll('button[data-action="delete"]').forEach(btn=> btn.addEventListener('click', onDeleteRecord));
      document.getElementById('btn-admin-toggle').style.display='inline-block';
    } else { document.getElementById('btn-admin-toggle').style.display='none'; }



  }catch(e){ toast('Erro ao buscar registros. Verifique se o servidor local (npm start) ou habilite a nuvem.'); }
}

async function onEditRecord(e){
  const id = e.currentTarget.dataset.id;
  // fetch record data from cloud
  try{
    const records = await CloudDB.fetchRecords({});
    const rec = records.find(r=> r.id === id);
    if(!rec){ toast('Registro não encontrado'); return; }
    const ticket = prompt('Ticket', rec.ticket) || rec.ticket;
    const agent = prompt('Atendente', rec.agent) || rec.agent;
    const datetime = prompt('Data/Hora (YYYY-MM-DDTHH:mm)', rec.datetime) || rec.datetime;
    const category = prompt('Categoria', rec.category) || rec.category;
    const subcategory = prompt('Subcategoria', rec.subcategory) || rec.subcategory;
    const requester = prompt('Solicitante', rec.requester) || rec.requester;
    await CloudDB.updateRecord(id, { ticket, agent, datetime, category, subcategory, requester });
    toast('Registro atualizado');
    await load();
  }catch(err){ toast('Falha ao atualizar: '+(err.message||err)); }
}

async function onDeleteRecord(e){
  const id = e.currentTarget.dataset.id;
  if(!confirm('Confirma exclusão do registro '+id+' ?')) return;
  try{ await CloudDB.deleteRecord(id); toast('Registro removido'); await load(); }catch(err){ toast('Falha ao excluir: '+(err.message||err)); }
}

document.getElementById('btn-filter').addEventListener('click', load);
document.getElementById('btn-clear').addEventListener('click', ()=>{ document.getElementById('f-ticket').value=''; document.getElementById('f-agent').value=''; document.getElementById('f-requester').value=''; document.getElementById('f-category').value=''; load(); });

window.addEventListener('load', async ()=>{ try{ await load(); }catch(e){ console.warn('load() falhou:', e); }
  // show current user and wire back/send buttons (attach even if load failed)
  const ub = document.getElementById('userBadge');
  const btnBack = document.getElementById('btn-back');
  const btnSend = document.getElementById('btn-send-me');
  if(btnBack){
    // Minimal, clean handler: try history.back(), fallback to index.html
    const doBack = ()=>{
      try{
        if(window.history && history.length>1){ const before = location.href; history.back(); setTimeout(()=>{ if(location.href === before) window.location.href = 'index.html'; }, 400); }
        else { window.location.href = 'index.html'; }
      }catch(e){ window.location.href='index.html'; }
    };
    btnBack.addEventListener('click', doBack);
    btnBack.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' ' || ev.key==='Spacebar'){ ev.preventDefault(); doBack(); } });
  }
  if(ub){
    if(typeof CloudAuth !== 'undefined' && typeof CloudAuth.getUser === 'function' && CloudAuth.getUser()){
      try{ const u = CloudAuth.getUser(); const doc = await CloudAuth.fetchCurrentUserDoc(); ub.textContent = `${u.displayName || u.email}${(doc && doc.isAdmin) ? ' (Admin)' : ''}`; }catch(e){ ub.textContent = 'Modo local'; }
    } else { ub.textContent = 'Modo local'; }
  }
  if(btnSend){
    btnSend.addEventListener('click', async ()=>{
      let info = '';
      if(typeof CloudAuth !== 'undefined' && typeof CloudAuth.getUser === 'function' && CloudAuth.getUser()){
        try{ const u = CloudAuth.getUser(); const doc = await CloudAuth.fetchCurrentUserDoc(); info = `Usuário: ${u.displayName || u.email} <${u.email}>\nAdmin: ${(doc && doc.isAdmin) ? 'sim' : 'não'}`; }
        catch(e){ info = 'Modo local — sem usuário logado'; }
      } else info = 'Modo local — sem usuário logado';
      try{ await navigator.clipboard.writeText(info); toast('Dados copiados para a área de transferência'); }catch(e){ toast(info); }
    });
  }
  // wire OneDrive export button if configured
  const btn = document.getElementById('btn-export-onedrive');
  if(window.oneDriveConfig){
    btn.style.display='inline-block';
    btn.addEventListener('click', async ()=>{
      try{
        // fetch current filtered records
        const q = { ticket:document.getElementById('f-ticket').value.trim(), agent:document.getElementById('f-agent').value.trim(), requester:document.getElementById('f-requester').value.trim(), category:document.getElementById('f-category').value.trim() };
        const data = await (window.cloudEnabled ? CloudDB.fetchRecords(q) : fetchRecords(q));
        const res = await fetch('/api/export.csv?'+new URLSearchParams(q).toString());
        const txt = await res.text();
        // If OneDrive.js available, fetch CSV text and upload
        if(typeof OneDrive!=='undefined' && OneDrive){
          await OneDrive.uploadCsv(txt, 'dosautomsg_records_'+(new Date().toISOString().slice(0,10))+'.csv');
          toast('Exportado para OneDrive');
        } else toast('OneDrive não configurado (adicione onedrive-config.js e onedrive.js se desejar).');
      }catch(e){ toast('Falha no upload para OneDrive: '+(e.message||e)); }
    });
  }

  // admin toggle
  document.getElementById('btn-admin-toggle').addEventListener('click', async ()=>{
    const panel = document.getElementById('adminPanel');
    if(panel.style.display==='none' || !panel.style.display){
      // load users
      try{
        const users = await CloudDB.fetchUsers();
        const ul = document.getElementById('usersList');
        ul.innerHTML = users.map(u=> `<div style="display:flex;align-items:center;gap:12px;padding:6px;border-bottom:1px dashed rgba(0,255,102,.04)"><div style="flex:1"><strong>${u.displayName||'(no name)'}</strong> <span style="color:var(--green-dim)">${u.email||''}</span></div><div><label style="margin-right:8px">Admin</label><input type="checkbox" data-uid="${u.id}" ${u.isAdmin? 'checked' : ''} /></div><div><button class="btn ghost" data-uid="${u.id}" data-action="delete-user">Excluir</button></div></div>`).join('');
        // wire checkboxes and delete buttons
        document.querySelectorAll('#usersList input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', async (e)=>{ const uid = e.target.dataset.uid; try{ await CloudDB.setUserAdmin(uid, e.target.checked); toast('Atualizado'); }catch(err){ toast('Falha: '+(err.message||err)); } }));
        document.querySelectorAll('#usersList button[data-action="delete-user"]').forEach(btn=> btn.addEventListener('click', async (e)=>{ const uid = e.currentTarget.dataset.uid; if(uid === (CloudAuth.getUser() && CloudAuth.getUser().uid)) { toast('Você não pode excluir sua própria conta aqui.'); return; } try{ const ok = await showConfirm('Excluir usuário do cadastro? Isso remove o documento de perfil, mas não deleta a conta do Auth.'); if(!ok) return; await CloudDB.deleteUserDoc(uid); toast('Usuário removido'); // reload users
          const users2 = await CloudDB.fetchUsers(); document.getElementById('usersList').innerHTML = users2.map(u=> `<div style="display:flex;align-items:center;gap:12px;padding:6px;border-bottom:1px dashed rgba(0,255,102,.04)"><div style="flex:1"><strong>${u.displayName||'(no name)'}</strong> <span style="color:var(--green-dim)">${u.email||''}</span></div><div><label style="margin-right:8px">Admin</label><input type="checkbox" data-uid="${u.id}" ${u.isAdmin? 'checked' : ''} /></div><div><button class="btn ghost" data-uid="${u.id}" data-action="delete-user">Excluir</button></div></div>`).join(''); }catch(err){ toast('Falha: '+(err.message||err)); } }));
        panel.style.display='block';
      }catch(e){ toast('Falha ao carregar usuários: '+(e.message||e)); }
    } else { panel.style.display='none'; }
  });
});