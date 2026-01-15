const http = require('http');
const req = http.get('http://127.0.0.1:3000', res => {
  console.log('STATUS', res.statusCode);
  res.resume();
  process.exit(0);
});
req.on('error', e => { console.error('ERR', e.message); process.exit(2); });
