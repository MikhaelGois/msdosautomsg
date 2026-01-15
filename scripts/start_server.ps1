Set-Location -Path "${PSScriptRoot}\.."
$env:AUTO_SHUTDOWN = 'false'
Write-Host "Starting server with AUTO_SHUTDOWN=$env:AUTO_SHUTDOWN"
node server.js
