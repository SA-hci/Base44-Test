# Puts an "Exhibit gateway" shortcut on the desktop of a gallery laptop.
#
# Run it ONCE on the gallery laptop (right-click -> "Run with PowerShell", or in a terminal:
#   powershell -ExecutionPolicy Bypass -File gallery-shortcut.ps1 )
# It asks for the gateway address and makes the shortcut. Whoever opens the gallery double-clicks it:
# the gateway opens in an ordinary window, already connected - no key to type.
#
# The shortcut uses its own browser profile (a separate folder), so the key and the micro:bit permission
# are kept apart from anyone's normal browsing, and nothing else on the laptop changes.
#
# To undo:  powershell -ExecutionPolicy Bypass -File gallery-shortcut.ps1 -Remove
#
# Contains no key and nothing secret: it's fine to keep this file on GitHub.

param(
  [string]$Url = "",
  [switch]$Remove
)
$ErrorActionPreference = "Stop"

$lnk = Join-Path ([Environment]::GetFolderPath("Desktop")) "Exhibit gateway.lnk"
$profileDir = Join-Path $env:LOCALAPPDATA "ExhibitGateway"

if ($Remove) {
  Write-Host "Before this: to remove the saved key, open the 'Exhibit gateway' shortcut and press 'Forget key'."
  Write-Host "(Deleting $profileDir by hand may be refused: security software often protects browser profiles.)"
  if (Test-Path $lnk) { Remove-Item $lnk; Write-Host "Removed $lnk" } else { Write-Host "No shortcut to remove." }
  return
}

# Chrome if it's installed, otherwise Edge (always on Windows). Both have Web Serial.
$browser = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $browser) { throw "Neither Chrome nor Edge was found on this laptop." }

if (-not $Url) {
  Write-Host "Gateway address, e.g. https://yourname.github.io/Base44-Test/gateway/"
  $Url = (Read-Host "Address").Trim()
}
if ($Url -notmatch '^https://[^\s]+/gateway/?$') {
  throw "That should be the GitHub Pages address of the gateway, ending in /gateway/  (got: $Url)"
}
if (-not $Url.EndsWith("/")) { $Url += "/" }

New-Item -ItemType Directory -Force $profileDir | Out-Null
$s = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
$s.TargetPath = $browser
# --user-data-dir: its own profile, where the key is kept; an ordinary window, not full screen
$s.Arguments = "--user-data-dir=`"$profileDir`" --no-first-run --no-default-browser-check --new-window `"$Url`""
$s.Description = "Exhibit gateway (connects the phones and the micro:bits)"
$s.WorkingDirectory = Split-Path $browser
$s.Save()

Write-Host ""
Write-Host "Browser:  $browser"
Write-Host "Made:     $lnk"
Write-Host ""
Write-Host "Now, once:"
Write-Host "  1. Double-click 'Exhibit gateway' on the desktop."
Write-Host "  2. Paste the gateway key -> Connect. Plug in the gateway micro:bit -> Connect micro:bit -> pick it."
Write-Host "From then on, opening the shortcut is all it takes."
