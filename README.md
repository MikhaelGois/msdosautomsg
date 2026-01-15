# Luxottica IT Utilitary — Email & Message Generator

A web-based tool for generating IT service request emails and messages, featuring dynamic templates with Portuguese/English support. Built for team collaboration—templates saved by any user are instantly available to all users on the same network.

## Features

- **Dynamic Email Templates**: 15+ pre-configured templates with bilingual names (English + Portuguese).
- **Live Preview**: See email subject and body update in real-time as you fill form fields.
- **Save Custom Templates**: Generate an email, then click "Salvar modelo" to save it as a new template in the database.
- **Share Across Network**: All templates saved by any user are immediately visible to team members on the same server.
- **Automatic Field Detection**: Placeholders marked with `mutavel` are auto-converted to form fields.
- **Portable .exe Launcher**: `Luxottica_IT_Utilitary.exe` — no Node/npm installation needed on client machines.
- **Message Generator**: Create ticket messages (Teams, Requestia, etc.) with predefined categories.
- **Password Generator**: Generate compliant IT passwords following organizational policy.

## Quick Start

### Option A: Web Browser (Development/Local Network)

1. **Start the server**:
```powershell
cd C:\Users\MBalieroDG\Desktop\dev\msdosautomsg
npm install
$env:AUTO_SHUTDOWN='false'
node server.js
```
2. **Open in browser**:
   - Local: http://localhost:3000
   - Network: http://<server-ip>:3000 (replace `<server-ip>` with server's IP address)

### Option B: Portable .exe (No Installation Required)

1. Download or build `Luxottica_IT_Utilitary.exe` from `dist/`
2. Place it in the same folder as `run_tool.bat` (both files must be together)
3. Double-click the `.exe` — it will:
   - Start the server
   - Open the app in your default browser
   - Auto-close when you close the browser (if no other connections active)

## Building the .exe

To generate a portable executable:

```powershell
cd C:\Users\MBalieroDG\Desktop\dev\msdosautomsg
npm install
npm run build:exe
```

Result: `dist/Luxottica_IT_Utilitary.exe`

## API Endpoints

### Templates

- `GET /api/templates` — List all templates
- `GET /api/template/:id` — Get template details + placeholders
- `POST /api/save-template` — Save a new template
  - Body: `{ "name": "Template Name", "text": "Subject: ...\n\n..." }`
  - Returns: `{ "id": 123 }`

### Messages & Passwords

- `POST /api/save-ticket` — Save a ticket message
- `GET /api/tickets` — List saved tickets
- `POST /api/save-password` — Save a generated password
- `GET /api/passwords` — List saved passwords

## Folder Structure

```
msdosautomsg/
├── index.html              — Main UI (email + message + password generators)
├── server.js               — Express backend + SQLite DB
├── launcher.js             — Node wrapper for .exe launcher
├── package.json            — Dependencies
├── run_tool.bat            — Server startup batch file
├── data/
│   └── msdos.db            — SQLite database (templates, tickets, passwords)
├── scripts/
│   ├── build_exe.js        — .exe builder (uses pkg)
│   ├── reset_templates.js  — Reset DB to default templates
│   └── insert_user_templates.js — Bulk insert custom templates
├── public/
│   ├── email_template_ui.html   — Standalone email generator (for reference)
│   └── styles.css          — CSS
└── dist/
    └── Luxottica_IT_Utilitary.exe  — Portable launcher
```

## Template Management

### Default Templates (15)

All include Portuguese translations in the UI dropdown:

1. **Request to Extend Expired Account Access** (Solicitação de Extensão de Acesso de Conta Expirada)
2. **Request for MFA Reset** (Solicitação de Reset de MFA)
3. **Request for Third-Party Luxottica Account** (Solicitação de Conta Luxottica de Terceiros)
4. **Request for New Luxottica Account** (Solicitação de Nova Conta Luxottica)
5. **Request to Add Email to Distribution Group(s)** (Solicitação para Adicionar E-mail ao(s) Grupo(s) de Distribuição)
6. **Request to Remove Email from Distribution Group(s)** (Solicitação para Remover E-mail do(s) Grupo(s) de Distribuição)
7. **Request to Delete Email Account** (Solicitação de Exclusão de Conta de E-mail)
8. **Request to Modify Existing Luxottica Account** (Solicitação de Modificação de Conta Luxottica Existente)
9. **Request to Modify Account by Mirroring Existing User** (Solicitação de Modificação de Conta Espelhando Usuário Existente)
10. **Request to Reactivate Email Account** (Solicitação de Reativação de Conta de E-mail)
11. **User Not Receiving Third-Party Emails** (Usuário Não Recebendo E-mails de Terceiros)
12. **Request to Upgrade Office License from E1 to E3** (Solicitação de Upgrade de Licença Office de E1 para E3)
13. **Request to Renew Expired Office License (E3)** (Solicitação de Renovação de Licença Office Expirada (E3))
14. **Request to Unlock User Account** (Solicitação de Desbloqueio de Conta de Usuário)
15. **Request to Block and Deactivate User Access** (Solicitação de Bloqueio e Desativação de Acesso de Usuário)

### Creating Custom Templates

1. Select an existing template or start from scratch
2. Fill in the form fields
3. Review the preview (updates live)
4. Click **"Salvar modelo"** and enter a name
5. New template is saved to database and visible to all network users

## Environment Variables

- `AUTO_SHUTDOWN` — Set to `'false'` to keep server running after last browser closes (useful for testing/debugging)
  ```powershell
  $env:AUTO_SHUTDOWN='false'
  node server.js
  ```

## How to run (Legacy / Advanced)

1. Start the web server (Node):

```powershell
cd msdosautomsg
npm install
node server.js  # or: npm start
```

2. Start the ML service (Python):

```powershell
cd msdosautomsg
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python ml_service.py
```

Open http://localhost:3000 in your browser to use the app.

## License & Attribution

Internal Luxottica IT utility. For internal use only.
