# Update PHP limits for file upload
$phpIni = "C:\Program Files\php-8.3.7\php.ini"

Write-Host "Reading php.ini..." -ForegroundColor Cyan
$content = Get-Content $phpIni -Raw

Write-Host "Updating limits..." -ForegroundColor Cyan
$content = $content -replace 'upload_max_filesize = 2M', 'upload_max_filesize = 100M'
$content = $content -replace 'post_max_size = 8M', 'post_max_size = 100M'
$content = $content -replace 'memory_limit = 128M', 'memory_limit = 512M'
$content = $content -replace 'max_execution_time = 30', 'max_execution_time = 120'

Write-Host "Saving changes..." -ForegroundColor Cyan
Set-Content $phpIni -Value $content

Write-Host "`nPHP limits updated successfully!" -ForegroundColor Green
Write-Host "- upload_max_filesize: 100M" -ForegroundColor Green
Write-Host "- post_max_size: 100M" -ForegroundColor Green
Write-Host "- memory_limit: 512M" -ForegroundColor Green
Write-Host "- max_execution_time: 120s" -ForegroundColor Green
Write-Host "`nPlease restart php artisan serve" -ForegroundColor Yellow
