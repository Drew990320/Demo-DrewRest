Add-Type -AssemblyName System.Drawing

$src = $args[0]
$dst = $args[1]
$widthPx = [int]$args[2]
$heightFrac = [double]$args[3]

$img = [System.Drawing.Image]::FromFile($src)
Write-Output "source $($img.Width)x$($img.Height)"

$heightPx = [Math]::Max(1, [Math]::Round(($img.Height * $widthPx / $img.Width) * $heightFrac))
$bmp = New-Object System.Drawing.Bitmap $widthPx, $heightPx
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($img, 0, 0, $widthPx, $heightPx)
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$img.Dispose()

$out = [System.Drawing.Image]::FromFile($dst)
Write-Output "saved $($out.Width)x$($out.Height) -> $dst"
$out.Dispose()
