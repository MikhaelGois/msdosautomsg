const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const dist = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(dist)) {
  console.error('dist directory not found:', dist);
  process.exit(2);
}

const files = fs.readdirSync(dist).filter(f => /\.(js|css)$/.test(f));
if (!files.length) {
  console.log('No .js or .css files found in dist/ to compress.');
  process.exit(0);
}

let brotliSupported = typeof zlib.brotliCompressSync === 'function';

for (const f of files) {
  const fp = path.join(dist, f);
  const buf = fs.readFileSync(fp);

  // gzip
  try {
    const gz = zlib.gzipSync(buf, { level: zlib.constants.Z_BEST_COMPRESSION });
    fs.writeFileSync(fp + '.gz', gz);
    console.log('Wrote', f + '.gz');
  } catch (e) {
    console.error('gzip failed for', f, e.message);
  }

  // brotli
  if (brotliSupported) {
    try {
      const br = zlib.brotliCompressSync(buf, {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11
        }
      });
      fs.writeFileSync(fp + '.br', br);
      console.log('Wrote', f + '.br');
    } catch (e) {
      console.error('brotli failed for', f, e.message);
    }
  } else {
    console.warn('Brotli not supported by this Node version; skipping .br files');
  }
}

console.log('Precompression completed.');
