const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Services
const FileService = require('./src/services/fileService');
const BackupService = require('./src/services/backupService');

// Routes
const createExpensesRouter = require('./src/routes/expenses');
const createIncomesRouter = require('./src/routes/incomes');
const { createCategoriesRouter, createIncomeCategoriesRouter } = require('./src/routes/categories');
const createConfigRouter = require('./src/routes/config');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(DATA_DIR, 'backups');

// Initialize services
const fileService = new FileService(DATA_DIR);
const backupService = new BackupService(DATA_DIR, BACKUP_DIR);

// Ensure data directory and files exist
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(BACKUP_DIR, { recursive: true });

        // Initialize default files if they don't exist
        const files = ['expenses.json', 'incomes.json', 'categories.json', 'income-categories.json', 'config.json'];

        for (const file of files) {
            try {
                await fs.access(path.join(DATA_DIR, file));
            } catch {
                // File doesn't exist, create with default data
                const defaultData = fileService._getDefaultData(file);
                if (defaultData !== null) {
                    await fileService.writeJSON(file, defaultData);
                }
            }
        }

        console.log('✓ Data files initialized');
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// API Routes
app.use('/api/expenses', createExpensesRouter(fileService));
app.use('/api/incomes', createIncomesRouter(fileService));
app.use('/api/categories', createCategoriesRouter(fileService));
app.use('/api/income-categories', createIncomeCategoriesRouter(fileService));
app.use('/api/config', createConfigRouter(fileService));

// Start server
initializeData().then(async () => {
    // Create initial backup
    await backupService.createBackup();

    // Schedule daily backups
    backupService.scheduleDailyBackup();

    app.listen(PORT, HOST, () => {
        console.log(`\n🚀 Expense Tracker running on http://${HOST}:${PORT}`);
        console.log(`📊 Data stored in: ${DATA_DIR}`);
        console.log(`💾 Backups stored in: ${BACKUP_DIR}`);

        // Show network access info
        if (HOST === '0.0.0.0') {
            console.log(`\n📱 Access from other devices on your network:`);
            console.log(`   Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)`);
            console.log(`   Then use: http://YOUR_IP:${PORT}\n`);
        } else {
            console.log(`\n💡 To enable network access, set HOST=0.0.0.0 in .env file\n`);
        }
    });
});
