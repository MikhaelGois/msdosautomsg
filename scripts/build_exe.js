const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const pkgBin = path.join(__dirname, '..', 'node_modules', '.bin', 'pkg');
const pkgExists = fs.existsSync(pkgBin);
const pkgCmd = pkgExists ? pkgBin : 'pkg';

const pkgPkg = require(path.join(__dirname,'..','package.json'));

// Prefer site title from public/email_template_ui.html when present
function getSiteTitle(){
  try{
    const fp = path.join(__dirname, '..', 'index.html');
    if(!fs.existsSync(fp)) return null;
    const html = fs.readFileSync(fp, 'utf8');
    const m = html.match(/<title>([^<]+)<\/title>/i);
    if(m && m[1]) return m[1].trim();
  }catch(e){}
  return null;
}

const rawTitle = getSiteTitle();
const baseName = (rawTitle || pkgPkg.name || 'app');
const outName = String(baseName).replace(/[^a-z0-9_\-\.]/gi, '_') + '.exe';
const outDir = path.join(__dirname, '..', 'dist');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, outName);

console.log('Building exe to', outPath);

const args = ['launcher.js', '--targets', 'node18-win-x64', '--output', outPath];

const res = spawnSync(pkgCmd, args, { stdio: 'inherit', shell: true });
if(res.error){
  console.error('Failed to run pkg:', res.error);
  process.exit(1);
}
if(res.status !== 0){
  console.error('pkg exited with code', res.status);
  process.exit(res.status);
}

console.log('Exe built at', outPath);
