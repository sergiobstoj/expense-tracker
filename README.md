# 💰 Gestor de Gastos Compartidos

Sistema web local para gestión de gastos personales y compartidos con división configurable de porcentajes, autenticación con PIN y backup automático.

## 🚀 Características

### 🔐 Seguridad
- **Sistema de autenticación con PIN** (4 dígitos por usuario)
- **PIN Maestro** para acceso de emergencia (por defecto: 0000)
- **Gestión de PINs** modificables desde configuración
- **Sesiones persistentes** con localStorage

### 🎨 Modo Oscuro
- **Toggle de tema claro/oscuro** en Configuración
- **Paleta optimizada** para ambos modos
- **Persistencia automática** de preferencia
- **Transiciones suaves** entre temas

### 📊 Dashboard Interactivo
- **Vista principal con gráficos** en tiempo real
- **6 tarjetas de estadísticas**: Ingresos, Gastos, Balance, Común, Personal, Tasa de Ahorro
- **Comparación con mes anterior**: Indicadores de tendencia (↑/↓) y porcentaje de cambio
- **Métricas avanzadas**:
  - Promedio de gasto diario
  - Proyección fin de mes
  - Top categoría del mes
- **4 gráficos visuales**: Income vs Expenses, Por Tipo, Común vs Personal, Ingresos por Persona
- **Balance visual** entre personas con código de colores
- **Tabla completa de transacciones** del mes con 7 columnas
- **Selector de mes** para análisis histórico

### 💰 Sistema de Liquidaciones
- **Registro de pagos** entre personas
- **Modal dedicado** para registrar liquidaciones
- **Tracking histórico** de todos los pagos
- **Integración con balance** automática

### 💸 Gestión de Gastos e Ingresos
- **Registro rápido** con modal y botones de categorías frecuentes
- **Categorías con emojis** (🏠 Arriendo, ☕ Café, 💡 Luz, etc.)
- **Tres tipos de gastos**: Fijo, Variable, Diario
- **División automática** según porcentajes configurables (ej: 70/30)
- **Gastos compartidos y personales**
- **Completamente editable** (modificar/eliminar cualquier registro)

### 📅 Cierre de Mes
- **Cierre manual de meses** con botón + confirmación
- **Protección contra modificaciones** en meses cerrados
- **Reapertura** de meses si es necesario
- **Validación automática** al intentar agregar gastos/ingresos

### 💾 Backup Automático
- **Backup diario automático** a las 00:00
- **Almacenamiento** en `/data/backups/backup-YYYY-MM-DD.json`
- **Retención** de últimos 30 días
- **Backup inicial** al iniciar el servidor

### 📈 Reportes y Análisis
- **Reportes mensuales** detallados
- **Balance de quién debe a quién**
- **Cálculo automático** según porcentajes
- **Exportación** a CSV y JSON
- **Gráficos históricos**

### 📋 Historial Unificado
- **Vista consolidada** de gastos e ingresos en una sola tabla
- **Diferenciación visual**: Ingresos en verde (+), gastos en rojo
- **CRUD completo**: Editar y eliminar tanto gastos como ingresos
- **Estadísticas integradas**: Total ingresos, gastos y balance neto
- **Filtros avanzados**:
  - Por tipo de transacción (gastos/ingresos/ambos)
  - Por persona (pagador o receptor)
  - Búsqueda en descripción
  - Rango de montos (mín/máx)
  - Tipo de gasto y común/personal

### ⚙️ Configuración
- **Gestión de personas** y porcentajes
- **Categorías personalizables** con emojis
- **Gestión de PINs** individual y maestro
- **Control de meses cerrados**
- **Exportación completa** de datos
- **Toggle de modo oscuro/claro**

## 📋 Requisitos

- Node.js 14 o superior
- npm o yarn

## 🔧 Instalación

1. **Instala las dependencias:**
```bash
npm install
```

