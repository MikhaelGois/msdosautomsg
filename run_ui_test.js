const puppeteer = require('puppeteer');

(async ()=>{
  try{
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.on('console', msg => console.log('PAGE:', msg.text()));

    // navigate without a strict timeout (SSE and prompts can delay load); then wait for the UI select
    await page.goto('http://127.0.0.1:3000', { timeout: 0 });
    await page.waitForSelector('#templateSelect', { timeout: 120000 });

    // create a template via API
    const tpl = {
      name: 'Puppeteer Test Template ' + Date.now(),
      text: 'Olá,\n\nEmail: [email]\nNome: [nome]\nAssunto: [subject]\n\nObrigado.'
    };
    const res = await page.evaluate(async (tpl)=>{
      const r = await fetch('/api/save-template', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(tpl) });
      return r.ok ? await r.json() : {error: 'save failed', status: r.status};
    }, tpl);

    if(!res || !res.id){
      console.error('Failed to create template', res);
      await browser.close(); process.exit(2);
    }
    console.log('Created template id', res.id);

    // refresh templates on page then select the new one
    await page.evaluate(()=> window.refreshTemplates && window.refreshTemplates());
    await page.waitForTimeout(500);

    await page.select('#templateSelect', String(res.id));
    await page.waitForTimeout(500);

    // Wait for generated inputs to appear (Email and Nome)
    await page.waitForSelector('input[id^="fld_"]', { timeout: 3000 });

    // Find inputs by label text (Email / Nome)
    const fields = await page.$$eval('#templateFields .form-row', rows => rows.map(r=>{
      const label = r.querySelector('label')?.textContent || '';
      const input = r.querySelector('input');
      return { label: label.trim(), id: input ? input.id : null };
    }));

    console.log('Detected fields:', fields);

    // fill values
    for(const f of fields){
      if(!f.id) continue;
      if(/email/i.test(f.label)) await page.type('#'+f.id, 'tester@example.com');
      if(/nome|name/i.test(f.label)) await page.type('#'+f.id, 'John Doe');
      if(/assunto|subject/i.test(f.label)) await page.type('#'+f.id, 'Teste assunto');
    }

    // allow debounce to run
    await page.waitForTimeout(600);

    const body = await page.$eval('#emailBodyOutput', el => el.value);
    console.log('Email body after typing:\n', body);

    const ok = body.includes('Email: tester@example.com') && body.includes('Nome: John Doe');
    console.log('TEST RESULT:', ok ? 'PASS' : 'FAIL');

    await browser.close();
    process.exit(ok ? 0 : 3);
  }catch(e){
    console.error('Test error', e);
    process.exit(4);
  }
})();
