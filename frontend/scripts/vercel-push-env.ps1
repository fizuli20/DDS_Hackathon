<#
  Push KEY=VALUE lines from vercel.env.production.local (or -EnvFile) to Vercel.
  Run from frontend/:  .\scripts\vercel-push-env.ps1
  Requires: vercel CLI, project linked (vercel link).
#>
param(
  [string]$EnvFile = "vercel.env.production.local",
  [ValidateSet("production", "preview", "development")]
  [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"
$frontendRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $frontendRoot $EnvFile

if (-not (Test-Path -Path $path)) {
  Write-Error "Missing file: $path`nCopy vercel.env.example to $EnvFile and fill values."
}

$sensitiveNames = @("OPENROUTER_API_KEY")

Get-Content -Path $path | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) {
    return
  }
  $eq = $line.IndexOf("=")
  if ($eq -lt 1) {
    return
  }
  $name = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()
  if ($name -eq "") {
    return
  }
  if ($value -eq "") {
    Write-Host "Skip (empty): $name" -ForegroundColor DarkYellow
    return
  }

  Write-Host "Adding $name ($Environment)..." -ForegroundColor Cyan
  if ($sensitiveNames -contains $name) {
    & npx --yes vercel env add $name $Environment --value $value --yes --sensitive
  } else {
    & npx --yes vercel env add $name $Environment --value $value --yes
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Error "vercel env add failed for $name"
  }
}

Write-Host "Done." -ForegroundColor Green
