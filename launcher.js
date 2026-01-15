const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// When packaged as exe, process.execPath is the path to the exe.
// Otherwise fall back to __dirname for dev.
const baseDir = path.dirname(process.execPath || __dirname);
const bat = path.join(baseDir, 'run_tool.bat');

if(!fs.existsSync(bat)){
  console.error('run_tool.bat not found at', bat);
  console.error('Please place this exe next to run_tool.bat or run from project root.');
  process.exit(1);
}

console.log('Launching', bat);

const cp = spawn(bat, [], { cwd: baseDir, stdio: 'inherit', shell: true });

cp.on('exit', (code)=>{
  console.log('Launcher exiting with code', code);
  process.exit(code);
});

cp.on('error', (err)=>{
  console.error('Failed to spawn run_tool.bat:', err);
  process.exit(2);
});
const { spawn } = require('child_process');
const path = require('path');

// locate run_server.ps1 next to the exe (or next to this script during development)
const exeDir = path.dirname(process.execPath || process.argv[1]);
const scriptPath = path.join(exeDir, 'run_server.ps1');

try {
  const ps = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
    detached: true,
    stdio: 'ignore'
  });
  ps.unref();
  // open default browser
  spawn('cmd', ['/c', 'start', 'http://localhost:3000/']);
  console.log('Launcher executed: server started (background). Browser opened.');
} catch (e) {
  console.error('Failed to start server launcher:', e.message);
  process.exit(1);
}
