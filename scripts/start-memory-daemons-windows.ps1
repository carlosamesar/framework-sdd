$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$gitBash = 'C:\Program Files\Git\bin\bash.exe'
$logFile = Join-Path $repoRoot 'logs\memory-daemons-autostart.log'

New-Item -ItemType Directory -Path (Split-Path -Parent $logFile) -Force | Out-Null

function Write-Log {
    param([string]$Message)
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "$ts - $Message"
    $line | Out-File -FilePath $logFile -Append -Encoding utf8
}

function Convert-ToBashPath {
    param([string]$Path)
    $full = [System.IO.Path]::GetFullPath($Path)
    $normalized = $full -replace '\\', '/'
    if ($normalized -match '^([A-Za-z]):/(.*)$') {
        $drive = $matches[1].ToLowerInvariant()
        $rest = $matches[2]
        return "/$drive/$rest"
    }
    return $normalized
}

function Invoke-Bash {
    param([string]$Command)
    & $gitBash -lc $Command
}

if (-not (Test-Path $gitBash)) {
    throw "Git Bash no encontrado en $gitBash"
}

$repoBashPath = Convert-ToBashPath -Path $repoRoot

Write-Log 'Inicio de autoarranque de memoria (Engram + RAG)'

Invoke-Bash "cd '$repoBashPath' && ./scripts/engram-sync-daemon.sh start || true"
Write-Log 'Engram daemon verificado/iniciado'

Invoke-Bash "cd '$repoBashPath' && ./scripts/rag-index-daemon.sh start || true"
Write-Log 'RAG daemon verificado/iniciado'

Write-Log 'Estado actual: verificar con scripts/status-memory-daemons.sh'

Write-Log 'Autoarranque completado'
exit 0
