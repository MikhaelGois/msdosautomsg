const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('data/msdos.db');

db.all('SELECT id, name, text FROM templates LIMIT 3', [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  console.log(`✓ Templates do banco de dados:\n`);
  
  rows.forEach((row, i) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Template ${i+1}: ${row.name}`);
    console.log(`${'='.repeat(60)}`);
    console.log(row.text.substring(0, 500));
    console.log(`[...truncado...]`);
  });
  
  db.close();
  process.exit(0);
});
