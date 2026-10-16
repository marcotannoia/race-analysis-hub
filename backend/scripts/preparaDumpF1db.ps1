param(
  [string]$OutputDirectory = (Join-Path $env:TEMP 'race-analysis-hub-f1db-v2026.17.0')
)

$ErrorActionPreference = 'Stop'
$url = 'https://github.com/f1db/f1db/releases/download/v2026.17.0/f1db-sql-postgresql-single-inserts.zip'
$expectedSha256 = 'E24D087E0457AF7F4A73F21B23424B30DBEADCBDFF3056E1ED8BD31E31B65581'

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$archive = Join-Path $OutputDirectory 'f1db-sql-postgresql-single-inserts.zip'
$sqlFile = Join-Path $OutputDirectory 'f1db-sql-postgresql-single-inserts.sql'

Invoke-WebRequest -Uri $url -OutFile $archive
$actualSha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash
if ($actualSha256 -ne $expectedSha256) {
  throw "Checksum F1DB non valido: $actualSha256"
}

Expand-Archive -LiteralPath $archive -DestinationPath $OutputDirectory -Force
if (-not (Test-Path -LiteralPath $sqlFile)) {
  throw "Dump SQL non trovato: $sqlFile"
}

Write-Output $sqlFile
