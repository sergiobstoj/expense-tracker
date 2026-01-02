const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

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

// Ensure data directory and files exist
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        
        // Initialize expenses.json
        try {
            await fs.access(path.join(DATA_DIR, 'expenses.json'));
        } catch {
            await fs.writeFile(
                path.join(DATA_DIR, 'expenses.json'),
                JSON.stringify([], null, 2)
            );
        }
        
        // Initialize categories.json
        try {
            await fs.access(path.join(DATA_DIR, 'categories.json'));
        } catch {
            const defaultCategories = {
                fijo: [
                    { name: 'Arriendo', emoji: '🏠' },
                    { name: 'Gym', emoji: '💪' },
                    { name: 'Cuotas', emoji: '💳' }
                ],
                variable: [
                    { name: 'Supermercado', emoji: '🛒' },
                    { name: 'Luz', emoji: '💡' },
                    { name: 'Agua', emoji: '💧' },
                    { name: 'Gas', emoji: '🔥' }
                ],
                diario: [
                    { name: 'Café', emoji: '☕' },
                    { name: 'Transporte', emoji: '🚌' },
                    { name: 'Comida', emoji: '🍔' }
                ]
            };
            await fs.writeFile(
                path.join(DATA_DIR, 'categories.json'),
                JSON.stringify(defaultCategories, null, 2)
            );
        }
        
        // Initialize config.json
        try {
            await fs.access(path.join(DATA_DIR, 'config.json'));
        } catch {
            const defaultConfig = {
                persons: ['Sergio', 'Claudia'],
                currentMonth: new Date().toISOString().slice(0, 7),
                splitPercentages: {
                    'Sergio': 70,
                    'Claudia': 30
                },
                userPins: {},
                masterPin: '0000',
                closedMonths: []
            };
            await fs.writeFile(
                path.join(DATA_DIR, 'config.json'),
                JSON.stringify(defaultConfig, null, 2)
            );
        }
        
        // Initialize incomes.json
        try {
            await fs.access(path.join(DATA_DIR, 'incomes.json'));
        } catch {
            await fs.writeFile(
                path.join(DATA_DIR, 'incomes.json'),
                JSON.stringify([], null, 2)
            );
        }
        
        // Initialize income-categories.json
        try {
            await fs.access(path.join(DATA_DIR, 'income-categories.json'));
        } catch {
            const defaultIncomeCategories = [
                { name: 'Salario', emoji: '💼' },
                { name: 'Freelance', emoji: '💻' },
                { name: 'Extras', emoji: '✨' },
                { name: 'Bonos', emoji: '🎁' },
                { name: 'Otros', emoji: '💰' }
            ];
            await fs.writeFile(
                path.join(DATA_DIR, 'income-categories.json'),
                JSON.stringify(defaultIncomeCategories, null, 2)
            );
        }
        
        console.log('✓ Data files initialized');
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

// API Routes

// Get all expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'expenses.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading expenses' });
    }
});

// Add new expense
app.post('/api/expenses', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'expenses.json'), 'utf8');
        const expenses = JSON.parse(data);
        
        const newExpense = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        expenses.push(newExpense);
        await fs.writeFile(
            path.join(DATA_DIR, 'expenses.json'),
            JSON.stringify(expenses, null, 2)
        );
        
        res.json(newExpense);
    } catch (error) {
        console.error('❌ Error saving expense:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error saving expense',
            details: error.message 
        });
    }
});

// Update expense
app.put('/api/expenses/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'expenses.json'), 'utf8');
        let expenses = JSON.parse(data);
        
        const index = expenses.findIndex(e => e.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ 
                error: 'Expense not found',
                details: `No expense found with id: ${req.params.id}`
            });
        }
        
        expenses[index] = {
            ...expenses[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(
            path.join(DATA_DIR, 'expenses.json'),
            JSON.stringify(expenses, null, 2)
        );
        
        res.json(expenses[index]);
    } catch (error) {
        console.error('❌ Error updating expense:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error updating expense',
            details: error.message 
        });
    }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'expenses.json'), 'utf8');
        let expenses = JSON.parse(data);
        
        expenses = expenses.filter(e => e.id !== req.params.id);
        
        await fs.writeFile(
            path.join(DATA_DIR, 'expenses.json'),
            JSON.stringify(expenses, null, 2)
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting expense:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error deleting expense',
            details: error.message 
        });
    }
});

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'categories.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading categories' });
    }
});

