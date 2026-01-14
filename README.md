# AutoMSG

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

