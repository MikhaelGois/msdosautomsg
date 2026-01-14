
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

// Boot screen MS-DOS
async function showDosBootScreen() {
  const bootScreen = document.getElementById('dosBootScreen');
  const bootText = document.getElementById('dosBootText');
  
  if (!bootScreen || !bootText) return;
  
  const fullMessage = 'Microsoft(R) MS-DOS Version 6.22\nStarting MS-DOS...\nLoading system utilities...\nLoading message generator... OK\nLoading password generator... OK\nSystem ready.';
  
  await typewriterDiv(bootText, fullMessage, 15);
  await new Promise(resolve => setTimeout(resolve, 400));
  bootScreen.classList.add('hidden');
  await new Promise(resolve => setTimeout(resolve, 400));
  bootScreen.remove();
}

// pequenas utilitárias
function randomOf(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

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

// ===== Soluções básicas (PT apenas) =====
const basicSolutions = {
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
function getBasicSolution(catKey, subKey){
  switch(catKey){
    case 'usuario': return basicSolutions.usuario[subKey] || '';
    case 'vpn': return basicSolutions.vpn[subKey] || '';
    case 'instalacao': return basicSolutions.instalacao + (subKey ? ` (${subKey})` : '');
    case 'genesys': return basicSolutions.genesys;
    case 'so': return basicSolutions.so[subKey] || '';
    case 'sap': return basicSolutions.sap;
    case 'troca': return basicSolutions.troca(subKey || 'peça');
    default: return '';
  }
}

// Monta a mensagem (com fallback de data/hora)
// Gera mensagem (PT apenas). Mensagens usam variações para evitar repetição.
function buildMessage(){
  const categorySelect = $("categorySelect");
  const subcategorySelect = $("subcategorySelect");
  const subcategoryRow = $("subcategoryRow");
  const channelSelect = $("channelSelect");
  const messageType = $("messageType");
  const catLabel = categorySelect.options[categorySelect.selectedIndex]?.text || '';
  const subLabel = (subcategoryRow.style.display === 'none')
    ? '' : (subcategorySelect.options[subcategorySelect.selectedIndex]?.text || '');

  const id = ($("ticketId").value || '').trim() || 'XXX';
  const req = ($("requesterName").value || '').trim() || 'usuário';

  const catKey = categorySelect.value;
  const subKey = (subcategoryRow.style.display === 'none') ? '' : (subcategorySelect.value || '');
  const basic = getBasicSolution(catKey, subKey);

  const isTeams = channelSelect.value === 'teams';
  const isClosure = messageType.value === 'closure';

  // variações para tornar as mensagens menos repetitivas
  const greetings = ['Olá', 'Bom dia', 'Boa tarde', 'Olá, tudo bem?'];
  const intros = ['Estou verificando', 'Iniciando atendimento sobre', 'Analisando'];
  const closings = ['Fico à disposição.', 'Qualquer dúvida, me retorne.', 'Permaneço à disposição.'];

  const greet = randomOf(greetings);
  const intro = randomOf(intros);
  const sign = randomOf(closings);

  let msg = '';
  if(isTeams){
    if(!isClosure){
      msg = `${greet} ${req},\n${intro} o chamado #${id} — ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Solução sugerida: ' + basic + '\n' : ''}${sign}`;
    } else {
      msg = `${greet} ${req},\nEncerramos o chamado #${id} — ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Solução aplicada: ' + basic + '\n' : ''}Se não estiver resolvido, por favor responda aqui.\n${sign}`;
    }
  } else {
    msg = `Chamado #${id} ${isClosure ? 'encerrado' : 'em andamento'}.\nCategoria: ${catLabel}${subLabel ? ' / ' + subLabel : ''}.\n${basic ? 'Solução: ' + basic + '\n' : ''}${sign}`;
  }
  return msg.trim();
}

// ===== Inicialização segura =====
function boot(){
  // try to initialize cloud (Firestore) early — prefer cloud-only operation
  if(typeof initCloudAuth === 'function'){
    initCloudAuth().then((ok)=>{ if(ok) toast('Modo nuvem ativado (Firestore)'); else toast('Modo local — nuvem não ativada'); }).catch(()=>{ toast('Modo local — falha ao ativar nuvem'); });
  }
  // data/hora removidos da UI — não préenche

  fillCategories();
  fillSubcategories();

  const cat = $("categorySelect");
  if (cat) cat.addEventListener('change', fillSubcategories);

  const out = $("output");

  // Gera mensagem em PT (apenas)
  $("generateMsgPTBtn")?.addEventListener('click', async ()=>{
    const msg = buildMessage();
    await typewriterEffect(out, msg, 20);
  });

  // convenience: press Ctrl+S to save current record when on the page
  document.addEventListener('keydown', (e)=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); $("saveRecordBtn")?.click(); }
  });

  // require analyst identification (no password)
  function setAnalyst(name){
    if(!name) return false;
    localStorage.setItem('analystName', name);
    document.querySelectorAll('.analyst-name').forEach(el=>el.textContent = name);
    return true;
  }
  let analyst = localStorage.getItem('analystName');
  if(!analyst){
    const name = prompt('Enter your analyst name (required):');
    if(name && name.trim()){ setAnalyst(name.trim()); analyst = name.trim(); }
  } else {
    document.querySelectorAll('.analyst-name').forEach(el=>el.textContent = analyst);
  }

  // Authentication removed: cloud auth/UI disabled to simplify deployment

  // Save removed: database functionality disabled in local UI


  // (EN / dual removidos)

  $("copyMsgBtn")?.addEventListener('click', async ()=>{
    if(!out.value) return;
    try{ await navigator.clipboard.writeText(out.value); toast('Copiado!'); }
    catch(e){ toast('Copie manualmente o texto.'); }
    // tentativa de salvar chamado no banco local (se o servidor estiver disponível)
    try{
      await fetch('/api/save-ticket', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ticket: $("ticketId").value || '', requester: $("requesterName").value || '', username: $("username").value || '', category: $("categorySelect").value || '', subcategory: $("subcategorySelect").value || '', message: out.value, analyst: localStorage.getItem('analystName') || '' }) });
    }catch(e){ /* ignore */ }
  });

  $("clearMsgBtn")?.addEventListener('click', ()=>{
    out.value = '';
    $("messageForm").reset();
    fillCategories();                      // repopula categorias
    toast('Campos limpos.');
  });

  // Local save removed: DB disabled

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
    // salva senha gerada no banco se possível
    try{
      await fetch('/api/save-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: ($("pwUsername").value||''), name: ($("pwName").value||''), password: pwOut.value, analyst: localStorage.getItem('analystName') || '' }) });
      toast('Senha salva no histórico.');
    }catch(e){ /* ignore */ }
  });

  $("clearPwBtn")?.addEventListener('click', ()=>{
    $("passwordForm").reset();
    pwOut.value='';
    toast('Campos limpos.');
  });

  // Theme toggle (dark / light) - button with icon
  const themeBtn = $("themeToggleBtn");
  function applyTheme(dark){
    if(dark) { document.body.classList.add('dark'); if(themeBtn) themeBtn.textContent = '☀️'; }
    else { document.body.classList.remove('dark'); if(themeBtn) themeBtn.textContent = '🌙'; }
  }
  try{
    const pref = localStorage.getItem('themeDark') === '1';
    applyTheme(pref);
    if(themeBtn){ themeBtn.addEventListener('click', ()=>{ const now = !document.body.classList.contains('dark'); applyTheme(now); localStorage.setItem('themeDark', now ? '1' : '0'); }); }
  }catch(e){ /* ignore */ }

  // Tabs: show/hide sections with data-tab (preserve form state)
  function setupTabs(){
    const tabButtons = document.querySelectorAll('button[data-tab]') || [];
    const sections = document.querySelectorAll('section[data-tab]') || [];
    function showTab(name){
      sections.forEach(sec=>{ sec.style.display = sec.getAttribute('data-tab')===name ? '' : 'none'; });
      tabButtons.forEach(b=> b.classList.toggle('active', b.getAttribute('data-tab')===name));
      localStorage.setItem('activeTab', name);
    }
    const saved = localStorage.getItem('activeTab');
    const initial = saved || (tabButtons[0] && tabButtons[0].getAttribute('data-tab')) || null;
    if(initial) showTab(initial);
    tabButtons.forEach(b=> b.addEventListener('click', ()=> showTab(b.getAttribute('data-tab'))));
  }
  setupTabs();
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

