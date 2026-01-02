@echo off
echo ===================================
echo 💰 Gestor de Gastos - Inicio Rápido
echo ===================================
echo.

if not exist "node_modules" (
    echo 📦 Instalando dependencias por primera vez...
    call npm install
    echo.
)

echo 🚀 Iniciando servidor...
echo.
echo ✅ El servidor estará disponible en:
echo    http://localhost:3000
echo.
echo 📊 Presiona Ctrl+C para detener el servidor
echo.

call npm start
