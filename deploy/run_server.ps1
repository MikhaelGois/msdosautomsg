Param(
    [int]$Port = 3000
)

function Write-ErrAndExit($msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

# ensure script dir is current
Set-Location -Path $PSScriptRoot

# check node exists
if (-not (Get-Command node -ErrorAction SilentlyContinue)){
    Write-ErrAndExit "Node.js não encontrado no PATH. Instale Node.js ou adicione ao PATH e tente novamente."
}

# run npm install if node_modules missing
if (-not (Test-Path -Path (Join-Path $PSScriptRoot 'node_modules'))){
    Write-Host "Dependências não encontradas. Executando 'npm install'..."
    $p = Start-Process -FilePath node -ArgumentList 'npm','install' -NoNewWindow -PassThru -Wait
    if ($p.ExitCode -ne 0){ Write-ErrAndExit "'npm install' falhou (exit $($p.ExitCode))." }
}

# check if port already listening
try{
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
} catch { $conn = $null }

if ($conn){
    $ownPid = $conn.OwningProcess
    # get command line of owner
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$ownPid" -ErrorAction SilentlyContinue
    $cmd = ($owner | Select-Object -ExpandProperty CommandLine) -join ' '
    if ($null -ne $cmd -and $cmd -match 'server\.js'){
        Write-Host "Port $Port já em uso por processo PID $ownPid que parece executar server.js. Abrindo site..." -ForegroundColor Yellow
        Start-Process "http://localhost:$Port/"
        exit 0
    } else {
        Write-Host "Port $Port já em uso por PID $ownPid." -ForegroundColor Yellow
        if ($null -ne $cmd){ Write-Host "Comando: $cmd" }
        $resp = Read-Host "Deseja abrir o site mesmo assim? (s/N)"
        if ($resp -match '^[sS]'){
            Start-Process "http://localhost:$Port/"
            exit 0
        } else {
            Write-Host "Abortando sem abrir o site." -ForegroundColor Cyan
            exit 0
        }
    }
} else {
    Write-Host "Iniciando servidor (node server.js) na porta $Port..."
    Start-Process -FilePath node -ArgumentList 'server.js' -WorkingDirectory $PSScriptRoot -WindowStyle Minimized
    Start-Sleep -Seconds 1
}

# open browser
$url = "http://localhost:$Port/"
Write-Host "Abrindo $url" -ForegroundColor Green
Start-Process $url

Write-Host "Pronto. Feche esta janela se quiser; o servidor continua rodando em background." -ForegroundColor Cyan
