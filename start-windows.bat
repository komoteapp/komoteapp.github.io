@echo off
title KOMOTE Local Offline Server
echo ===================================================
echo   KOMOTE - Kindle KOReader Remote (Local Server)
echo ===================================================
echo.
echo Launching local HTTP server for full Bluetooth and Gamepad support...
echo (Note: Browsers block Bluetooth / Gamepad APIs on direct file:/// paths)
echo.

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Python found! Starting server at http://localhost:8088 ...
    start http://localhost:8088
    python -m http.server 8088
    goto end
)

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Python found! Starting server at http://localhost:8088 ...
    start http://localhost:8088
    py -m http.server 8088
    goto end
)

where npx >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Node.js found! Starting server at http://localhost:8088 ...
    start http://localhost:8088
    npx serve -l 8088
    goto end
)

echo Python or Node.js not detected. Opening index.html directly...
echo Warning: For full Bluetooth Controller & PWA support, run via a local server or open the live cloud link.
start index.html

:end
pause
