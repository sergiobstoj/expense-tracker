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
const createSettlementsRouter = require('./src/routes/settlements');
const createExpensesConfigRouter = require('./src/routes/expenses-config');

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
        const files = [
            'expenses.json',
            'incomes.json',
            'categories.json',
            'income-categories.json',
            'config.json',
            'settlements.json',
            'fixed-expenses-config.json',
            'variable-expenses-config.json',
            'daily-expenses-config.json'
        ];

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

// ============================================
// MIGRATION TO MONTHLY STRUCTURE
// ============================================

async function migrateToMonthlyStructure() {
    const migrationFlag = path.join(DATA_DIR, '.migrated');
    const monthsDir = path.join(DATA_DIR, 'months');

    // Check if already migrated
    try {
        await fs.access(migrationFlag);
        console.log('✓ Datos ya migrados a estructura mensual');
        return;
    } catch {
        // Not migrated yet, continue
    }

    // Check if old files exist
    const oldExpensesPath = path.join(DATA_DIR, 'expenses.json');
    const oldIncomesPath = path.join(DATA_DIR, 'incomes.json');
    const oldSettlementsPath = path.join(DATA_DIR, 'settlements.json');

    let hasOldData = false;
    try {
        await fs.access(oldExpensesPath);
        hasOldData = true;
    } catch {
        // No old expenses file
    }

    if (!hasOldData) {
        // No old data to migrate, just mark as migrated
        await fs.writeFile(migrationFlag, new Date().toISOString());
        console.log('✓ No hay datos antiguos para migrar');
        return;
    }

    console.log('🔄 Iniciando migración a estructura mensual...');

    try {
        // Read old data files
        const oldExpenses = await readJSONSafe(oldExpensesPath);
        const oldIncomes = await readJSONSafe(oldIncomesPath);
        const oldSettlements = await readJSONSafe(oldSettlementsPath);

        // Group by month
        const expensesByMonth = groupByMonth(oldExpenses, 'date');
        const incomesByMonth = groupByMonth(oldIncomes, 'date');
        const settlementsByMonth = groupByMonth(oldSettlements, 'month');

        // Get all unique months
        const allMonths = new Set([
            ...Object.keys(expensesByMonth),
            ...Object.keys(incomesByMonth),
            ...Object.keys(settlementsByMonth)
        ]);

        // Create monthly structure
        for (const month of allMonths) {
            const monthDir = path.join(monthsDir, month);
            await fs.mkdir(monthDir, { recursive: true });

            if (expensesByMonth[month]) {
                await fs.writeFile(
                    path.join(monthDir, 'expenses.json'),
                    JSON.stringify(expensesByMonth[month], null, 2)
                );
            }
            if (incomesByMonth[month]) {
                await fs.writeFile(
                    path.join(monthDir, 'incomes.json'),
                    JSON.stringify(incomesByMonth[month], null, 2)
                );
            }
            if (settlementsByMonth[month]) {
                await fs.writeFile(
                    path.join(monthDir, 'settlements.json'),
                    JSON.stringify(settlementsByMonth[month], null, 2)
                );
            }
        }

        // Rename old files as backup
        await renameIfExists(oldExpensesPath, path.join(DATA_DIR, 'expenses.json.bak'));
        await renameIfExists(oldIncomesPath, path.join(DATA_DIR, 'incomes.json.bak'));
        await renameIfExists(oldSettlementsPath, path.join(DATA_DIR, 'settlements.json.bak'));

        // Mark as migrated
        await fs.writeFile(migrationFlag, new Date().toISOString());

        console.log(`✓ Migración completada: ${allMonths.size} mes(es) migrado(s)`);
        if (allMonths.size > 0) {
            console.log(`  Meses: ${[...allMonths].sort().join(', ')}`);
        }
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}

// Helper: Read JSON safely (return empty array if file doesn't exist or is empty)
async function readJSONSafe(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Helper: Group items by month based on a date field
function groupByMonth(items, dateField) {
    const grouped = {};
    for (const item of items) {
        const dateValue = item[dateField];
        if (dateValue && typeof dateValue === 'string') {
            const month = dateValue.substring(0, 7); // YYYY-MM
            if (/^\d{4}-\d{2}$/.test(month)) {
                if (!grouped[month]) grouped[month] = [];
                grouped[month].push(item);
            }
        }
    }
    return grouped;
}

// Helper: Rename file if it exists
async function renameIfExists(oldPath, newPath) {
    try {
        await fs.access(oldPath);
        await fs.rename(oldPath, newPath);
    } catch {
        // File doesn't exist, ignore
    }
}

// API Routes
app.use('/api/expenses', createExpensesRouter(fileService));
app.use('/api/incomes', createIncomesRouter(fileService));
app.use('/api/categories', createCategoriesRouter(fileService));
app.use('/api/income-categories', createIncomeCategoriesRouter(fileService));
app.use('/api/config', createConfigRouter(fileService));
app.use('/api/settlements', createSettlementsRouter(fileService));
app.use('/api/expenses-config', createExpensesConfigRouter(fileService));

// List available months
app.get('/api/months', async (req, res) => {
    try {
        const months = await fileService.listAvailableMonths();
        res.json(months);
    } catch (error) {
        console.error('Error listing months:', error);
        res.status(500).json({ error: 'Error listing months' });
    }
});

// Start server
initializeData().then(async () => {
    // Run migration if needed
    await migrateToMonthlyStructure();

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
