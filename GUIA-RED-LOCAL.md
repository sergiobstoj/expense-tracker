# 🌐 Guía Rápida: Configurar Red Local

Esta guía te ayudará a configurar la aplicación para que puedas acceder desde tu celular, tablet u otro dispositivo en tu WiFi.

## ⏱️ Tiempo estimado: 5 minutos

---

## Paso 1: Crear archivo de configuración

En la raíz del proyecto, crea un archivo llamado `.env` (si no existe):

**Windows (CMD):**
```cmd
copy .env.example .env
notepad .env
```

**Mac/Linux (Terminal):**
```bash
cp .env.example .env
nano .env
```

**Contenido del archivo `.env`:**
```env
HOST=0.0.0.0
PORT=3000
```

💾 Guarda y cierra el archivo.

---

## Paso 2: Obtener tu IP local

### En Windows:
1. Abre CMD o PowerShell
2. Ejecuta: `ipconfig`
3. Busca **"Dirección IPv4"** o **"IPv4 Address"**
4. Anota tu IP (ejemplo: `192.168.1.100`)

### En Mac:
1. Abre Terminal
2. Ejecuta: `ifconfig | grep "inet "`
3. Busca la IP que empieza con `192.168` o `10.0`
4. Anota tu IP (ejemplo: `192.168.1.100`)

### En Linux:
1. Abre Terminal
2. Ejecuta: `ip addr show` o `ifconfig`
3. Busca la IP de tu conexión WiFi/Ethernet
4. Anota tu IP (ejemplo: `192.168.1.100`)

---

## Paso 3: Iniciar el servidor

```bash
npm start
```

Deberías ver algo como:
```
🚀 Expense Tracker running on http://0.0.0.0:3000
📱 Access from other devices on your network:
   Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
   Then use: http://YOUR_IP:3000
```

---

## Paso 4: Probar desde otro dispositivo

Desde tu celular/tablet (conectado a la MISMA WiFi):

1. Abre el navegador
2. Ingresa: `http://TU_IP:3000`
   - Ejemplo: `http://192.168.1.100:3000`
3. ¡Deberías ver la aplicación!

---

## ❌ Troubleshooting

### No puedo acceder desde otro dispositivo

**Verificar:**
1. ✅ Ambos dispositivos están en la MISMA red WiFi
2. ✅ El servidor está corriendo (`npm start`)
3. ✅ La IP es correcta
4. ✅ El puerto es 3000

**Solución Firewall:**

Si todo lo anterior está bien pero no funciona, probablemente es el firewall:

### Windows:
1. Abre PowerShell **como Administrador**
2. Ejecuta:
```powershell
New-NetFirewallRule -DisplayName "Expense Tracker" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### Linux:
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

### Mac:
1. Ve a: **Preferencias del Sistema** → **Seguridad y Privacidad** → **Firewall**
2. Click en **Opciones de Firewall**
3. Click en **+** para agregar aplicación
4. Busca y selecciona **Node**
5. Click en **Añadir**

---

## 📝 Notas Importantes

- ⚠️ Esta configuración solo funciona en tu red local (WiFi de tu casa)
- 🔒 No expone la aplicación a Internet (es seguro)
- 🏠 Si cambias de casa/WiFi, tu IP puede cambiar (repetir Paso 2)
- 🔄 Puedes volver a `HOST=localhost` en el `.env` si solo quieres usar en tu PC

---

## ✅ Configuración Exitosa

Si puedes ver la aplicación desde tu celular/tablet, ¡todo está funcionando correctamente! 🎉

**URL de acceso:**
- Desde tu PC: `http://localhost:3000`
- Desde otros dispositivos: `http://TU_IP:3000`

---

## 🆘 ¿Necesitas ayuda?

Si sigues teniendo problemas:
1. Verifica que el servidor esté corriendo
2. Intenta reiniciar el router
3. Verifica que no tengas VPN activa
4. Prueba con otro navegador
