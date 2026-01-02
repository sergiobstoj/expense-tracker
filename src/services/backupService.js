const fs = require('fs').promises;
const path = require('path');

class BackupService {
    constructor(dataDir, backupDir) {
        this.dataDir = dataDir;
        this.backupDir = backupDir;
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

            // Read all data
            const [expenses, incomes, categories, incomeCategories, config] = await Promise.all([
                this._readJSONSafe('expenses.json', []),
                this._readJSONSafe('incomes.json', []),
                this._readJSONSafe('categories.json', {}),
                this._readJSONSafe('income-categories.json', []),
                this._readJSONSafe('config.json', {})
            ]);

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
            await this.cleanOldBackups();
        } catch (error) {
            console.error('❌ Error creating backup:', error);
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
