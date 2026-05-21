@echo off
REM Script untuk prepare project sebelum zip (Windows)
REM Jalankan di root project directory

echo 🧹 Cleaning up project...

REM Remove node_modules
echo Removing node_modules...
rmdir /s /q node_modules 2>nul
rmdir /s /q backend\node_modules 2>nul
rmdir /s /q src\node_modules 2>nul

REM Remove .env files
echo Removing .env files...
del /q .env 2>nul
del /q backend\.env 2>nul
del /q src\.env 2>nul

REM Remove build files
echo Removing build files...
rmdir /s /q dist 2>nul
rmdir /s /q backend\dist 2>nul

REM Remove logs
echo Removing log files...
del /q *.log 2>nul
del /q backend\*.log 2>nul

REM Remove OS files
echo Removing OS files...
del /q .DS_Store 2>nul
del /q backend\.DS_Store 2>nul
del /q src\.DS_Store 2>nul

echo ✅ Cleanup complete!
echo.
echo 📦 Ready to zip using 7-Zip or WinRAR
echo Exclude: node_modules, .env, .env.example, dist, .git