// Update categories
app.put('/api/categories', async (req, res) => {
    try {
        await fs.writeFile(
            path.join(DATA_DIR, 'categories.json'),
            JSON.stringify(req.body, null, 2)
        );
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Error updating categories' });
    }
});

// Get config
app.get('/api/config', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'config.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading config' });
    }
});

// Update config
app.put('/api/config', async (req, res) => {
    try {
        await fs.writeFile(
            path.join(DATA_DIR, 'config.json'),
            JSON.stringify(req.body, null, 2)
        );
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Error updating config' });
    }
});

// Get all incomes
app.get('/api/incomes', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'incomes.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading incomes' });
    }
});

// Add new income
app.post('/api/incomes', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'incomes.json'), 'utf8');
        const incomes = JSON.parse(data);
        
        const newIncome = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        incomes.push(newIncome);
        await fs.writeFile(
            path.join(DATA_DIR, 'incomes.json'),
            JSON.stringify(incomes, null, 2)
        );
        
        res.json(newIncome);
    } catch (error) {
        console.error('❌ Error saving income:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error saving income',
            details: error.message 
        });
    }
});

// Update income
app.put('/api/incomes/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'incomes.json'), 'utf8');
        let incomes = JSON.parse(data);
        
        const index = incomes.findIndex(i => i.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ 
                error: 'Income not found',
                details: `No income found with id: ${req.params.id}`
            });
        }
        
        incomes[index] = {
            ...incomes[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        await fs.writeFile(
            path.join(DATA_DIR, 'incomes.json'),
            JSON.stringify(incomes, null, 2)
        );
        
        res.json(incomes[index]);
    } catch (error) {
        console.error('❌ Error updating income:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error updating income',
            details: error.message 
        });
    }
});

// Delete income
app.delete('/api/incomes/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'incomes.json'), 'utf8');
        let incomes = JSON.parse(data);
        
        incomes = incomes.filter(i => i.id !== req.params.id);
        
        await fs.writeFile(
            path.join(DATA_DIR, 'incomes.json'),
            JSON.stringify(incomes, null, 2)
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting income:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error deleting income',
            details: error.message 
        });
    }
});

// Get income categories
app.get('/api/income-categories', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, 'income-categories.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Error reading income categories' });
    }
});

// Update income categories
app.put('/api/income-categories', async (req, res) => {
    try {
        await fs.writeFile(
            path.join(DATA_DIR, 'income-categories.json'),
            JSON.stringify(req.body, null, 2)
        );
        res.json(req.body);
    } catch (error) {
        res.status(500).json({ error: 'Error updating income categories' });
    }
});

// Backup functions
async function createBackup() {
    try {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);
        
        // Check if backup already exists for today
        try {
            await fs.access(backupFile);
            console.log(`✓ Backup already exists for today: ${timestamp}`);
            return;
        } catch {
            // File doesn't exist, create backup
        }
        
        // Read all data
        const expenses = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'expenses.json'), 'utf8'));
        const incomes = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'incomes.json'), 'utf8'));
        const categories = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'categories.json'), 'utf8'));
        const incomeCategories = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'income-categories.json'), 'utf8'));
        const config = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'config.json'), 'utf8'));
        
        // Create backup object
        const backup = {
            timestamp: new Date().toISOString(),
            date: timestamp,
            data: {
                expenses,
                incomes,
                categories,
                incomeCategories,
                config
            }
        };
        
        // Write backup
        await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
        console.log(`✓ Backup created: ${timestamp}`);
        
        // Clean old backups (keep last 30 days)
        await cleanOldBackups();
    } catch (error) {
        console.error('❌ Error creating backup:', error);
    }
}

async function cleanOldBackups() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
        
        // Sort by date (newest first)
        backupFiles.sort().reverse();
        
        // Keep only last 30 backups
        const toDelete = backupFiles.slice(30);
        
        for (const file of toDelete) {
            await fs.unlink(path.join(BACKUP_DIR, file));
            console.log(`✓ Deleted old backup: ${file}`);
        }
    } catch (error) {
        console.error('❌ Error cleaning old backups:', error);
    }
}

// Schedule daily backup (runs at midnight)
function scheduleDailyBackup() {
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // Next day
        0, 0, 0 // Midnight
    );
    const msToMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
        createBackup();
        // Schedule next backup in 24 hours
        setInterval(createBackup, 24 * 60 * 60 * 1000);
    }, msToMidnight);
    
    console.log(`✓ Daily backup scheduled for midnight`);
}

// Start server
initializeData().then(async () => {
    // Create initial backup
    await createBackup();
    
    // Schedule daily backups
    scheduleDailyBackup();
    
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
