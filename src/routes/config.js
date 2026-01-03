const express = require('express');
const { validateConfig } = require('../utils/validators');

function createConfigRouter(fileService) {
    const router = express.Router();

    // Get config with automatic migration and sync of monthlyPercentages
    router.get('/', async (req, res) => {
        try {
            let config = await fileService.readJSON('config.json');
            let configChanged = false;

            // Migration: Add monthlyPercentages if it doesn't exist
            if (!config.monthlyPercentages) {
                console.log('📦 Migrando config: creando monthlyPercentages...');
                config.monthlyPercentages = {};
                configChanged = true;
            }

            // Always sync monthlyPercentages with existing months in expenses/incomes
            const expenses = await fileService.readJSON('expenses.json');
            const incomes = await fileService.readJSON('incomes.json');

            // Get all unique months from expenses and incomes
            const existingMonths = new Set();
            expenses.forEach(e => existingMonths.add(e.date.substring(0, 7)));
            incomes.forEach(i => existingMonths.add(i.date.substring(0, 7)));

            // Add missing months to monthlyPercentages
            existingMonths.forEach(month => {
                if (!config.monthlyPercentages[month]) {
                    console.log(`📅 Agregando nuevo mes: ${month}`);
                    config.monthlyPercentages[month] = { ...config.splitPercentages };
                    configChanged = true;
                }
            });

            // Save config if it was changed
            if (configChanged) {
                await fileService.writeJSON('config.json', config);
                console.log(`✅ Configuración sincronizada: ${existingMonths.size} meses totales`);
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
