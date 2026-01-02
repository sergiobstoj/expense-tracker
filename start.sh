#!/bin/bash

echo "==================================="
echo "💰 Gestor de Gastos - Inicio Rápido"
echo "==================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias por primera vez..."
    npm install
    echo ""
fi

echo "🚀 Iniciando servidor..."
echo ""
echo "✅ El servidor estará disponible en:"
echo "   http://localhost:3000"
echo ""
echo "📊 Presiona Ctrl+C para detener el servidor"
echo ""

npm start
