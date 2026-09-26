# 크롬 창을 맨 앞으로 가져온 뒤 화면 전체(주소창·작업표시줄 시계 포함)를 PNG 로 저장해요.
#   powershell -File screenshot.ps1 -ChromePid <크롬 pid> -Out <저장 경로>
# C# 컴파일(Add-Type)을 쓰지 않아요 — 환경에 따라 임시 DLL 로드가 막혀서 실패해요.
param([int]$ChromePid, [string]$Out)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 1) 크롬 창 앞으로 (COM AppActivate — 성공하면 $true)
$procs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
$p = $procs | Where-Object { $_.Id -eq $ChromePid } | Select-Object -First 1
if (-not $p) { $p = $procs | Sort-Object StartTime -Descending | Select-Object -First 1 }
if (-not $p) { Write-Output "no-chrome-window"; exit 4 }
$shell = New-Object -ComObject WScript.Shell
$ok = $false
for ($i = 0; $i -lt 3 -and -not $ok; $i++) { $ok = $shell.AppActivate($p.Id); Start-Sleep -Milliseconds 300 }
if (-not $ok) { Write-Output "not-foreground"; exit 3 }
Start-Sleep -Milliseconds 700

# 2) 실제 픽셀 크기 — 이 프로세스는 DPI 배율을 모르므로(논리 크기만 보임) 그래픽 카드가 알려주는 물리 해상도를 써요
$logical = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$vc = Get-CimInstance Win32_VideoController | Where-Object { $_.CurrentHorizontalResolution } | Select-Object -First 1
$w = if ($vc) { [int]$vc.CurrentHorizontalResolution } else { $logical.Width }
$h = if ($vc) { [int]$vc.CurrentVerticalResolution } else { $logical.Height }

# 3) 화면 전체 복사
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen(0, 0, 0, 0, (New-Object System.Drawing.Size $w, $h))
$dir = Split-Path -Parent $Out
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "saved $Out ($w x $h)"
