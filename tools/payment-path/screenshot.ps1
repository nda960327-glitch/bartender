# 크롬 창을 작업 영역(작업표시줄 제외)에 꽉 채우고 맨 앞으로 올린 뒤, 화면 전체(주소창·작업표시줄 시계 포함)를 PNG 로 저장해요.
#   powershell -File screenshot.ps1 -ChromePid <크롬 pid> -Out <저장 경로>
param([int]$ChromePid, [string]$Out)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hh, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
}
"@
[W]::SetProcessDPIAware() | Out-Null   # 배율(150%) 화면에서도 실제 픽셀 전체를 찍어요
$procs = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
$p = $procs | Where-Object { $_.Id -eq $ChromePid } | Select-Object -First 1
if (-not $p) { $p = $procs | Sort-Object StartTime -Descending | Select-Object -First 1 }
$wa = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$TOPMOST = [IntPtr](-1); $NOTOPMOST = [IntPtr](-2); $SHOW = 0x40
if ($p) {
  $h = $p.MainWindowHandle
  [W]::ShowWindow($h, 9) | Out-Null                       # SW_RESTORE (최대화 상태면 크기 조절이 안 먹어요)
  [W]::SetWindowPos($h, $TOPMOST, $wa.X, $wa.Y, $wa.Width, $wa.Height, $SHOW) | Out-Null
  [W]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [W]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)   # ALT 한 번 — 앞으로 가져오기 제한 해제
  [W]::SetForegroundWindow($h) | Out-Null
  try { (New-Object -ComObject WScript.Shell).AppActivate($p.Id) | Out-Null } catch {}
}
Start-Sleep -Milliseconds 900
$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$dir = Split-Path -Parent $Out
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
if ($p) { [W]::SetWindowPos($p.MainWindowHandle, $NOTOPMOST, 0, 0, 0, 0, 0x1 -bor 0x2 -bor 0x40) | Out-Null }   # 항상 위 해제
Write-Output "saved $Out"
