# FinBrain

This application generates IT service request emails from templates and via an AI-assisted generator.

Functionality
- Generate emails from stored templates.
- Create a new email using the AI generator ("Novo (via IA)").
- Extract and fill placeholders (e.g., Email Address, Ticket Number, Folder Path).
- Save generated templates back to the templates database.

How to run
1. Start the web server (Node):

```powershell
cd C:\Users\MBalieroDG\Desktop\dev\msdosautomsg
npm install
node server.js
```

2. Start the ML service (Python):

```powershell
cd C:\Users\MBalieroDG\Desktop\dev\msdosautomsg
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python ml_service.py
```

Open http://localhost:3000 in your browser to use the app.
# dosautomsg - Local DB server

Projeto simplificado: a aplicação opera localmente com um servidor Node/Express que grava registros em `data/records.json`.

## Instalação e execução (local)

1. Instale o Node.js (v14+).
2. No diretório do projeto, execute:

```bash
npm install
npm start
```

3. Abra a aplicação em http://localhost:3000 (a página principal é `index.html`; `db.html` mostra o visualizador de registros locais).

## API local
- POST /api/records  { ticket, agent, datetime, category, subcategory, requester }
- GET /api/records  (suporta query: ticket, agent, requester, category, subcategory, start, end)
- GET /api/export.csv (mesmos parâmetros) — retorna CSV

Os registros são persistidos em `data/records.json`.

## Nota sobre autenticação e nuvem (opcional)
O sistema roda localmente por padrão. Se você quiser sincronizar registros em nuvem usando Firebase Firestore, siga estes passos:

1. Copie `firebase-config.example.js` para `firebase-config.js` e preencha os valores com seu projeto Firebase.
2. Coloque `firebase-config.js` na raiz do projeto (não comite credenciais privadas em repositórios públicos).
3. Abra `index.html`, `db.html` e `pwdb.html` no navegador; os clientes carregarão o SDK do Firebase automaticamente.
4. A aplicação tentará autenticar silenciosamente (anonimamente) e ativará o modo nuvem se as credenciais e regras do Firestore permitirem.

Observações:
- Você pode implementar regras de segurança no Firestore para exigir autenticação real (email/senha, providers, etc.).
- Se preferir que a equipe tenha um servidor centralizado em vez de Firestore, posso ajudar a preparar `server.js` para deploy (Heroku, VPS, Azure) e instruções de `pm2`/serviço do Windows.


