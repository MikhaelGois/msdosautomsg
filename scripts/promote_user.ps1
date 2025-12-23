$secret = [Environment]::GetEnvironmentVariable('ADMIN_SECRET','User')
Write-Output "ADMIN_SECRET length: $($secret.Length)"
$body = @{ email='mikhael.baliero@apexamerica.com' } | ConvertTo-Json
try{
  $result = Invoke-RestMethod -Uri 'http://localhost:3000/admin/promote' -Method Post -Body $body -ContentType 'application/json' -Headers @{ 'x-admin-secret' = $secret }
  $result | ConvertTo-Json
}catch{
  Write-Error $_
  exit 1
}