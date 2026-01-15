console.log('app.js carregado ✅');

// ===== Helpers =====
const $ = (id) => document.getElementById(id);

function toast(text){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(()=>{ t.classList.add('show'); }, 10);
  setTimeout(()=>{ t.classList.remove('show'); t.remove(); }, 2200);
}

// Efeito de digitação estilo MS-DOS
function typewriterEffect(element, text, speed = 30) {
  return new Promise((resolve) => {
    element.value = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        element.value += text.charAt(i);
        element.scrollTop = element.scrollHeight; // auto-scroll
        i++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

// Efeito de digitação para elementos div (boot screen)
function typewriterDiv(element, text, speed = 30) {
  return new Promise((resolve) => {
    element.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

// Boot screen removed (legacy MS-DOS effect)

// Horário local no formato aceito por <input type="datetime-local">
function nowLocalISO(){
  const d = new Date();
  const tzoffset = d.getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzoffset).toISOString().slice(0,16); // yyyy-MM-ddTHH:mm
}

// ===== Categorias/Subcategorias =====
const categories = {
  usuario: { sub: ["criacao","extensao","reativacao","desativacao"] },
  vpn: { sub: ["configuracao","senha"] },
  instalacao: {
    sub: ["Office 365","Teams","Outlook","Adobe Reader","Navegador (Chrome/Edge/Firefox)","Antivírus","Aplicativo corporativo"]
  },
  genesys: { sub: null },
  so: { sub: ["formatacao","atualizacao","configuracao"] },
  sap: { sub: null },
  troca: {
    sub: ["Bateria","Teclado","Touchpad","Tela/LCD","Dobradicas/Hinges","Webcam","Microfone","Alto-falantes",
          "Fan/Ventoinha","Dissipador/Heatsink","Pasta térmica","Placa-mãe","RAM","SSD","HDD","Placa Wi‑Fi",
          "Botão Power/Board","DC-in/Jack","Carregador/Adaptador AC","Cabos (LVDS/eDP, SATA, flex)","Bateria CMOS",
          "Palmrest/Topcase","Tampa inferior","Moldura/Bezel","Pés de borracha","Parafusos"]
  }
};

// ===== Soluções básicas (PT/EN) =====
const basicSolutions = {
  pt: {
    usuario: {
      criacao: "Usuário criado e acessos provisionados.",
      extensao: "Extensão de acesso concluída.",
      reativacao: "Usuário reativado e acessos normalizados.",
      desativacao: "Usuário desativado conforme solicitação."
    },
    vpn: { configuracao: "VPN configurada e testada.", senha: "Senha da VPN atualizada com sucesso." },
    instalacao: "Aplicativo instalado e validado.",
    genesys: "Ajustes aplicados; funcionamento validado.",
    so: { formatacao: "Máquina formatada e configurada.", atualizacao: "Sistema atualizado e validado.", configuracao: "Configurações aplicadas e validadas." },
    sap: "Demanda SAP atendida conforme requerido.",
    troca: (peca) => `Peça substituída (${peca}) e funcionamento testado.`
  },
  en: {
    usuario: {
      criacao: "User created and access provisioned.",
      extensao: "Access extension completed.",
      reativacao: "User reactivated and access normalized.",
      desativacao: "User deactivated as requested."
    },
    vpn: { configuracao: "VPN configured and tested.", senha: "VPN password updated successfully." },
    instalacao: "Application installed and validated.",
    genesys: "Adjustments applied; operation validated.",
    so: { formatacao: "Machine formatted and configured.", atualizacao: "System updated and validated.", configuracao: "Configurations applied and validated." },
    sap: "SAP request fulfilled as required.",
    troca: (part) => `Part replaced (${part}) and operation tested.`
  }
};

function fillCategories(){
  const categorySelect = $("categorySelect");
  const opts = [
    {key:'usuario', label:'Usuário'},
    {key:'vpn', label:'VPN'},
    {key:'instalacao', label:'Instalação de aplicativo'},
    {key:'genesys', label:'Genesys'},
    {key:'so', label:'Sistema operacional'},
    {key:'sap', label:'SAP'},
    {key:'troca', label:'Troca de peças (notebook)'}
  ];
  categorySelect.innerHTML = '';
  for(const o of opts){
    const op = document.createElement('option');
    op.value = o.key; op.textContent = o.label;
    categorySelect.appendChild(op);
  }
  categorySelect.value = 'usuario';
}

function fillSubcategories(){
  const categorySelect = $("categorySelect");
  const subcategorySelect = $("subcategorySelect");
  const subcategoryRow = $("subcategoryRow");
  const catKey = categorySelect.value;
  const conf = categories[catKey];
  subcategorySelect.innerHTML = '';

  if(!conf || conf.sub === null){
    subcategoryRow.style.display = 'none';
    return;
  }
  subcategoryRow.style.display = '';

  const map = {
    usuario: { criacao:"Criação", extensao:"Extensão", reativacao:"Reativação", desativacao:"Desativação" },
    vpn: { configuracao:"Configuração", senha:"Senha" },
    so: { formatacao:"Formatação", atualizacao:"Atualização", configuracao:"Configuração" }
  };

  for(const s of conf.sub){
    const op = document.createElement('option');
    op.value = s; op.textContent = map[catKey]?.[s] ?? s;
    subcategorySelect.appendChild(op);
  }
}

// Pega a solução básica conforme idioma/categoria/subcategoria
function getBasicSolution(lang, catKey, subKey){
  const sol = basicSolutions[lang];
  if(!sol) return '';
  switch(catKey){
    case 'usuario': return sol.usuario[subKey] || '';
    case 'vpn': return sol.vpn[subKey] || '';
    case 'instalacao': return sol.instalacao + (subKey ? ` (${subKey})` : '');
    case 'genesys': return sol.genesys;
    case 'so': return sol.so[subKey] || '';
    case 'sap': return sol.sap;
    case 'troca': return sol.troca(subKey || 'peça');
    default: return '';
  }
}

// Monta a mensagem (com fallback de data/hora)
function buildMessage(lang){
  const categorySelect = $("categorySelect");
  const subcategorySelect = $("subcategorySelect");
  const subcategoryRow = $("subcategoryRow");
  const channelSelect = $("channelSelect");
  const messageType = $("messageType");

  const catLabel = categorySelect.options[categorySelect.selectedIndex]?.text || '';
  const subLabel = (subcategoryRow.style.display === 'none')
    ? '' : (subcategorySelect.options[subcategorySelect.selectedIndex]?.text || '');

  // Usa o valor do campo; se estiver vazio, aplica "agora" e reflete no campo
  let dtRaw = ($("datetime").value || '');
  if (!dtRaw) {
    dtRaw = nowLocalISO();
    $("datetime").value = dtRaw;
  }
  const dt = dtRaw.replace('T',' ');

  const id = ($("ticketId").value || '').trim() || 'XXX';
  const req = ($("requesterName").value || '').trim() || (lang==='pt' ? 'usuário' : 'user');
  const agt = ($("agentName").value || '').trim() || (lang==='pt' ? 'suporte' : 'support');

  const catKey = categorySelect.value;
  const subKey = (subcategoryRow.style.display === 'none') ? '' : (subcategorySelect.value || '');
  const basic = getBasicSolution(lang, catKey, subKey);

  const isTeams = channelSelect.value === 'teams';
  const isClosure = messageType.value === 'closure';

  let msg = '';
  if(isTeams){
    if(lang === 'pt'){
      msg = !isClosure
        ? `Olá ${req}, tudo bem?\nEstou atendendo o chamado #${id} — ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Solução básica: ' + basic + '\n' : ''}Fico à disposição por aqui.\nResponsável: ${agt} | ${dt}`
        : `Olá ${req},\nEncerramos o chamado #${id} — ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Solução aplicada: ' + basic + '\n' : ''}Se algo não estiver resolvido, responda por aqui que reabrimos.\nResponsável: ${agt} | ${dt}`;
    } else {
      msg = !isClosure
        ? `Hi ${req}, hope you are well.\nI am working on ticket #${id} — ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Basic solution: ' + basic + '\n' : ''}Feel free to reply here if you need anything.\nOwner: ${agt} | ${dt}`
        : `Hello ${req},\nWe have closed ticket #${id} — ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Applied solution: ' + basic + '\n' : ''}If anything is not resolved, please reply here and we will reopen.\nOwner: ${agt} | ${dt}`;
    }
  } else {
    msg = (lang==='pt')
      ? `Chamado #${id} encerrado.\nCategoria: ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Solução: ' + basic + '\n' : ''}Data/Hora: ${dt}\nResponsável: ${agt}`
      : `Ticket #${id} closed.\nCategory: ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Solution: ' + basic + '\n' : ''}Date/Time: ${dt}\nOwner: ${agt}`;
  }
  return msg.trim();
}

// ===== Inicialização segura =====
function boot(){
  // try to initialize cloud (Firestore) early — prefer cloud-only operation
  if(typeof initCloudAuth === 'function'){
    initCloudAuth().then((ok)=>{ if(ok) toast('Modo nuvem ativado (Firestore)'); else toast('Modo local — nuvem não ativada'); }).catch(()=>{ toast('Modo local — falha ao ativar nuvem'); });
  }
  // Pré-preenche com o horário atual na primeira carga
  const dt = $("datetime");
  if (dt && !dt.value) dt.value = nowLocalISO();

  fillCategories();
  fillSubcategories();

  const cat = $("categorySelect");
  if (cat) cat.addEventListener('change', fillSubcategories);

  const out = $("output");

  // Atualiza a data/hora no momento do clique e gera
  $("generateMsgPTBtn")?.addEventListener('click', async ()=>{
    $("datetime").value = nowLocalISO();
    const msg = buildMessage('pt');
    await typewriterEffect(out, msg, 20);
  });

  // convenience: Ctrl+S shortcut removed because DB/save button disabled

  // Authentication removed: cloud auth/UI disabled to simplify deployment

  // Save functionality removed — DB pages and save button are disabled

  $("generateMsgENBtn")?.addEventListener('click', async ()=>{
    $("datetime").value = nowLocalISO();
    const msg = buildMessage('en');
    await typewriterEffect(out, msg, 20);
  });

  $("generateMsgDualBtn")?.addEventListener('click', async ()=>{
    $("datetime").value = nowLocalISO();
    const pt = buildMessage('pt');
    const en = buildMessage('en');
    const msg = `${pt}\n\n---\n\n${en}`;
    await typewriterEffect(out, msg, 20);
  });

  $("copyMsgBtn")?.addEventListener('click', async ()=>{
    if(!out.value) return;
    try{ await navigator.clipboard.writeText(out.value); toast('Copiado!'); }
    catch(e){ toast('Copie manualmente o texto.'); }
  });

  $("clearMsgBtn")?.addEventListener('click', ()=>{
    out.value = '';
    $("messageForm").reset();
    $("datetime").value = nowLocalISO();   // ao limpar, já coloca horário atual
    fillCategories();                      // repopula categorias
    toast('Campos limpos.');
  });

  // Local save removed

  // ===== Senhas =====
  const pwOut = $("pwOutput");
  $("generatePwBtn")?.addEventListener('click', async ()=>{
    const name = ($("pwName").value||'').toLowerCase().replace(/\s+/g,'');
    const user = ($("pwUsername").value||'').toLowerCase();
    const len = Math.max(12, parseInt(($("pwLength").value||'12'),10));
    const symbolsOn = $("pwSymbols").checked;

    const lowers='abcdefghijkmnopqrstuvwxyz', uppers='ABCDEFGHJKLMNPQRSTUVWXYZ', digits='23456789', symbols='!@#$%?';
    const pool = lowers+uppers+digits+(symbolsOn?symbols:'');
    function randomChar(pool){ return pool[Math.floor(Math.random()*pool.length)]; }

    const commonWords = ['password','senha','qwerty','123456','12345','123456789','abcdef','abc123','admin',
                         'welcome','iloveyou','monkey','dragon','111111','baseball','letmein','football',
                         'princess','login','passw0rd','654321','superman','pokemon','shadow'];
    const commonSeq = ['123','321','abc','qwe','000','111','999'];

    function violates(s){
      const hasLower=/[a-z]/.test(s), hasUpper=/[A-Z]/.test(s), hasDigit=/\d/.test(s), long=s.length>=12;
      const nameHit=!!(name && s.toLowerCase().includes(name.slice(0,Math.min(4,name.length))));
      const userHit=!!(user && s.toLowerCase().includes(user.slice(0,Math.min(4,user.length))));
      const wordHit=commonWords.some(w=>s.toLowerCase().includes(w)), seqHit=commonSeq.some(seq=>s.includes(seq));
      return !(hasLower&&hasUpper&&hasDigit&&long) || nameHit || userHit || wordHit || seqHit;
    }

    let c='';
    while(true){
      const arr=[];
      arr.push(randomChar(lowers));
      arr.push(randomChar(uppers));
      arr.push(randomChar(digits));
      if(symbolsOn) arr.push(randomChar(symbols));
      while(arr.length<len){ arr.push(randomChar(pool)); }
      for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];
      }
      c=arr.join('');
      if(!violates(c)) break;
    }
    await typewriterEffect(pwOut, c, 50);
  });

  $("copyPwBtn")?.addEventListener('click', async ()=>{
    if(!pwOut.value) return;
    try{ await navigator.clipboard.writeText(pwOut.value); toast('Copiado!'); }
    catch(e){ toast('Copie manualmente a senha.'); }
  });

  $("clearPwBtn")?.addEventListener('click', ()=>{
    $("passwordForm").reset();
    pwOut.value='';
    toast('Campos limpos.');
  });

  // Legacy MS-DOS visual effects removed
}


// Binary rain implementation (canvas-based "Matrix" effect)
class BinaryRain {
  constructor(canvasId='bgCanvas', opts={}){
    this.canvas = document.getElementById(canvasId);
    if(!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    // adaptive settings
    this.minFont = opts.minFont || 8;
    this.maxFont = opts.maxFont || 18;
    this.targetColumns = opts.targetColumns || 40; // aim for ~columns across width

    this.color = opts.color || 'rgba(0,255,102,0.9)';
    this.bgFade = typeof opts.bgFade === 'number' ? opts.bgFade : 0.05;
    this.chars = ['0','1'];

    this.resize = this.resize.bind(this);
    this.running = false;
    this._lastFrameTime = 0;
    this.fpsCap = opts.fpsCap || 60;

    window.addEventListener('resize', this.resize);
    this.resize();
  }
  resize(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);

    // adaptive font sizing: aim for targetColumns across the width
    const computedFont = Math.max(this.minFont, Math.min(this.maxFont, Math.round(w / this.targetColumns)));
    this.fontSize = computedFont;

    // on small screens reduce FPS to save battery (auto-adjust)
    if(w < 700) this.fpsCap = 30; else this.fpsCap = 60;

    this.columns = Math.max(4, Math.floor(w / this.fontSize));
    this.drops = new Array(this.columns).fill(0).map(()=>Math.floor(Math.random()*Math.max(1,Math.floor(h/this.fontSize))));
    this.width = w; this.height = h;
    this.ctx.font = `${this.fontSize}px monospace`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
  }
  draw(timestamp){
    if(!this.running) return;
    // throttle frame rate according to fpsCap
    if(!timestamp) timestamp = performance.now();
    const elapsed = timestamp - (this._lastFrameTime || 0);
    const minFrameTime = 1000 / this.fpsCap;
    if(elapsed < minFrameTime){
      this._raf = requestAnimationFrame((t)=>this.draw(t));
      return;
    }
    this._lastFrameTime = timestamp;

    // slight fade to create trailing effect
    this.ctx.fillStyle = `rgba(0,0,0,${this.bgFade})`;
    this.ctx.fillRect(0,0,this.width,this.height);
    this.ctx.fillStyle = this.color;

    for(let i=0;i<this.columns;i++){
      const ch = this.chars[Math.random() > 0.5 ? 0 : 1];
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;
      this.ctx.fillText(ch, x, y);
      if(y > this.height && Math.random() > 0.975){
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }
    this._raf = requestAnimationFrame((t)=>this.draw(t));
  }
  start(){
    if(!this.canvas || this.running) return;
    this.running = true;
    // initial clear
    this.ctx.fillStyle = 'rgba(0,0,0,1)';
    this.ctx.fillRect(0,0,this.width||this.canvas.width,this.height||this.canvas.height);
    this._lastFrameTime = performance.now();
    this._raf = requestAnimationFrame((t)=>this.draw(t));
  }
  stop(){
    this.running = false;
    if(this._raf) cancelAnimationFrame(this._raf);
  }
}

  // ===== Tab switching (nav) =====
  function initTabs(){
    const wrapper = document.querySelector('.wrapper');
    const tabButtons = Array.from(document.querySelectorAll('.tabbar [data-tab]'));
    const sections = Array.from(document.querySelectorAll('[data-tab]'));

    function setActive(tab){
      tabButtons.forEach(b=> b.classList.toggle('active', b.getAttribute('data-tab')===tab));
      // set wrapper class
      wrapper.classList.remove('tab-messages','tab-passwords','tab-emails');
      if(tab) wrapper.classList.add('tab-'+tab);
      // show/hide sections
      const match = sections.filter(s=>s.getAttribute('data-tab')===tab);
      if(match.length){ sections.forEach(s=>{ s.style.display = match.includes(s) ? '' : 'none'; }); }
      try{ localStorage.setItem('activeTab', tab); }catch(e){}
    }

    tabButtons.forEach(b=> b.addEventListener('click', ()=>{ const t=b.getAttribute('data-tab'); setActive(t); }));

    // initial: try to restore last tab or default to messages
    const last = (function(){ try{ return localStorage.getItem('activeTab'); }catch(e){ return null } })() || 'messages';
    setActive(last);
  }

  // call initTabs during boot
let bgRain = null;
function startBinaryRain(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.getElementById('bgCanvas');
  if(!c) return;
  bgRain?.stop();
  bgRain = new BinaryRain('bgCanvas', {fontSize: 14, color: 'rgba(0,255,102,0.9)', bgFade: 0.06});
  bgRain.start();
}
function stopBinaryRain(){ if(bgRain) bgRain.stop(); }

// Animation: transform elements to binary and make them fall, then restore
function getAllElementsToAnimate(){
  const items = [];
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer');
  if(header) items.push(header);
  document.querySelectorAll('.card').forEach(c=>items.push(c));
  return items;
}

async function animateElementsToBinary(elems){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if(window._binaryAnimating) return;
  window._binaryAnimating = true;
  const overlays = [];
  const promises = [];
  for(const el of elems){
    const rect = el.getBoundingClientRect();
    if(rect.width < 20 || rect.height < 10) continue;
    const overlay = document.createElement('div');
    overlay.className = 'binary-overlay';
    Object.assign(overlay.style,{ left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px', zIndex: 10050 });
    document.body.appendChild(overlay);
    el.dataset._vis = el.style.visibility || '';
    el.style.visibility = 'hidden';
    const count = Math.max(8, Math.min(120, Math.floor(rect.width / 14) * Math.max(1, Math.floor(rect.height / 24))));
    let longest = 0;
    for(let i=0;i<count;i++){
      const span = document.createElement('span');
      span.className = 'binary-char';
      span.textContent = Math.random() > 0.5 ? '0' : '1';
      // smaller, less intrusive sizes
      const base = Math.max(8, Math.round(rect.height / 10));
      const fs = Math.max(8, Math.min(20, Math.round(base * (0.6 + Math.random()*0.7))));
      span.style.fontSize = fs + 'px';
      span.style.lineHeight = '1';
      span.style.left = Math.floor(Math.random() * Math.max(1, rect.width - fs)) + 'px';
      span.style.top = Math.floor(Math.random() * Math.max(1, rect.height * 0.35)) + 'px';
      const dur = 500 + Math.floor(Math.random() * 800);
      const del = Math.floor(Math.random() * 240);
      span.style.animationDuration = dur + 'ms';
      span.style.animationDelay = del + 'ms';
      span.style.opacity = (0.7 + Math.random()*0.35).toFixed(2);
      overlay.appendChild(span);
      longest = Math.max(longest, dur + del);
      span.addEventListener('animationend', ()=>span.remove(), {once:true});
    }
    overlays.push({overlay, el, longest});
    promises.push(new Promise(resolve => setTimeout(resolve, longest + 80)));
  }
  await Promise.all(promises);

  // SECOND PHASE: rebuild (inverse) — rise binary chars that assemble and then reveal the element
  const rebuildPromises = [];
  for(const item of overlays){
    const rect = item.el.getBoundingClientRect();
    const rebuildCount = Math.max(6, Math.min(80, Math.floor(rect.width / 18) * Math.max(1, Math.floor(rect.height / 90))));
    let longestRebuild = 0;
    for(let i=0;i<rebuildCount;i++){
      const span = document.createElement('span');
      span.className = 'binary-char rebuild';
      span.textContent = Math.random() > 0.5 ? '0' : '1';
      const finalTop = Math.floor(Math.random() * Math.max(1, rect.height * 0.8));
      const finalLeft = Math.floor(Math.random() * Math.max(1, rect.width - 8));
      span.style.left = finalLeft + 'px';
      span.style.top = finalTop + 'px';
      const dur = 420 + Math.floor(Math.random() * 700);
      const del = 60 + Math.floor(Math.random() * 260);
      span.style.animationDuration = dur + 'ms';
      span.style.animationDelay = del + 'ms';
      span.style.fontSize = Math.max(8, Math.floor(8 + Math.random() * 10)) + 'px';
      span.style.opacity = (0.6 + Math.random()*0.5).toFixed(2);
      item.overlay.appendChild(span);
      longestRebuild = Math.max(longestRebuild, dur + del);
      span.addEventListener('animationend', ()=>span.remove(), {once:true});
    }
    rebuildPromises.push(new Promise(resolve => setTimeout(resolve, longestRebuild + 60)));
  }
  await Promise.all(rebuildPromises);

  // remove overlays and reveal elements with assemble animation
  for(const item of overlays){
    item.overlay.remove();
    item.el.style.visibility = item.el.dataset._vis || '';
    item.el.classList.add('binary-assembled');
    const onDone = ()=>{ item.el.classList.remove('binary-assembled'); item.el.removeEventListener('animationend', onDone); };
    item.el.addEventListener('animationend', onDone);
    delete item.el.dataset._vis;
  }

  window._binaryAnimating = false;
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', boot);

// ensure tabs init when boot runs
document.addEventListener('DOMContentLoaded', ()=>{ try{ if(typeof initTabs === 'function') initTabs(); }catch(e){ console.error('initTabs error', e); } });
