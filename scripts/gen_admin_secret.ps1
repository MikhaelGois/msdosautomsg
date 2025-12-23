$g1 = [guid]::NewGuid().ToString().Replace('-','')
$g2 = [guid]::NewGuid().ToString().Replace('-','')
$s = $g1 + $g2
setx ADMIN_SECRET $s
# set in current session as well
$env:ADMIN_SECRET = $s
Write-Output $s
Write-Output 'ADMIN_SECRET set via setx and available in current session'