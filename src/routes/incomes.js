const express = require('express');
const { validateIncome } = require('../utils/validators');

function createIncomesRouter(fileService) {
    const router = express.Router();

    // Get all incomes
    router.get('/', async (req, res) => {
        try {
            const incomes = await fileService.readJSON('incomes.json');
            res.json(incomes);
        } catch (error) {
            console.error('❌ Error reading incomes:', error);
            res.status(500).json({ error: 'Error reading incomes' });
        }
    });

    // Add new income
    router.post('/', async (req, res) => {
        try {
            // Validate input
            const validation = validateIncome(req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const newIncome = {
                id: Date.now(),
                ...req.body,
                createdAt: new Date().toISOString()
            };

            await fileService.updateJSON('incomes.json', (data) => {
                data.push(newIncome);
                return data;
            });

            res.json(newIncome);
        } catch (error) {
            console.error('❌ Error saving income:', error.message);
            res.status(500).json({
                error: 'Error saving income',
                details: error.message
            });
        }
    });

    // Update income
    router.put('/:id', async (req, res) => {
        try {
            // Validate input
            const validation = validateIncome(req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            let found = false;
            await fileService.updateJSON('incomes.json', (incomes) => {
                const index = incomes.findIndex(i => i.id === req.params.id);
                if (index === -1) {
                    return incomes;
                }

                found = true;
                incomes[index] = {
                    ...incomes[index],
                    ...req.body,
                    updatedAt: new Date().toISOString()
                };
                return incomes;
            });

            if (!found) {
                return res.status(404).json({
                    error: 'Income not found',
                    details: `No income found with id: ${req.params.id}`
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('❌ Error updating income:', error.message);
            res.status(500).json({
                error: 'Error updating income',
                details: error.message
            });
        }
    });

    // Delete income
    router.delete('/:id', async (req, res) => {
        try {
            await fileService.updateJSON('incomes.json', (incomes) => {
                return incomes.filter(i => i.id !== req.params.id);
            });

            res.json({ success: true });
        } catch (error) {
            console.error('❌ Error deleting income:', error.message);
            res.status(500).json({
                error: 'Error deleting income',
                details: error.message
            });
        }
    });

    return router;
}

module.exports = createIncomesRouter;
