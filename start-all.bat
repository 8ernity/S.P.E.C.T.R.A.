@echo off
title SPECTRA - Satellite Change Intelligence
echo ============================================================
echo   SPECTRA: Satellite Precision Earth Change Tracking
echo ============================================================
echo.
echo Launching Backend and Frontend services...
start "SPECTRA Backend" cmd /k "%~dp0_run-backend.bat"
start "SPECTRA Frontend" cmd /k "%~dp0_run-frontend.bat"
echo.
echo Services launched!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo.
pause
