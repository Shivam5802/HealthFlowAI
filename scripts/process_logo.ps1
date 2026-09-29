Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\sjais\.gemini\antigravity-ide\brain\0a52ffd0-4aac-415c-a7fa-e7f2416cab90\.user_uploaded\media_1790706971584.jpg"
$destDir = "c:\Users\sjais\OneDrive\Documents\Desktop\code for communities\frontend\public"

if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$bmp = New-Object System.Drawing.Bitmap($srcPath)
Write-Output "Image loaded: $($bmp.Width) x $($bmp.Height)"

# 1. Copy original full logo
$bmp.Save("$destDir\logo-original.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Save("$destDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Analyze pixel bounding box of emblem vs text
# Emblem is roughly from top to ~600px
# Let's crop the emblem (the circle with cross and pulse)
# Center of emblem is around x=512, y=365
$emblemCropSize = 580
$emblemX = [int]((1024 - $emblemCropSize) / 2)
$emblemY = 110

$rect = New-Object System.Drawing.Rectangle($emblemX, $emblemY, $emblemCropSize, $emblemCropSize)
$emblemBmp = $bmp.Clone($rect, $bmp.PixelFormat)

# Resize to icon sizes: 32x32, 64x64, 192x192, 512x512
function Resize-Bitmap($src, $w, $h) {
    $target = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $g.Dispose()
    return $target
}

# Icon 512x512
$icon512 = Resize-Bitmap $emblemBmp 512 512
$icon512.Save("$destDir\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon512.Dispose()

# Icon 192x192
$icon192 = Resize-Bitmap $emblemBmp 192 192
$icon192.Save("$destDir\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Save("$destDir\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Save("c:\Users\sjais\OneDrive\Documents\Desktop\code for communities\frontend\app\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon192.Dispose()

# Favicon 32x32
$icon32 = Resize-Bitmap $emblemBmp 32 32
$icon32.Save("$destDir\favicon-32x32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon32.Save("$destDir\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Save as .ico using Icon.FromHandle
$hIcon = $icon32.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = [System.IO.File]::OpenWrite("$destDir\favicon.ico")
$ico.Save($fs)
$fs.Close()
$fsApp = [System.IO.File]::OpenWrite("c:\Users\sjais\OneDrive\Documents\Desktop\code for communities\frontend\app\favicon.ico")
$ico.Save($fsApp)
$fsApp.Close()
$ico.Dispose()
$icon32.Dispose()

# Apple Touch Icon 180x180
$icon180 = Resize-Bitmap $emblemBmp 180 180
$icon180.Save("$destDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$icon180.Dispose()

$emblemBmp.Dispose()
$bmp.Dispose()
Write-Output "Successfully generated logo.png, icon.png, favicon.ico, and related assets."
