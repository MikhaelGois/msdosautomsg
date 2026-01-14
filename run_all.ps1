Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c node server.js" -WorkingDirectory (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Start-Sleep -Milliseconds 500
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c python ml_service.py" -WorkingDirectory (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Write-Host "Started server and ML service (check their consoles)."