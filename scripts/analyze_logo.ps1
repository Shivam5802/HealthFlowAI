Add-Type -AssemblyName System.Drawing

$src = "C:\Users\sjais\.gemini\antigravity-ide\brain\0a52ffd0-4aac-415c-a7fa-e7f2416cab90\.user_uploaded\media_1790706971584.jpg"
$bmp = New-Object System.Drawing.Bitmap($src)

$minY = 9999; $maxY = 0; $minX = 9999; $maxX = 0
$gapY = 0

for ($y = 0; $y -lt $bmp.Height; $y += 2) {
    $rowHasColor = $false
    for ($x = 0; $x -lt $bmp.Width; $x += 2) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
            $rowHasColor = $true
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    if ($rowHasColor) {
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
    }
}

Write-Output "Overall Content: X from $minX to $maxX, Y from $minY to $maxY"

# Find horizontal gap between the circular emblem and text "HEALTHFLOW AI"
$gapStart = 0; $gapEnd = 0
for ($y = 500; $y -lt 700; $y += 2) {
    $hasColor = $false
    for ($x = $minX; $x -le $maxX; $x += 4) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240) {
            $hasColor = $true
            break
        }
    }
    if (!$hasColor -and $gapStart -eq 0) {
        $gapStart = $y
    } elseif ($hasColor -and $gapStart -ne 0 -and $gapEnd -eq 0) {
        $gapEnd = $y
    }
}

Write-Output "Emblem/Text Separation Gap: Y from $gapStart to $gapEnd"

$bmp.Dispose()
