const express = require('express');
const { validateIncome } = require('../utils/validators');

function createIncomesRouter(fileService) {
    const router = express.Router();

    // Get incomes (optional: ?month=YYYY-MM)
    router.get('/', async (req, res) => {
        try {
            const { month } = req.query;

            if (month) {
                // Return only the specified month
                const incomes = await fileService.readMonthData(month, 'incomes');
                res.json(incomes);
            } else {
                // Return all months (backwards compatibility)
                const incomes = await fileService.readAllMonthlyData('incomes');
                res.json(incomes);
            }
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

            // Extract month from date
            const month = req.body.date.substring(0, 7);

            const newIncome = {
                id: Date.now(),
                ...req.body,
                createdAt: new Date().toISOString()
            };

            await fileService.updateMonthData(month, 'incomes', (incomes) => {
                incomes.push(newIncome);
                return incomes;
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

            // Extract month from date
            const month = req.body.date.substring(0, 7);

            // Convert ID for comparison (support both string and number IDs)
            const incomeId = req.params.id;
            const incomeIdNum = parseInt(incomeId, 10);

            let found = false;
            await fileService.updateMonthData(month, 'incomes', (incomes) => {
                const index = incomes.findIndex(i =>
                    i.id === incomeId || i.id === incomeIdNum
                );
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

    // Delete income (requires ?month=YYYY-MM)
    router.delete('/:id', async (req, res) => {
        try {
            const { month } = req.query;

            if (!month) {
                return res.status(400).json({
                    error: 'Month parameter required',
                    details: 'Please provide ?month=YYYY-MM'
                });
            }

            // Convert ID for comparison (support both string and number IDs)
            const incomeId = req.params.id;
            const incomeIdNum = parseInt(incomeId, 10);

            let found = false;
            await fileService.updateMonthData(month, 'incomes', (incomes) => {
                const originalLength = incomes.length;
                const filtered = incomes.filter(i =>
                    i.id !== incomeId && i.id !== incomeIdNum
                );
                found = filtered.length < originalLength;
                return filtered;
            });

            if (!found) {
                return res.status(404).json({
                    error: 'Income not found',
                    details: `No income found with id: ${req.params.id} in month ${month}`
                });
            }

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
