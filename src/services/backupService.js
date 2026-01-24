const fs = require('fs').promises;
const path = require('path');

class BackupService {
    constructor(dataDir, backupDir) {
        this.dataDir = dataDir;
        this.backupDir = backupDir;
        this.monthsDir = path.join(dataDir, 'months');
    }

    /**
     * Create a backup of all data
     */
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);

            // Check if backup already exists for today
            try {
                await fs.access(backupFile);
                console.log(`✓ Backup already exists for today: ${timestamp}`);
                return;
            } catch {
                // File doesn't exist, create backup
            }

            // Read global config files
            const [categories, incomeCategories, config, fixedExpensesConfig, variableExpensesConfig, dailyExpensesConfig] = await Promise.all([
                this._readJSONSafe('categories.json', {}),
                this._readJSONSafe('income-categories.json', []),
                this._readJSONSafe('config.json', {}),
                this._readJSONSafe('fixed-expenses-config.json', {}),
                this._readJSONSafe('variable-expenses-config.json', {}),
                this._readJSONSafe('daily-expenses-config.json', {})
            ]);

            // Read monthly data
            const monthsData = await this._readAllMonthsData();

            // Create backup object
            const backup = {
                timestamp: new Date().toISOString(),
                date: timestamp,
                version: 2, // New structure version
                globalData: {
                    categories,
                    incomeCategories,
                    config,
                    fixedExpensesConfig,
                    variableExpensesConfig,
                    dailyExpensesConfig
                },
                monthsData
            };

            // Write backup
            await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
            console.log(`✓ Backup created: ${timestamp} (${Object.keys(monthsData).length} months)`);

            // Clean old backups (keep last 30 days)
            await this.cleanOldBackups();
        } catch (error) {
            console.error('❌ Error creating backup:', error);
        }
    }

    /**
     * Read all months data
     */
    async _readAllMonthsData() {
        const monthsData = {};

        try {
            await fs.mkdir(this.monthsDir, { recursive: true });
            const entries = await fs.readdir(this.monthsDir, { withFileTypes: true });
            const months = entries
                .filter(e => e.isDirectory() && /^\d{4}-\d{2}$/.test(e.name))
                .map(e => e.name);

            for (const month of months) {
                const monthDir = path.join(this.monthsDir, month);
                monthsData[month] = {
                    expenses: await this._readMonthFileSafe(monthDir, 'expenses.json'),
                    incomes: await this._readMonthFileSafe(monthDir, 'incomes.json'),
                    settlements: await this._readMonthFileSafe(monthDir, 'settlements.json')
                };
            }
        } catch (error) {
            console.error('❌ Error reading months data:', error);
        }

        return monthsData;
    }

    /**
     * Read a monthly file safely
     */
    async _readMonthFileSafe(monthDir, filename) {
        try {
            const data = await fs.readFile(path.join(monthDir, filename), 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    /**
     * Clean old backups (keep last 30 days)
     */
    async cleanOldBackups() {
        try {
            const files = await fs.readdir(this.backupDir);
            const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));

            // Sort by date (newest first)
            backupFiles.sort().reverse();

            // Keep only last 30 backups
            const toDelete = backupFiles.slice(30);

            for (const file of toDelete) {
                await fs.unlink(path.join(this.backupDir, file));
                console.log(`✓ Deleted old backup: ${file}`);
            }
        } catch (error) {
            console.error('❌ Error cleaning old backups:', error);
        }
    }

    /**
     * Schedule daily backup (runs at midnight)
     */
    scheduleDailyBackup() {
        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // Next day
            0, 0, 0 // Midnight
        );
        const msToMidnight = night.getTime() - now.getTime();

        setTimeout(() => {
            this.createBackup();
            // Schedule next backup in 24 hours
            setInterval(() => this.createBackup(), 24 * 60 * 60 * 1000);
        }, msToMidnight);

        console.log(`✓ Daily backup scheduled for midnight`);
    }

    /**
     * Read JSON file safely
     */
    async _readJSONSafe(filename, defaultValue) {
        try {
            const data = await fs.readFile(path.join(this.dataDir, filename), 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return defaultValue;
        }
    }
}

module.exports = BackupService;
