# Changelog

## [Features Mayores - 2026-01-03]

### 🎨 Modo Oscuro
- **Toggle de tema** en página de Configuración
- **CSS Variables** para cambio dinámico de colores
- **Persistencia** con localStorage
- **Paleta optimizada** para legibilidad en ambos modos
- **Contraste mejorado** en gráficos y textos

### 💰 Sistema de Liquidaciones
- **Registro de pagos** entre personas
- **Modal dedicado** en Dashboard
- **API REST completa** (`/api/settlements`)
- **Tracking histórico** de liquidaciones
- **Persistencia** en `data/settlements.json`

### 📊 Métricas Mejoradas (Dashboard)
- **Promedio de gasto diario** calculado del mes actual
- **Proyección fin de mes** con fórmula corregida
- **Top categoría** del mes (mayor gasto)
- **Comparación mes anterior**:
  - Indicadores de tendencia (↑/↓)
  - Porcentaje de cambio
  - Color según mejora/empeora
- **Flechas de tendencia** en tarjetas principales

### 📋 Historial Unificado
- **Tabla única** mostrando gastos e ingresos
- **Diferenciación visual**:
  - Ingresos en verde con signo +
  - Gastos en rojo
- **Estadísticas integradas**: Total ingresos, gastos y balance neto
- **CRUD completo para ingresos** desde historial
- **Modal de edición** específico para ingresos

### 🔍 Filtros Avanzados (Historial)
- **Tipo de transacción**: Todos, Solo Gastos, Solo Ingresos
- **Persona**: Unificado (paidBy/receivedBy)
- **Búsqueda por descripción** (case-insensitive)
- **Rango de montos** (mínimo/máximo)
- **Tipo de gasto** (fijo/variable/diario)
- **Común/Personal** (solo para gastos)
- **Filtros inteligentes** que se adaptan al tipo seleccionado

### 📑 Tabla Completa en Dashboard
- **Todas las transacciones** del mes (no solo recientes)
- **7 columnas** con información detallada
- **Ordenamiento** por fecha descendente

### 🐛 Correcciones
- **Fix proyección fin de mes**: Fórmula actualizada a `gastoActual + (promediodiario * díasRestantes)`
- **Fix contraste dark mode**: Texto forzado a oscuro en secciones con fondo claro
- **Fix legibilidad**: Balance entre personas y reportes ahora legibles en dark mode

---

## [Mejoras UX y Docs - 2026-01-02]

### 🎨 Mejoras de Interfaz

#### Categorías como Botones
- **Ingresos**: Todas las categorías se muestran como botones (eliminado botón "Otro...")
- **Gastos**: Todas las categorías del tipo seleccionado se muestran como botones
- **Beneficio**: Interfaz más simple y rápida - un click y listo

#### Bug Fixes
- ✅ Arreglado problema de validación de formularios (campos required ocultos)
- ✅ Corregidas rutas de income-categories en el backend

### 📚 Documentación Actualizada

- ✅ Guía clara de configuración de red local en README.md
- ✅ Instrucciones paso a paso para Windows, Mac y Linux
- ✅ Sección de troubleshooting de firewall
- ✅ Ejemplos prácticos con IPs reales

---

## [Refactorización 2026-01-02]

### 🎯 Mejoras Implementadas

#### ✅ Fixes Críticos
- **URL del API**: Cambiada de `http://localhost:3000/api` a `/api` (URL relativa)
  - **Beneficio**: Ahora funciona desde cualquier dispositivo en la red local
  - **Archivo**: `public/js/utils.js`

- **IDs únicos**: Cambiado de `Date.now()` a `crypto.randomUUID()`
  - **Beneficio**: Elimina riesgo de colisiones cuando se crean registros rápidamente
  - **Archivos**: `src/routes/expenses.js`, `src/routes/incomes.js`

#### 🏗️ Refactorización del Código

**Antes**: Todo en `server.js` (495 líneas)
**Ahora**: Arquitectura modular y separada

##### Nueva Estructura:
```
src/
├── routes/              # Rutas separadas por entidad
│   ├── expenses.js     # Rutas de gastos
│   ├── incomes.js      # Rutas de ingresos
│   ├── categories.js   # Rutas de categorías
│   └── config.js       # Rutas de configuración
├── services/           # Lógica de negocio
│   ├── fileService.js  # Manejo centralizado de JSON
│   └── backupService.js # Sistema de backups
└── utils/              # Utilidades
    └── validators.js   # Validación de datos
```

**Beneficios**:
- ✅ Código más fácil de mantener
- ✅ Sin duplicación (DRY principle)
- ✅ Separación de responsabilidades
- ✅ Facilita agregar nuevas features
- ✅ server.js reducido a 91 líneas (↓ 81%)

#### 🛡️ Validación de Datos

Se agregó validación robusta en el backend:

**Expenses**:
- ✅ Tipo debe ser: fijo, variable o diario
- ✅ Categoría requerida (string)
- ✅ Monto requerido (número > 0)
- ✅ Fecha válida (formato YYYY-MM-DD)
- ✅ PaidBy requerido (string)
- ✅ isShared debe ser booleano

**Incomes**:
- ✅ Categoría requerida
- ✅ Monto requerido (número > 0)
- ✅ Fecha válida
- ✅ ReceivedBy requerido

**Config**:
- ✅ Mínimo 2 personas
- ✅ Porcentajes deben sumar 100%

**Beneficio**: Previene corrupción de datos por inputs inválidos

#### 📚 Documentación

- ✅ README.md actualizado con estructura real del proyecto
- ✅ Ejemplos de datos corregidos (categorías con emojis)
- ✅ Nueva sección de "Seguridad y Calidad"
- ✅ Estructura de carpetas documentada

### 🔄 Compatibilidad

- ✅ **100% compatible** con datos existentes
- ✅ **Sin breaking changes** en la API
- ✅ Mismos endpoints, misma estructura JSON
- ✅ Frontend sin cambios (excepto URL del API)

### 📦 Dependencias

- Sin cambios en dependencias principales
- Express 4.18.2
- CORS 2.8.5
- Dotenv 16.3.1

### 🚀 Próximos Pasos (Opcionales)

- [ ] Actualizar dependencias a versiones más recientes
- [ ] Mejorar logging con biblioteca estructurada
- [ ] Agregar tests unitarios
- [ ] Implementar rate limiting (si se expone a internet)

---

## Notas para Uso Personal

Esta refactorización se enfocó en:
1. **Funcionalidad**: Fixes que previenen bugs reales
2. **Mantenibilidad**: Código más fácil de entender y modificar
3. **Simplicidad**: Mantener JSON (no SQLite) para facilidad de uso

**No se implementaron** (innecesarios para uso personal en red local):
- ❌ Encriptación de PINs
- ❌ HTTPS
- ❌ Rate limiting
- ❌ Autenticación en backend
- ❌ SQLite (JSON es suficiente)
