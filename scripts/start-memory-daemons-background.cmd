@echo off
set SCRIPT_PATH=C:\Users\carlo\Documents\grupo4D\framework-sdd\scripts\start-memory-daemons-windows.ps1
start "FrameworkSDD-MemoryDaemons" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%SCRIPT_PATH%"
exit /b 0
