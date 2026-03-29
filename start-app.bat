@echo off
setlocal enabledelayedexpansion

echo ===================================
echo Starting LabMate Application Suite
echo ===================================

:: Check if port 3000 is already in use
echo Checking if port 3000 is already in use...
netstat -ano | findstr :3000 > nul
if %ERRORLEVEL% EQU 0 (
    echo Port 3000 is already in use. Attempting to free it...
    
    :: Find the PID using port 3000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        set PID=%%a
        goto :found_pid
    )
    
    :found_pid
    echo Attempting to terminate process with PID !PID!...
    taskkill /F /PID !PID!
    
    :: Wait a moment for the port to be released
    timeout /t 2 /nobreak > nul
    
    :: Check again if port is free
    netstat -ano | findstr :3000 > nul
    if %ERRORLEVEL% EQU 0 (
        echo Failed to free port 3000. Please close the application using this port manually.
        echo You can identify the process using: netstat -ano ^| findstr :3000
        echo Then terminate it using: taskkill /F /PID [PID]
        pause
        exit /b 1
    ) else (
        echo Successfully freed port 3000.
    )
) else (
    echo Port 3000 is available.
)

:: Check for Node.js installation
echo Checking for Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Install project dependencies if needed
echo Checking project dependencies...
if not exist "node_modules" (
    echo Node modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Failed to install dependencies. Please check your internet connection or npm configuration.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
) else (
    echo Node modules found.
)

:: Check for Docker installation
echo Checking for Docker installation...
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Docker is not installed or not in PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

:: Check if Docker engine is running
echo Checking if Docker engine is running...
docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Docker engine is not running.
    echo Please start Docker Desktop, then run this script again.
    pause
    exit /b 1
)

:: Check if docker-compose.yml exists
if not exist "docker-compose.yml" (
    echo docker-compose.yml was not found in the project root.
    pause
    exit /b 1
)

:: Start MongoDB via Docker Compose
echo Starting MongoDB container via Docker Compose...
docker compose up -d mongodb
if %ERRORLEVEL% neq 0 (
    echo Failed to start MongoDB container.
    pause
    exit /b 1
)

:: Wait for MongoDB health check
echo Waiting for MongoDB container to become healthy...
set MONGO_HEALTH=unknown
for /l %%i in (1,1,20) do (
    for /f %%s in ('docker inspect --format "{{.State.Health.Status}}" labmate-mongodb 2^>nul') do set MONGO_HEALTH=%%s
    if /I "!MONGO_HEALTH!"=="healthy" goto :mongo_ready
    echo Attempt %%i/20 - current MongoDB status: !MONGO_HEALTH!
    timeout /t 2 /nobreak >nul
)

echo MongoDB did not report healthy in time. Continuing startup anyway...
goto :mongo_continue

:mongo_ready
echo MongoDB container is healthy.

:mongo_continue

:: Start the Node.js application with Nodemon
echo Starting Node.js application with Nodemon on port 3000...
start "Node.js Server" cmd /c npx nodemon index.js

:: Wait for the server to start
echo Waiting for server to start...
timeout /t 3 /nobreak >nul

:: Open the default browser to localhost:3000
echo Opening application in browser...
start http://localhost:3000

echo ===================================
echo LabMate Application Suite is running
echo ===================================
echo MongoDB: Running in Docker container labmate-mongodb
echo Web Server: Running at http://localhost:3000
echo.
echo To stop the application:
echo 1. Close the Node.js window
echo 2. Stop MongoDB container with: docker compose stop mongodb
echo ===================================

exit /b 0
