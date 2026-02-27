# Storage Cleanup Script for Windows

$baseDir = "c:\Users\Yoga Krisna\hcms-elearning"
Set-Location $baseDir

Write-Host "=== STORAGE CLEANUP SCRIPT ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current structure:" -ForegroundColor Yellow
Write-Host "1. storage/app/public/materials/ - 2 files"
Write-Host "2. storage/app/public/public/materials/ - 4 files (ACTUAL DATA)"
Write-Host "3. storage/app/materials/ - EMPTY"
Write-Host "4. storage/app/private/public/ - EMPTY"
Write-Host ""

# Step 1: Move files from public/public/materials to public/materials
Write-Host "Step 1: Consolidating materials..." -ForegroundColor Yellow
$sourceDir = "$baseDir\storage\app\public\public\materials"
$targetDir = "$baseDir\storage\app\public\materials"

if (Test-Path $sourceDir) {
    Write-Host "Moving files from public/public/materials to public/materials..."
    Get-ChildItem $sourceDir -File | ForEach-Object {
        Copy-Item $_.FullName -Destination $targetDir -Force
        Write-Host "  ✓ Copied $($_.Name)"
    }
}

# Step 2: Remove redundant directories
Write-Host ""
Write-Host "Step 2: Removing redundant folders..." -ForegroundColor Yellow

$foldersToRemove = @(
    "$baseDir\storage\app\public\public",
    "$baseDir\storage\app\materials",
    "$baseDir\storage\app\private"
)

foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Remove-Item $folder -Recurse -Force
        Write-Host "✓ Removed $($folder -replace [regex]::Escape($baseDir), '.')"
    }
}

# Step 3: Verify structure
Write-Host ""
Write-Host "Step 3: Verification..." -ForegroundColor Yellow
$fileCount = @(Get-ChildItem "$targetDir" -File -Recurse 2>$null).Count
Write-Host "Files in storage/app/public/materials: $fileCount"

# Step 4: Show new structure
Write-Host ""
Write-Host "=== CLEANUP COMPLETE ===" -ForegroundColor Green
Write-Host "New clean structure:" -ForegroundColor Green
Write-Host "✓ storage/app/public/materials/ (all materials here)"
Write-Host "✓ storage/app/public/questions/"
Write-Host "✓ storage/app/public/training-materials/"
Write-Host "✓ storage/app/public/training-programs/"
Write-Host "✓ storage/app/exports/"
Write-Host "✓ storage/app/reports/"
