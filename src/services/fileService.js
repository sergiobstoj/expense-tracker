const fs = require('fs').promises;
const path = require('path');

class FileService {
    constructor(dataDir) {
        this.dataDir = dataDir;
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
            }
        };

        return defaults[filename] || null;
    }
}

module.exports = FileService;
