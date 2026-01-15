const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

(async ()=>{
  try{
    const distPath = path.join(__dirname,'dist','email_generator.js');
    if(!fs.existsSync(distPath)){
      console.error('Bundled file not found:', distPath);
      process.exit(2);
    }
    const scriptContent = fs.readFileSync(distPath,'utf8');

    // minimal HTML with the elements email_generator expects
    const html = `<!doctype html><html><head></head><body>
      <select id="templateSelect"></select>
      <div id="templateFields"></div>
      <textarea id="emailBodyOutput" data-template=""> </textarea>
      <div id="fieldsBox"></div>
    </body></html>`;

    // prepare a storage backing and ensure it's available before any script runs
    const _storage = {};
    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      resources: 'usable',
      beforeParse(win){
        win.localStorage = {
          getItem: (k)=> (_storage.hasOwnProperty(k) ? _storage[k] : null),
          setItem: (k,v)=> { _storage[k]=String(v); },
          removeItem: (k)=> { delete _storage[k]; }
        };
        win.sessionStorage = { getItem: ()=>null, setItem: ()=>{}, removeItem: ()=>{} };
        class DummyEventSource { constructor(url){ this.url = url; this.readyState = 1; } addEventListener(){ } removeEventListener(){ } close(){ this.readyState = 2; } }
        win.EventSource = DummyEventSource;
      }
    });
    const { window } = dom;
    // expose DOM globals
    global.window = window;
    global.document = window.document;
    global.navigator = window.navigator;

    // Provide a fake API endpoint responses used by the script (if any)
    // We'll stub fetch on the window to respond to /api/template/:id and other calls.
    window.fetch = async (url, opts) => {
      if(url.includes('/api/template/')){
        // return a template containing Email: and Nome:
        return {
          ok: true,
          json: async ()=>({ id:123, name:'Test', text:'Olá,\n\nEmail: [email]\nNome: [nome]\n\nObrigado.' , placeholders:['email','nome'] })
        };
      }
      if(url.includes('/api/save-template')){
        return { ok:true, json: async ()=>({id: 999}) };
      }
      if(url.includes('/_clients')){
        return { ok:true, json: async ()=>({clients:1}) };
      }
      return { ok:false, status:404 };
    };

    // attach a simple console to capture logs
    window.console = console;

    // inject the bundled script (patch unqualified localStorage/sessionStorage to window.* to avoid ReferenceError in JSDOM)
    const patched = scriptContent.replace(/\blocalStorage\b/g, 'window.localStorage').replace(/\bsessionStorage\b/g, 'window.sessionStorage');
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = patched;
    window.document.head.appendChild(scriptEl);

    // Wait a short time for script to initialize
    await new Promise(r=>setTimeout(r, 200));

    // Simulate selecting template (script should react to change and render fields)
    const select = window.document.getElementById('templateSelect');
    // create an option and set value
    const opt = window.document.createElement('option'); opt.value = '123'; opt.textContent = 'Test';
    select.appendChild(opt);
    select.value = '123';
    // dispatch change event
    select.dispatchEvent(new window.Event('change', { bubbles: true }));

    // wait for fields to be rendered
    await new Promise(r=>setTimeout(r, 300));

    // find generated inputs
    const inputs = Array.from(window.document.querySelectorAll('input[id^="fld_"]'));
    if(inputs.length === 0){
      console.error('No inputs generated');
      process.exit(3);
    }

    // type into inputs: find email and nome
    for(const inp of inputs){
      const label = inp.previousElementSibling ? inp.previousElementSibling.textContent || '' : '';
      if(/email/i.test(label)){
        inp.value = 'tester@example.com';
        inp.dispatchEvent(new window.Event('input', { bubbles: true }));
      }
      if(/nome|name/i.test(label)){
        inp.value = 'John Doe';
        inp.dispatchEvent(new window.Event('input', { bubbles: true }));
      }
    }

    // allow debounce to run
    await new Promise(r=>setTimeout(r, 600));

    const bodyEl = window.document.getElementById('emailBodyOutput');
    const body = bodyEl.value || bodyEl.textContent || '';
    console.log('Email body result:\n', body);

    const ok = body.includes('Email: tester@example.com') && body.includes('Nome: John Doe');
    console.log('TEST RESULT:', ok ? 'PASS' : 'FAIL');
    process.exit(ok ? 0 : 4);
  }catch(e){
    console.error('Test error', e);
    process.exit(5);
  }
})();