2. **Configura el entorno (opcional):**
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env si necesitas cambiar puerto o habilitar red local
```

3. **Inicia el servidor:**
```bash
npm start
```

4. **Abre tu navegador en:**
```
http://localhost:3000
```

## 🌐 Acceso desde Red Local (WiFi)

Para acceder desde otros dispositivos en tu red WiFi:

### Paso 1: Configurar el servidor
Crea o edita el archivo `.env` en la raíz del proyecto:

```env
HOST=0.0.0.0
PORT=3000
```

### Paso 2: Obtener tu IP local

**Windows (CMD o PowerShell):**
```cmd
ipconfig
```
Busca "Dirección IPv4" o "IPv4 Address" → ejemplo: `192.168.1.100`

**Mac/Linux (Terminal):**
```bash
ifconfig
# o
ip addr show
```
Busca "inet" → ejemplo: `192.168.1.100`

### Paso 3: Reiniciar el servidor
```bash
npm start
```

Deberías ver:
```
📱 Access from other devices on your network:
   Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
   Then use: http://YOUR_IP:3000
```

### Paso 4: Acceder desde otros dispositivos
Desde cualquier dispositivo conectado a la MISMA WiFi:
```
http://192.168.1.100:3000
```
(Reemplaza `192.168.1.100` con TU IP local)

### ⚠️ Firewall (si no puedes acceder)

**Windows:**
```powershell
# Ejecuta PowerShell como Administrador
New-NetFirewallRule -DisplayName "Expense Tracker" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

**Linux (Ubuntu/Debian):**
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

**Mac:**
1. Preferencias del Sistema → Seguridad y Privacidad → Firewall
2. Opciones de Firewall → Añadir aplicación → Node

## 🎯 Primer Uso

1. **Configura tu PIN** en la pantalla de login
   - Selecciona tu usuario
   - Ingresa un PIN de 4 dígitos
   - El sistema lo guardará automáticamente

2. **Accede al Dashboard**
   - Verás las gráficas y estadísticas del mes actual
   - Usa el botón "+ Gasto" para registrar gastos rápidamente
   - Selecciona categorías con un click usando los botones rápidos

3. **Configura tu sistema** (Opcional)
   - Ve a Configuración
   - Ajusta nombres y porcentajes si es necesario
   - Cambia los PINs si lo deseas
   - El PIN Maestro por defecto es **0000**

4. **Registra tus ingresos**
   - Ve a la sección "Ingresos"
   - Usa los botones rápidos para categorías comunes
   - Los ingresos se reflejan automáticamente en el dashboard

## 🆕 Novedades Recientes (2026-01-03)

- ✨ **Modo oscuro** con persistencia de preferencia
- 💰 **Sistema de liquidaciones** para registrar pagos entre personas
- 📊 **Métricas mejoradas**: Promedio diario, proyección fin de mes, top categoría
- 📈 **Comparación mensual** con indicadores de tendencia
- 📋 **Historial unificado** mostrando gastos e ingresos en una tabla
- 🔍 **Filtros avanzados** por tipo de transacción, persona, descripción y monto
- 📑 **Tabla completa** en Dashboard (todas las transacciones del mes)
- 🐛 **Correcciones** en proyección y contraste de texto en dark mode

## 📁 Estructura de Datos

Los datos se almacenan en formato JSON en la carpeta `data/`:

### expenses.json
```json
[
  {
    "id": "1703012345678",
    "type": "variable",
    "category": "Supermercado",
    "amount": 85.50,
    "date": "2024-12-20",
    "paidBy": "User1",
    "isShared": true,
    "description": "Compra semanal",
    "createdAt": "2024-12-20T10:30:00.000Z"
  }
]
```

### categories.json
```json
{
  "fijo": [
    { "name": "Arriendo", "emoji": "🏠" },
    { "name": "Gym", "emoji": "💪" },
    { "name": "Cuotas", "emoji": "💳" }
  ],
  "variable": [
    { "name": "Supermercado", "emoji": "🛒" },
    { "name": "Luz", "emoji": "💡" },
    { "name": "Agua", "emoji": "💧" }
  ],
  "diario": [
    { "name": "Café", "emoji": "☕" },
    { "name": "Transporte", "emoji": "🚌" },
    { "name": "Comida", "emoji": "🍔" }
  ]
}
```

### config.json
```json
{
  "persons": ["User1", "User2"],
  "currentMonth": "2025-01",
  "splitPercentages": {
    "User1": 70,
    "User2": 30
  }
}
```

## 🎯 Tipos de Gastos

### Fijos
Gastos recurrentes con monto predecible:
- Arriendo
- Cuotas
- Gym
- Suscripciones

### Variables
Gastos recurrentes con monto variable:
- Supermercado
- Servicios (luz, agua, gas)
- Internet

