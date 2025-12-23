$env:ADMIN_SECRET = [Environment]::GetEnvironmentVariable('ADMIN_SECRET','User')
$env:FIREBASE_SERVICE_ACCOUNT = [Environment]::GetEnvironmentVariable('FIREBASE_SERVICE_ACCOUNT','User')
Write-Output "session ADMIN_SECRET length: $($env:ADMIN_SECRET.Length)"
Write-Output "session FIREBASE_SERVICE_ACCOUNT: $($env:FIREBASE_SERVICE_ACCOUNT)"
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 200
Start-Process -FilePath ".\node-local\node-v18.20.8-win-x64\node.exe" -ArgumentList "server.js" -WindowStyle Hidden -PassThru
Write-Output 'Node started'