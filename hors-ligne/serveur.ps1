# Serveur web local pour utiliser MathsMentales sans connexion internet (Windows).
# Fonctionne avec Windows PowerShell 5.1 (inclus dans Windows 10 et 11) : rien à installer,
# pas besoin de droits administrateur.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File hors-ligne\serveur.ps1 [-Port 1180] [-NoOpen]
#
# - n'écoute que sur 127.0.0.1 : inaccessible depuis le réseau ;
# - sert le dossier MathsMentales tel quel et ouvre src/index.html, comme le
#   faisait l'ancien lanceur public\startMM.cmd (sur 127.0.0.1, le code de
#   MathsMentales va chercher les activités dans ../public/library) ;
# - port 1180 par défaut, comme l'ancien lanceur : l'historique enregistré par
#   le navigateur est retrouvé d'une fois sur l'autre.
param(
    [int]$Port = 1180,
    [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'
$base = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$start = '/src/index.html'

$types = @{
    'html' = 'text/html; charset=utf-8'; 'htm' = 'text/html; charset=utf-8'
    'js' = 'text/javascript; charset=utf-8'; 'mjs' = 'text/javascript; charset=utf-8'
    'css' = 'text/css; charset=utf-8'; 'json' = 'application/json; charset=utf-8'
    'webmanifest' = 'application/manifest+json'; 'map' = 'application/json'
    'txt' = 'text/plain; charset=utf-8'; 'md' = 'text/plain; charset=utf-8'
    'yaml' = 'text/yaml; charset=utf-8'; 'yml' = 'text/yaml; charset=utf-8'
    'xml' = 'application/xml'; 'svg' = 'image/svg+xml'; 'png' = 'image/png'
    'jpg' = 'image/jpeg'; 'jpeg' = 'image/jpeg'; 'gif' = 'image/gif'; 'webp' = 'image/webp'
    'ico' = 'image/x-icon'; 'woff' = 'font/woff'; 'woff2' = 'font/woff2'; 'ttf' = 'font/ttf'
    'otf' = 'font/otf'; 'eot' = 'application/vnd.ms-fontobject'; 'mp3' = 'audio/mpeg'
    'ogg' = 'audio/ogg'; 'wav' = 'audio/wav'; 'mp4' = 'video/mp4'; 'pdf' = 'application/pdf'
    'zip' = 'application/zip'; 'odt' = 'application/vnd.oasis.opendocument.text'
    'wasm' = 'application/wasm'
}
$ascii = [System.Text.Encoding]::ASCII
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Send-Text($stream, [string]$status, [string]$body, [bool]$head, [string]$extra = '') {
    $bytes = $utf8.GetBytes($body)
    $header = "HTTP/1.1 $status`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`n$extra" +
              "Cache-Control: no-cache`r`nConnection: close`r`n`r`n"
    $h = $ascii.GetBytes($header)
    $stream.Write($h, 0, $h.Length)
    if (-not $head) { $stream.Write($bytes, 0, $bytes.Length) }
}

function Invoke-Request($client, [string]$request) {
    $stream = $client.GetStream()
    $line = ($request -split "`r`n")[0]
    $m = [regex]::Match($line, '^(\w+)\s+(\S+)\s+HTTP/')
    if (-not $m.Success) { Send-Text $stream '400 Bad Request' "Requête invalide`n" $false; return }
    $method = $m.Groups[1].Value
    $head = ($method -eq 'HEAD')
    if (($method -ne 'GET') -and -not $head) { Send-Text $stream '405 Method Not Allowed' "Méthode non autorisée`n" $false; return }

    $path = ($m.Groups[2].Value -split '[?#]')[0]
    $path = [System.Uri]::UnescapeDataString($path)
    $parts = @($path -split '[/\\]' | Where-Object { $_ -ne '' -and $_ -ne '.' })
    if ($parts -contains '..') { Send-Text $stream '403 Forbidden' "Accès refusé`n" $head; return }
    if ($parts.Count -eq 0) {
        Send-Text $stream '302 Found' '' $head "Location: $start`r`n"
        return
    }
    $file = [System.IO.Path]::GetFullPath((Join-Path $base ($parts -join [System.IO.Path]::DirectorySeparatorChar)))
    if (-not $file.StartsWith($base)) { Send-Text $stream '403 Forbidden' "Accès refusé`n" $head; return }
    if (Test-Path -LiteralPath $file -PathType Container) { $file = Join-Path $file 'index.html' }
    if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
        Send-Text $stream '404 Not Found' "Fichier introuvable : /$($parts -join '/')`n" $head
        return
    }
    $ext = [System.IO.Path]::GetExtension($file).TrimStart('.').ToLowerInvariant()
    $type = $types[$ext]
    if (-not $type) { $type = 'application/octet-stream' }
    $fs = [System.IO.File]::OpenRead($file)
    try {
        $header = "HTTP/1.1 200 OK`r`nContent-Type: $type`r`nContent-Length: $($fs.Length)`r`n" +
                  "Cache-Control: no-cache`r`nConnection: close`r`n`r`n"
        $h = $ascii.GetBytes($header)
        $stream.Write($h, 0, $h.Length)
        if (-not $head) { $fs.CopyTo($stream) }
    } finally {
        $fs.Dispose()
    }
}

# Premier port libre à partir de $Port (l'historique reste lié au port 1180).
$listener = $null
$requested = $Port
for ($p = $Port; $p -lt $Port + 20; $p++) {
    try {
        $candidate = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $p)
        $candidate.ExclusiveAddressUse = $true
        $candidate.Start()
        $listener = $candidate
        $Port = $p
        break
    } catch { }
}
if (-not $listener) {
    Write-Host "Impossible de démarrer : aucun port libre entre $requested et $($requested + 19)." -ForegroundColor Red
    exit 1
}

