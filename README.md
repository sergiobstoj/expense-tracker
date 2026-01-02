# 💰 Gestor de Gastos Compartidos

Sistema web local para gestión de gastos personales y compartidos con división configurable de porcentajes, autenticación con PIN y backup automático.

## 🚀 Características

### 🔐 Seguridad
- **Sistema de autenticación con PIN** (4 dígitos por usuario)
- **PIN Maestro** para acceso de emergencia (por defecto: 0000)
- **Gestión de PINs** modificables desde configuración
- **Sesiones persistentes** con localStorage

### 📊 Dashboard Interactivo
- **Vista principal con gráficos** en tiempo real
- **6 tarjetas de estadísticas**: Ingresos, Gastos, Balance, Común, Personal, Tasa de Ahorro
- **4 gráficos visuales**: Income vs Expenses, Por Tipo, Común vs Personal, Ingresos por Persona
- **Balance visual** entre personas con código de colores
- **Actividad reciente** (últimos 10 movimientos)
- **Selector de mes** para análisis histórico

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

### ⚙️ Configuración
- **Gestión de personas** y porcentajes
- **Categorías personalizables** con emojis
- **Gestión de PINs** individual y maestro
- **Control de meses cerrados**
- **Exportación completa** de datos

## 📋 Requisitos

- Node.js 14 o superior
- npm o yarn

## 🔧 Instalación

1. **Instala las dependencias:**
```bash
npm install
```

2. **Inicia el servidor:**
```bash
npm start
```

3. **Abre tu navegador en:**
```
http://localhost:3000
```

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
  "fijo": ["Arriendo", "Gym", "Cuotas"],
  "variable": ["Supermercado", "Luz", "Agua"],
  "diario": ["Café", "Transporte", "Comida"]
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
├── server.js              # Servidor Express
├── package.json
├── data/                  # Datos JSON (se crea automáticamente)
│   ├── expenses.json
│   ├── categories.json
│   └── config.json
└── public/
    ├── index.html         # Página principal
    ├── history.html       # Historial
    ├── reports.html       # Reportes
    ├── settings.html      # Configuración
    ├── css/
    │   └── styles.css     # Estilos globales
    └── js/
        ├── utils.js       # Utilidades comunes
        ├── main.js        # Lógica principal
        ├── history.js     # Lógica de historial
        ├── reports.js     # Lógica de reportes
        └── settings.js    # Lógica de configuración
```

## 📊 Tecnologías

- **Backend**: Node.js + Express
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Gráficos**: Chart.js
- **Almacenamiento**: JSON local

## 🤝 Contribución

Este es un proyecto personal, pero si encuentras bugs o tienes sugerencias, siéntete libre de:
1. Reportar issues
2. Sugerir mejoras
3. Hacer fork del proyecto

## 📝 Licencia

MIT License - Uso libre para proyectos personales y comerciales.

## 🎨 Personalización

Puedes personalizar fácilmente:
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
