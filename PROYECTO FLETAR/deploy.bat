@echo off
cd /d "%~dp0"
echo Deployando a Vercel...
vercel --prod
pause
