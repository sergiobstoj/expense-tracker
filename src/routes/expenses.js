const express = require('express');
const crypto = require('crypto');
const { validateExpense } = require('../utils/validators');

function createExpensesRouter(fileService) {
    const router = express.Router();

    // Get all expenses
    router.get('/', async (req, res) => {
        try {
            const expenses = await fileService.readJSON('expenses.json');
            res.json(expenses);
        } catch (error) {
            console.error('❌ Error reading expenses:', error);
            res.status(500).json({ error: 'Error reading expenses' });
        }
    });

    // Add new expense
    router.post('/', async (req, res) => {
        try {
            // Validate input
            const validation = validateExpense(req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            const newExpense = {
                id: crypto.randomUUID(),
                ...req.body,
                createdAt: new Date().toISOString()
            };

            const expenses = await fileService.updateJSON('expenses.json', (data) => {
                data.push(newExpense);
                return data;
            });

            res.json(newExpense);
        } catch (error) {
            console.error('❌ Error saving expense:', error.message);
            res.status(500).json({
                error: 'Error saving expense',
                details: error.message
            });
        }
    });

    // Update expense
    router.put('/:id', async (req, res) => {
        try {
            // Validate input
            const validation = validateExpense(req.body);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            let found = false;
            await fileService.updateJSON('expenses.json', (expenses) => {
                const index = expenses.findIndex(e => e.id === req.params.id);
                if (index === -1) {
                    return expenses;
                }

                found = true;
                expenses[index] = {
                    ...expenses[index],
                    ...req.body,
                    updatedAt: new Date().toISOString()
                };
                return expenses;
            });

            if (!found) {
                return res.status(404).json({
                    error: 'Expense not found',
                    details: `No expense found with id: ${req.params.id}`
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('❌ Error updating expense:', error.message);
            res.status(500).json({
                error: 'Error updating expense',
                details: error.message
            });
        }
    });

    // Delete expense
    router.delete('/:id', async (req, res) => {
        try {
            await fileService.updateJSON('expenses.json', (expenses) => {
                return expenses.filter(e => e.id !== req.params.id);
            });

            res.json({ success: true });
        } catch (error) {
            console.error('❌ Error deleting expense:', error.message);
            res.status(500).json({
                error: 'Error deleting expense',
                details: error.message
            });
        }
    });

    return router;
}

module.exports = createExpensesRouter;
