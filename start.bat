  @echo off
  title Expense Tracker Server
  color 0B
  mode con: cols=70 lines=25

  cls
  echo +------------------------------------------------------------------+
  echo ¦                    EXPENSE TRACKER SERVER                        ¦
  echo +------------------------------------------------------------------+
  echo.
  echo [+] Obteniendo IP local...

  REM Obtener IP local
  for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do set IP=%%a
  set IP=%IP: =%

  echo [+] Tu IP local es: %IP%
  echo.
  echo +------------------------------------------------------------------+
  echo ¦                        ACCESOS RAPIDOS                           ¦
  echo ¦------------------------------------------------------------------¦
  echo ¦  Desde tu PC:       http://localhost:3000                       ¦
  echo ¦  Desde celular:     http://%IP%:3000                        ¦
  echo +------------------------------------------------------------------+
  echo.
  echo [*] Iniciando servidor en 3 segundos...
  echo [*] Presiona Ctrl+C para detener
  echo.

  timeout /t 3 /nobreak >nul

  REM Abrir navegador
  start http://localhost:3000

  REM Iniciar servidor

  wsl -d Ubuntu bash -c "cd /mnt/c/Apps/expense-tracker && npm install && npm start"

  echo.
  echo [!] Servidor detenido.
  pause