$url = "http://127.0.0.1:$Port$start"
Write-Host ''
Write-Host "MathsMentales fonctionne sans internet à l'adresse : $url" -ForegroundColor Green
if ($Port -ne $requested) { Write-Host "(Port $Port : l'historique des diaporamas est lié à ce port.)" }
Write-Host "Laissez cette fenêtre ouverte pendant l'utilisation."
Write-Host "Pour arrêter MathsMentales : fermez cette fenêtre (ou Ctrl+C)."
Write-Host ''
if (-not $NoOpen) { Start-Process $url }

# Boucle sans fil d'exécution : le navigateur ouvre parfois des connexions à
# l'avance sans rien demander ; on ne les attend jamais, on ne lit que les
# connexions qui ont envoyé des données, et on ferme celles restées muettes.
$clients = New-Object System.Collections.ArrayList
$buffer = New-Object byte[] 65536
try {
    while ($true) {
        $busy = $false
        while ($listener.Pending()) {
            $c = $listener.AcceptTcpClient()
            $c.NoDelay = $true
            [void]$clients.Add(@{ Client = $c; Data = (New-Object System.IO.MemoryStream); Since = [DateTime]::UtcNow })
            $busy = $true
        }
        foreach ($entry in @($clients)) {
            $c = $entry.Client
            $done = $false
            try {
                if ($c.Available -gt 0) {
                    $busy = $true
                    $n = $c.GetStream().Read($buffer, 0, [Math]::Min($buffer.Length, $c.Available))
                    $entry.Data.Write($buffer, 0, $n)
                    $text = $ascii.GetString($entry.Data.ToArray())
                    if ($text.Contains("`r`n`r`n")) {
                        Invoke-Request $c $text
                        $done = $true
                    } elseif ($entry.Data.Length -gt 65536) {
                        $done = $true
                    }
                } elseif (([DateTime]::UtcNow - $entry.Since).TotalSeconds -gt 15) {
                    $done = $true
                }
            } catch {
                $done = $true
            }
            if ($done) {
                try { $c.Close() } catch { }
                $clients.Remove($entry)
            }
        }
        if (-not $busy) { Start-Sleep -Milliseconds 5 }
    }
} finally {
    $listener.Stop()
}
