# 🚀 GUÍA DE INICIO RÁPIDO

## Para empezar (primera vez)

### En Linux/Mac:
```bash
./start.sh
```

### En Windows:
```bash
start.bat
```

O manualmente:
```bash
npm install
npm start
```

## Acceso

Abre tu navegador en: **http://localhost:3000**

## Primeros pasos

1. **Configura las personas y porcentajes**
   - Ve a Configuración (menú superior)
   - Cambia los nombres de las personas
   - Ajusta los porcentajes (deben sumar 100%)
   - Guarda cambios

2. **Personaliza las categorías**
   - En la misma página de Configuración
   - Agrega/elimina categorías según tus necesidades
   - Ejemplo: "Netflix", "Spotify", "Uber", etc.

3. **Registra tu primer gasto**
   - Ve a la página principal
   - Completa el formulario
   - ¡Listo!

## Estructura de carpetas

```
expense-tracker/
├── data/              ← Tus datos se guardan aquí
├── public/            ← Archivos de la web
├── server.js          ← Servidor Node.js
├── start.sh           ← Inicio rápido (Linux/Mac)
├── start.bat          ← Inicio rápido (Windows)
└── README.md          ← Documentación completa
```

## Tips importantes

✅ Los datos se guardan automáticamente
✅ Puedes editar cualquier gasto después
✅ El balance se calcula automáticamente
✅ Exporta backups regularmente desde Configuración

## ¿Problemas?

- **Puerto ocupado**: Cierra otras apps en puerto 3000
- **Comando no encontrado**: Instala Node.js desde nodejs.org
- **No se guardan datos**: Verifica permisos en carpeta `data/`

## Características destacadas

🎯 Registra gastos en segundos
📊 Reportes visuales con gráficos
💰 Balance automático (quién debe a quién)
📁 Exporta a CSV/JSON
🔒 100% local y privado

---

¡Disfruta gestionando tus gastos! 💰
