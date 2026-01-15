@echo off
REM Simple launcher for Windows: runs run_server.ps1 with bypass
SET scriptDir=%~dp0
powershell -NoProfile -ExecutionPolicy Bypass -File "%scriptDir%run_server.ps1"
