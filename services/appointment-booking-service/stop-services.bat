@echo off
echo ========================================
echo Stopping ezClinic Services
echo ========================================
echo.

docker-compose down

if %errorlevel% equ 0 (
    echo.
    echo Services stopped successfully!
) else (
    echo.
    echo [ERROR] Failed to stop services!
)

echo.
pause