### Diarios
Gastos del día a día:
- Café
- Transporte
- Comidas
- Compras pequeñas

## 💡 Conceptos Clave

### Gastos Comunes vs Personales

- **Común**: Se divide según el porcentaje configurado (ej: 50/50)
- **Personal**: No se divide, cada uno asume sus gastos personales

### Cálculo del Balance

El sistema calcula automáticamente:
1. **Total pagado** por cada persona en gastos comunes
2. **Lo que debería pagar** según su porcentaje
3. **Balance final**: diferencia entre lo pagado y lo que corresponde

**Ejemplo:**
- Gastos comunes totales: €1000
- User1 (70%): debe €700, pagó €800 → Le deben €100
- User2 (30%): debe €300, pagó €200 → Debe €100

## 🔒 Privacidad

- Todos los datos se almacenan localmente en tu equipo
- No hay conexión a internet ni servicios externos
- Tú controlas completamente tus datos

## 🛠️ Desarrollo

### Scripts disponibles

```bash
npm start          # Inicia el servidor
npm run dev        # Inicia con nodemon (reinicio automático)
```

### Estructura del proyecto

```
expense-tracker/
├── server.js              # Servidor Express (refactorizado)
├── package.json
├── src/                   # Código fuente backend
│   ├── routes/           # Rutas de la API
│   │   ├── expenses.js
│   │   ├── incomes.js
│   │   ├── categories.js
│   │   └── config.js
│   ├── services/         # Servicios
│   │   ├── fileService.js     # Manejo de archivos JSON
│   │   └── backupService.js   # Sistema de backups
│   └── utils/            # Utilidades
│       └── validators.js      # Validación de datos
├── data/                  # Datos JSON (se crea automáticamente)
│   ├── expenses.json
│   ├── incomes.json
│   ├── categories.json
│   ├── income-categories.json
│   ├── config.json
│   ├── settlements.json   # Liquidaciones entre personas
│   └── backups/          # Backups automáticos diarios
└── public/               # Frontend
    ├── index.html         # Página principal
    ├── login.html         # Login con PIN
    ├── history.html       # Historial
    ├── incomes.html       # Gestión de ingresos
    ├── reports.html       # Reportes
    ├── settings.html      # Configuración
    ├── css/
    │   └── styles.css     # Estilos globales
    └── js/
        ├── auth.js        # Autenticación
        ├── utils.js       # Utilidades comunes
        ├── dashboard.js   # Lógica del dashboard
        ├── login.js       # Lógica de login
        ├── history.js     # Lógica de historial
        ├── incomes.js     # Lógica de ingresos
        ├── reports.js     # Lógica de reportes
        └── settings.js    # Lógica de configuración
```

## 📊 Tecnologías

- **Backend**: Node.js + Express (arquitectura modular)
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Gráficos**: Chart.js
- **Almacenamiento**: JSON local (simple y portable)

## 🔒 Seguridad y Calidad

- ✅ **Validación de datos** en backend (tipos, rangos, fechas válidas)
- ✅ **IDs únicos** con UUID (previene colisiones)
- ✅ **Código modular** (separación de rutas, servicios y utilidades)
- ✅ **Backups automáticos** diarios con retención de 30 días
- ✅ **URL relativa del API** (funciona en red local)
- ⚠️ **Uso personal**: Diseñado para uso en red local confiable

## 🤝 Contribución

Este es un proyecto personal, pero si encuentras bugs o tienes sugerencias, siéntete libre de:
1. Reportar issues
2. Sugerir mejoras
3. Hacer fork del proyecto

## 📝 Licencia

MIT License - Uso libre para proyectos personales y comerciales.

## 🎨 Personalización

Puedes personalizar fácilmente:
- **Tema**: Modo claro u oscuro desde Configuración
- **Colores**: Edita las variables CSS en `styles.css`
- **Nombres de personas**: En Configuración
- **Categorías**: En Configuración
- **Porcentajes**: En Configuración (pueden variar cada mes)

## ⚡ Consejos de Uso

1. **Registra gastos diariamente** para no olvidar ninguno
2. **Revisa el balance mensualmente** para mantener cuentas claras
3. **Exporta respaldos** periódicamente
4. **Ajusta los porcentajes** al inicio de cada mes si es necesario
5. **Usa descripciones** en gastos importantes para recordar detalles

---

Desarrollado con ❤️ por @sergiobstoj
