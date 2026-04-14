@echo off
echo ========================================
echo ezClinic Appointment Service - Docker Build
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/4] Stopping existing containers...
docker-compose down

echo.
echo [2/4] Building Docker image...
docker-compose build

if %errorlevel% neq 0 (
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Starting services...
docker-compose up -d

if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services!
    pause
    exit /b 1
)

echo.
echo [4/4] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo Services are running!
echo ========================================
echo.
echo Appointment Service: http://localhost:3004/api/appointments
echo RabbitMQ Management: http://localhost:15672 (guest/guest)
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
