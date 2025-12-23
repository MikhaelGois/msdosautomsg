$secret = "$([Guid]::NewGuid().ToString('N'))$([Guid]::NewGuid().ToString('N'))"
$env:ADMIN_SECRET = $secret
[Environment]::SetEnvironmentVariable("ADMIN_SECRET",$secret,"User")
Write-Output ("ADMIN_SECRET set (length: " + $secret.Length + ")")
