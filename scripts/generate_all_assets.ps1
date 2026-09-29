Add-Type -AssemblyName System.Drawing

$src = "C:\Users\sjais\.gemini\antigravity-ide\brain\0a52ffd0-4aac-415c-a7fa-e7f2416cab90\.user_uploaded\media_1790706971584.jpg"
$destDir = "c:\Users\sjais\OneDrive\Documents\Desktop\code for communities\frontend\public"
$appDir = "c:\Users\sjais\OneDrive\Documents\Desktop\code for communities\frontend\app"

if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

$bmp = New-Object System.Drawing.Bitmap($src)

function Resize-Bmp($sourceBmp, $w, $h) {
    $target = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($sourceBmp, 0, 0, $w, $h)
    $g.Dispose()
    return $target
}

function Make-Transparent($sourceBmp) {
    $result = New-Object System.Drawing.Bitmap($sourceBmp.Width, $sourceBmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($y = 0; $y -lt $sourceBmp.Height; $y++) {
        for ($x = 0; $x -lt $sourceBmp.Width; $x++) {
            $p = $sourceBmp.GetPixel($x, $y)
            $avg = ($p.R + $p.G + $p.B) / 3.0
            if ($avg -ge 250) {
                # fully transparent
                $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $p.R, $p.G, $p.B))
            } elseif ($avg -gt 235) {
                # antialiased blend
                $alpha = [int](255 * (250 - $avg) / 15.0)
                if ($alpha -lt 0) { $alpha = 0 }
                if ($alpha -gt 255) { $alpha = 255 }
                $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
            } else {
                $result.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
            }
        }
    }
    return $result
}

# 1. Square Emblem Crop: centered at X=512, Y=389, size 460x460
$emblemCropSize = 460
$emblemX = [int](512 - ($emblemCropSize / 2))
$emblemY = [int](389 - ($emblemCropSize / 2))
$emblemRect = New-Object System.Drawing.Rectangle($emblemX, $emblemY, $emblemCropSize, $emblemCropSize)
$emblemOriginal = $bmp.Clone($emblemRect, $bmp.PixelFormat)

# Make transparent version of emblem
$emblemTrans = Make-Transparent $emblemOriginal

# Save Emblem variants
$icon512Trans = Resize-Bmp $emblemTrans 512 512
$icon512Trans.Save("$destDir\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon512Trans.Save("$destDir\icon-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

$icon192Trans = Resize-Bmp $emblemTrans 192 192
$icon192Trans.Save("$destDir\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192Trans.Save("$destDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192Trans.Save("$appDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$icon180Trans = Resize-Bmp $emblemTrans 180 180
$icon180Trans.Save("$destDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon180Trans.Save("$appDir\apple-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$icon64Trans = Resize-Bmp $emblemTrans 64 64
$icon64Trans.Save("$destDir\icon-64.png", [System.Drawing.Imaging.ImageFormat]::Png)

$icon32Trans = Resize-Bmp $emblemTrans 32 32
$icon32Trans.Save("$destDir\favicon-32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon32Trans.Save("$destDir\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Save Favicon .ico
$hIcon = $icon32Trans.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($hIcon)
$icoFs = [System.IO.File]::OpenWrite("$destDir\favicon.ico")
$ico.Save($icoFs)
$icoFs.Close()

$icoFsApp = [System.IO.File]::OpenWrite("$appDir\favicon.ico")
$ico.Save($icoFsApp)
$icoFsApp.Close()
$ico.Dispose()

# Save Opaque Emblem variant
$emblemOriginalResized = Resize-Bmp $emblemOriginal 512 512
$emblemOriginalResized.Save("$destDir\logo-mark.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Full Logo Crop: X from 60 to 964 (width 904), Y from 150 to 830 (height 680)
$fullRect = New-Object System.Drawing.Rectangle(60, 150, 904, 680)
$fullOriginal = $bmp.Clone($fullRect, $bmp.PixelFormat)
$fullOriginal.Save("$destDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

$fullTrans = Make-Transparent $fullOriginal
$fullTrans.Save("$destDir\logo-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Clean up
$bmp.Dispose()
$emblemOriginal.Dispose()
$emblemTrans.Dispose()
$emblemOriginalResized.Dispose()
$icon512Trans.Dispose()
$icon192Trans.Dispose()
$icon180Trans.Dispose()
$icon64Trans.Dispose()
$icon32Trans.Dispose()
$fullOriginal.Dispose()
$fullTrans.Dispose()

Write-Output "Successfully generated transparent and multi-res logo assets."
