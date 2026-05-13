@echo off
echo Iniciando envio para o GitHub (Versao Corrigida)...

:: Configura identidade rapida
git config user.email "willianson@motodelivery.com"
git config user.name "Willianson"

git init
git add .
git commit -m "primeiro deploy profissional"
git branch -M main
git remote add origin https://github.com/willianson100/moto-delivery-saas.git
echo Conectando ao servidor...
git push -u origin main

echo.
echo PRONTO! Se nao apareceu erro de "fatal", o codigo foi enviado.
echo Agora avise o Antigravity!
pause
