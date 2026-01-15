const assert = require('assert');

function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }

function replacePlaceholders(base, inputsMeta){
  const lines = base.split(/\r?\n/);
  const outLines = lines.map((ln) => {
    const idx = ln.indexOf(':');
    if(idx === -1) return ln;
    const left = ln.slice(0, idx).trim();
    let right = ln.slice(idx+1);
    for(const m of inputsMeta){
      const v = m.val || '';
      if(!v) continue;
      const raw = (m.placeholder || m.key).replace(/^\[|\]$/g,'').trim();
      const underscored = raw.replace(/\s+/g,'_');
      // if right contains bracketed placeholder matching key
      const brRe = new RegExp('\\[\\s*' + escapeRegex(m.key) + '\\s*\\]','i');
      const brRe2 = new RegExp('\\[\\s*' + escapeRegex(underscored) + '\\s*\\]','i');
      if(brRe.test(right) || brRe2.test(right)){
        right = ' ' + v;
        break;
      }
      // if left matches the placeholder name or underscored variant
      if(left.toLowerCase() === raw.toLowerCase() || left.toLowerCase() === underscored.toLowerCase()){
        right = ' ' + v;
        break;
      }
    }
    return left + ': ' + right.trim();
  });
  return outLines.join('\n');
}

// Unit tests
const template = `Olá,\n\nEmail: [email]\nNome: [nome]\nAssunto: [subject]\n\nObrigado.`;

const inputsMeta = [
  { key: 'email', val: 'tester@example.com', placeholder: 'email' },
  { key: 'nome', val: 'John Doe', placeholder: 'nome' },
  { key: 'subject', val: 'Teste assunto', placeholder: 'subject' }
];

const out = replacePlaceholders(template, inputsMeta);
console.log(out);

assert(out.includes('Email: tester@example.com'));
assert(out.includes('Nome: John Doe'));
assert(out.includes('Assunto: Teste assunto'));

console.log('Unit test PASS');

process.exit(0);
