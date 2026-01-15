# Teste do Gerador de Email com Atualização Automática

## Como testar:

### 1. Inicie o servidor
```powershell
Set-Location 'C:\Users\MBalieroDG\Desktop\dev\msdosautomsg'
node server.js
```

### 2. Abra um navegador em http://localhost:3000

### 3. Crie um template de teste manualmente no banco de dados
Rode este comando Node.js para inserir um template:

```javascript
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/msdos.db');
db.run(`INSERT INTO templates (name, text) VALUES (?, ?)`, 
  ['Test Template', 
   `Olá,\n\nEmail: [aqui vai o email]\nNome: [aqui vai o nome]\n\nAtenciosamente.`],
  function(err) {
    if(err) console.error(err);
    else console.log('Template criado com ID:', this.lastID);
    db.close();
  }
);
```

### 4. Ou simplesmente use um template existente

- Selecione um modelo no dropdown "Modelo"
- Os campos identificados (palavras com `:`) aparecerão como inputs
- Digite nos inputs e veja o email no corpo atualizar **em tempo real**

## Estrutura esperada do template:
```
Email: [valor inicial]
Nome: [valor inicial]
Assunto: [valor inicial]
```

Tudo que tiver `:` será detectado como campo volátil e linkado aos inputs do formulário.
