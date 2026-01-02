# 🚀 Guía Completa de Configuración

## 📋 Tabla de Contenidos
1. [Subir a GitHub](#github)
2. [Configurar Backup en Google Drive](#backup)
3. [Acceso en Red Local](#red-local)
4. [Servicio Siempre Activo](#servicio)

---

## 🐙 1. Subir a GitHub {#github}

### Paso 1: Preparar el repositorio

```bash
cd expense-tracker

# Crear archivo .env con tu configuración
cp .env.example .env

# Editar .env con tus rutas
nano .env  # o usa tu editor favorito
```

### Paso 2: Inicializar Git

```bash
git init
git add .
git commit -m "Initial commit: Expense Tracker System"
```

### Paso 3: Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `expense-tracker` (o el que prefieras)
3. **NO** marques "Initialize with README" (ya lo tienes)
4. Crear repositorio

### Paso 4: Subir el código

```bash
git remote add origin https://github.com/TU_USUARIO/expense-tracker.git
git branch -M main
git push -u origin main
```

### ⚠️ IMPORTANTE: Tu archivo `.env` NO se subirá a GitHub (está en .gitignore)

---

## 💾 2. Configurar Backup en Google Drive {#backup}

### Opción A: Google Drive Desktop (Recomendado)

1. **Instala Google Drive Desktop:**
   - Windows/Mac: https://www.google.com/drive/download/
   - Inicia sesión con tu cuenta

2. **Crea la carpeta de backups en Google Drive:**
   ```
   Google Drive/expense-tracker-backups/
   ```

3. **Configura el .env:**

**Windows:**
```env
BACKUP_DIR=C:/Users/TU_USUARIO/Google Drive/expense-tracker-backups
```

**Mac:**
```env
BACKUP_DIR=/Users/TU_USUARIO/Google Drive/expense-tracker-backups
```

**Linux:**
```env
BACKUP_DIR=/home/tu_usuario/GoogleDrive/expense-tracker-backups
```

4. **Reinicia el servidor:**
```bash
npm start
```

Verás: `💾 Backups stored in: /path/to/google/drive/...`

### Opción B: Rclone (Sincronización automática)

Si prefieres más control:

```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Configurar Google Drive
rclone config

# Crear script de sync
nano sync-backups.sh
```

```bash
#!/bin/bash
# Sincroniza backups con Google Drive cada hora
while true; do
    rclone sync /path/to/expense-tracker/data/backups gdrive:expense-tracker-backups
    sleep 3600
done
```

---

## 🌐 3. Acceso en Red Local {#red-local}

### Paso 1: Configurar el servidor

Edita tu archivo `.env`:

```env
HOST=0.0.0.0
PORT=3000
```

### Paso 2: Obtener tu IP local

**Windows:**
```cmd
ipconfig
```
Busca "IPv4 Address" (ej: 192.168.1.100)

**Mac/Linux:**
```bash
ifconfig
# o
ip addr show
```
Busca "inet" (ej: 192.168.1.100)

### Paso 3: Acceder desde otros dispositivos

En tu WiFi, desde cualquier dispositivo:
```
http://192.168.1.100:3000
```

### Paso 4: Configurar firewall (si es necesario)

**Windows:**
```powershell
# Abrir PowerShell como Administrador
New-NetFirewallRule -DisplayName "Expense Tracker" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

**Linux (Ubuntu):**
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

**Mac:**
- Ve a Preferencias del Sistema → Seguridad y Privacidad → Firewall
- Opciones de Firewall → Añadir aplicación → Node

---

## 🔄 4. Mantener Servicio Siempre Activo {#servicio}

### Opción A: PM2 (Recomendado - Multiplataforma)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start ecosystem.config.js

# Configurar para iniciar con el sistema
pm2 startup
# Sigue las instrucciones que te da

pm2 save

# Comandos útiles:
pm2 status           # Ver estado
pm2 logs            # Ver logs
pm2 restart expense-tracker
pm2 stop expense-tracker
pm2 delete expense-tracker
```

### Opción B: Systemd (Linux/WSL)

```bash
# 1. Editar el archivo de servicio
nano expense-tracker.service

# Cambiar:
# - YOUR_USERNAME por tu usuario
# - /path/to/expense-tracker por la ruta completa

# 2. Copiar al sistema
sudo cp expense-tracker.service /etc/systemd/system/

# 3. Activar el servicio
sudo systemctl daemon-reload
sudo systemctl enable expense-tracker
sudo systemctl start expense-tracker

# Comandos útiles:
sudo systemctl status expense-tracker
sudo systemctl restart expense-tracker
sudo systemctl stop expense-tracker
sudo journalctl -u expense-tracker -f  # Ver logs
```

### Opción C: Tarea Programada (Windows)

1. Abre "Programador de tareas"
2. Crear tarea básica:
   - Nombre: Expense Tracker
   - Desencadenador: Al iniciar el sistema
   - Acción: Iniciar programa
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `C:\ruta\a\expense-tracker\server.js`
   - Directorio inicial: `C:\ruta\a\expense-tracker`

### Opción D: Nohup (Linux simple)

```bash
# Iniciar en segundo plano
nohup npm start > expense-tracker.log 2>&1 &

# Ver el proceso
ps aux | grep node

# Detener
kill <PID>
```

---

## 📱 Acceso desde Internet (Opcional)

### Opción 1: Cloudflare Tunnel (Gratis, Temporal)

```bash
# Instalar
npm install -g cloudflared

# Crear tunnel
cloudflared tunnel --url http://localhost:3000
```

Te da una URL como: `https://random-words-123.trycloudflare.com`

### Opción 2: ngrok (Gratis con límites)

```bash
# Descargar de https://ngrok.com/download
# Registrarse y obtener authtoken

ngrok config add-authtoken TU_TOKEN
ngrok http 3000
```

### Opción 3: Railway (Hosting permanente)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

---

## 🔧 Troubleshooting

### El servidor no inicia

```bash
# Verificar que el puerto no esté en uso
netstat -an | grep 3000

# Matar proceso en el puerto
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### No puedo acceder desde otros dispositivos

1. Verifica que HOST=0.0.0.0 en .env
2. Ambos dispositivos en la misma WiFi
3. Firewall permite el puerto 3000
4. Usa la IP correcta (no localhost)

### Backups no se guardan en Google Drive

1. Verifica la ruta en BACKUP_DIR
2. Asegúrate que Google Drive Desktop esté sincronizado
3. Verifica permisos de escritura en la carpeta
4. Revisa los logs del servidor

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs` o `sudo journalctl -u expense-tracker`
2. Verifica .env tiene la configuración correcta
3. Reinicia el servicio
4. Revisa el firewall

¡Listo! Tu sistema está configurado para funcionar 24/7 con backups automáticos en Google Drive.
