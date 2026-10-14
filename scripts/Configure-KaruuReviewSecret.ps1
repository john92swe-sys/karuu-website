[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','KARUU_DELIVERY_SIGNING_SECRET','KARUU_NOTIFICATION_JOB_SECRET')]
    [string]$Name,
    [ValidateSet('test','live')]
    [string]$PaymentMode
)

$ErrorActionPreference = 'Stop'
$reviewRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$reviewConfigPath = Join-Path $reviewRoot 'wrangler.jsonc'
$reviewConfig = Get-Content -LiteralPath $reviewConfigPath -Raw | ConvertFrom-Json
if (-not $PSBoundParameters.ContainsKey('PaymentMode')) { $PaymentMode = $reviewConfig.vars.KARUU_PAYMENT_MODE }
if ($PaymentMode -notin @('test','live')) { throw 'The review configuration must explicitly select test or live mode.' }
if ($reviewConfig.name -ne 'karuu-c-review-20261013' -or $reviewConfig.routes) {
    throw 'This helper only accepts the isolated KARUU review Worker.'
}
$closedFlags = @('KARUU_PAYMENTS_ENABLED','KARUU_LIVE_COMMERCE_APPROVED','KARUU_TAX_CONFIG_APPROVED','KARUU_DISTRIBUTION_APPROVED','KARUU_LEGAL_APPROVED')
foreach ($flag in $closedFlags) {
    if ($reviewConfig.vars.$flag -ne 'false') { throw 'Keep commercial gates closed while staging credentials.' }
}
$reviewNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$reviewNode = if ($reviewNodeCommand) { $reviewNodeCommand.Source } else { 'C:\Users\Administrator\Documents\Codex\Tools\Node\node.exe' }
if (-not (Test-Path -LiteralPath $reviewNode -PathType Leaf)) { throw 'A verified Node.js runtime is required.' }
$reviewWrangler = Join-Path $reviewRoot 'node_modules\wrangler\bin\wrangler.js'
Write-Host "Stage $Name in Cloudflare secret storage for karuu-c-review-20261013."
Write-Host 'Input is hidden. This creates a new Worker version; it does not activate it.'
$secureValue = Read-Host "Paste the $PaymentMode credential or signing secret" -AsSecureString
$valuePointer = [IntPtr]::Zero
$secretValue = $null
$secretProcess = $null
try {
    $valuePointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
    $secretValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($valuePointer)
    if ($Name -eq 'STRIPE_SECRET_KEY' -and $secretValue -notmatch ('^(rk|sk)_' + $PaymentMode + '_[A-Za-z0-9_]+$')) {
        throw "The Stripe key must belong to the explicitly selected $PaymentMode mode."
    }
    if ($Name -eq 'STRIPE_WEBHOOK_SECRET' -and $secretValue -notmatch '^whsec_[A-Za-z0-9_]+$') {
        throw "Use the signing secret of the configured $PaymentMode webhook endpoint."
    }
    if ($secretValue.Length -lt 32 -or $secretValue.Contains("`r") -or $secretValue.Contains("`n")) {
        throw 'Use a single-line secret of at least 32 characters.'
    }
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = $reviewNode
    $startInfo.WorkingDirectory = $reviewRoot
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardInput = $true
    $startInfo.Arguments = '"' + $reviewWrangler + '" versions secret put ' + $Name + ' --name karuu-c-review-20261013 --config "' + $reviewConfigPath + '"'
    $startInfo.EnvironmentVariables['CLOUDFLARE_ACCOUNT_ID'] = '44d393d03d27e20635968b7b374314ff'
    $startInfo.EnvironmentVariables['WRANGLER_SEND_METRICS'] = 'false'
    $secretProcess = [System.Diagnostics.Process]::Start($startInfo)
    $secretProcess.StandardInput.WriteLine($secretValue)
    $secretProcess.StandardInput.Close()
    $secretProcess.WaitForExit()
    if ($secretProcess.ExitCode -ne 0) { throw 'Cloudflare did not confirm this staged secret. No activation was requested.' }
    Write-Host 'Secret staging completed. Keep the returned version ID for binding and source verification before deployment.'
} finally {
    $secretValue = $null
    if ($valuePointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($valuePointer) }
    if ($secureValue) { $secureValue.Dispose() }
    if ($secretProcess) { $secretProcess.Dispose() }
}
