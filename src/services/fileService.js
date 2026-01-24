const fs = require('fs').promises;
const path = require('path');

class FileService {
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.monthsDir = path.join(dataDir, 'months');
    }

    /**
     * Read JSON file
     */
    async readJSON(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, return default based on filename
                return this._getDefaultData(filename);
            }
            throw error;
        }
    }

    /**
     * Write JSON file
     */
    async writeJSON(filename, data) {
        const filePath = path.join(this.dataDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    /**
     * Update JSON file (read-modify-write)
     */
    async updateJSON(filename, updateFn) {
        const data = await this.readJSON(filename);
        const updated = await updateFn(data);
        await this.writeJSON(filename, updated);
        return updated;
    }

    // ============================================
    // MONTHLY DATA METHODS
    // ============================================

    /**
     * Ensure month directory exists
     */
    async ensureMonthDir(month) {
        const monthDir = path.join(this.monthsDir, month);
        await fs.mkdir(monthDir, { recursive: true });
        return monthDir;
    }

    /**
     * Read data for a specific month and type (expenses, incomes, settlements)
     */
    async readMonthData(month, type) {
        const filePath = path.join(this.monthsDir, month, `${type}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    /**
     * Write data for a specific month and type
     */
    async writeMonthData(month, type, data) {
        await this.ensureMonthDir(month);
        const filePath = path.join(this.monthsDir, month, `${type}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    /**
     * Update month data (read-modify-write)
     */
    async updateMonthData(month, type, updateFn) {
        const data = await this.readMonthData(month, type);
        const updated = await updateFn(data);
        await this.writeMonthData(month, type, updated);
        return updated;
    }

    /**
     * List all available months
     */
    async listAvailableMonths() {
        try {
            await fs.mkdir(this.monthsDir, { recursive: true });
            const entries = await fs.readdir(this.monthsDir, { withFileTypes: true });
            return entries
                .filter(e => e.isDirectory() && /^\d{4}-\d{2}$/.test(e.name))
                .map(e => e.name)
                .sort()
                .reverse();
        } catch (error) {
            return [];
        }
    }

    /**
     * Read all data of a type from all months (for backwards compatibility)
     */
    async readAllMonthlyData(type) {
        const months = await this.listAvailableMonths();
        const allData = [];
        for (const month of months) {
            const monthData = await this.readMonthData(month, type);
            allData.push(...monthData);
        }
        return allData;
    }

    /**
     * Check if months directory has data (migration completed)
     */
    async hasMonthlyData() {
        const months = await this.listAvailableMonths();
        return months.length > 0;
    }

    /**
     * Get default data structure for a file
     */
    _getDefaultData(filename) {
        const defaults = {
            'expenses.json': [],
            'incomes.json': [],
            'categories.json': {
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
            },
            'income-categories.json': [
                { name: 'Salario', emoji: '💼' },
                { name: 'Freelance', emoji: '💻' },
                { name: 'Extras', emoji: '✨' },
                { name: 'Bonos', emoji: '🎁' },
                { name: 'Otros', emoji: '💰' }
            ],
            'config.json': {
                persons: ['User1', 'User2'],
                currentMonth: new Date().toISOString().slice(0, 7),
                splitPercentages: {
                    'User1': 50,
                    'User2': 50
                },
                userPins: {},
                masterPin: '0000',
                closedMonths: []
            },
            'fixed-expenses-config.json': {},
            'variable-expenses-config.json': {},
            'daily-expenses-config.json': {
                globalBudget: 0,
                categories: {}
            }
        };

        return defaults[filename] || null;
    }
}

module.exports = FileService;
