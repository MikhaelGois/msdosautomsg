const http = require('http');

const opts = { host: '127.0.0.1', port: process.env.PORT || 3000, path: '/_sse', method: 'GET', headers: { Accept: 'text/event-stream' } };
const req = http.request(opts, (res)=>{
  console.log('SSE client connected, status', res.statusCode);
  res.on('data', (chunk)=>{ console.log('chunk:', chunk.toString()); });
  res.on('end', ()=>{ console.log('SSE ended by server'); });
});
req.on('error', (e)=>{ console.error('client error', e.message); });
req.end();

// close after 3s to simulate user closing the tab
setTimeout(()=>{
  try{ req.abort(); console.log('Client aborted (simulated tab close)'); }
  catch(e){ console.error('abort error', e); }
}, 3000);
