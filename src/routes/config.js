const express = require('express');
const { validateConfig } = require('../utils/validators');

function createConfigRouter(fileService) {
    const router = express.Router();

    // Get config with automatic migration to monthlyPercentages
    router.get('/', async (req, res) => {
        try {
            let config = await fileService.readJSON('config.json');

            // Migration: Add monthlyPercentages if it doesn't exist
            if (!config.monthlyPercentages) {
                console.log('📦 Migrando config: creando monthlyPercentages...');

                // Read all expenses and incomes to get unique months
                const expenses = await fileService.readJSON('expenses.json');
                const incomes = await fileService.readJSON('incomes.json');

                // Get all unique months
                const months = new Set();
                expenses.forEach(e => months.add(e.date.substring(0, 7)));
                incomes.forEach(i => months.add(i.date.substring(0, 7)));

                // Create monthlyPercentages with current splitPercentages for all existing months
                config.monthlyPercentages = {};
                months.forEach(month => {
                    config.monthlyPercentages[month] = { ...config.splitPercentages };
                });

                // Save migrated config
                await fileService.writeJSON('config.json', config);
                console.log(`✅ Migración completada: ${months.size} meses configurados`);
            }

            res.json(config);
        } catch (error) {
            console.error('❌ Error reading config:', error);
            res.status(500).json({ error: 'Error reading config' });
        }
    });

    // Update config
    router.put('/', async (req, res) => {
        try {
            // Validate config
            const validation = validateConfig(req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            await fileService.writeJSON('config.json', req.body);
            res.json(req.body);
        } catch (error) {
            console.error('❌ Error updating config:', error);
            res.status(500).json({ error: 'Error updating config' });
        }
    });

    return router;
}

module.exports = createConfigRouter;
