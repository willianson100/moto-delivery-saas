@echo off
title MotoDelivery SaaS - Iniciando...
color 0A
echo.
echo  ============================================
echo    MotoDelivery SaaS - Iniciando servidor...
echo  ============================================
echo.
echo  Instalando dependencias (so na primeira vez)...
call npm install @supabase/ssr

echo.
echo  Iniciando servidor de desenvolvimento...
echo  Acesse: http://localhost:3000
echo.
call npm run dev
pause
