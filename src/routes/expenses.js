const express = require('express');
const { validateExpense } = require('../utils/validators');

function createExpensesRouter(fileService) {
    const router = express.Router();

    // Get available months
    router.get('/months', async (req, res) => {
        try {
            const months = await fileService.listAvailableMonths();
            res.json(months);
        } catch (error) {
            console.error('❌ Error listing months:', error);
            res.status(500).json({ error: 'Error listing months' });
        }
    });

    // Get expenses (optional: ?month=YYYY-MM)
    router.get('/', async (req, res) => {
        try {
            const { month } = req.query;

            if (month) {
                // Return only the specified month
                const expenses = await fileService.readMonthData(month, 'expenses');
                res.json(expenses);
            } else {
                // Return all months (backwards compatibility)
                const expenses = await fileService.readAllMonthlyData('expenses');
                res.json(expenses);
            }
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

            // Extract month from date
            const month = req.body.date.substring(0, 7);

            const newExpense = {
                id: Date.now(),
                ...req.body,
                createdAt: new Date().toISOString()
            };

            await fileService.updateMonthData(month, 'expenses', (expenses) => {
                expenses.push(newExpense);
                return expenses;
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

            // Extract month from date
            const month = req.body.date.substring(0, 7);

            // Convert ID for comparison (support both string and number IDs)
            const expenseId = req.params.id;
            const expenseIdNum = parseInt(expenseId, 10);

            let found = false;
            await fileService.updateMonthData(month, 'expenses', (expenses) => {
                const index = expenses.findIndex(e =>
                    e.id === expenseId || e.id === expenseIdNum
                );
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

    // Delete expense (requires ?month=YYYY-MM)
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
            const expenseId = req.params.id;
            const expenseIdNum = parseInt(expenseId, 10);

            let found = false;
            await fileService.updateMonthData(month, 'expenses', (expenses) => {
                const originalLength = expenses.length;
                const filtered = expenses.filter(e =>
                    e.id !== expenseId && e.id !== expenseIdNum
                );
                found = filtered.length < originalLength;
                return filtered;
            });

            if (!found) {
                return res.status(404).json({
                    error: 'Expense not found',
                    details: `No expense found with id: ${req.params.id} in month ${month}`
                });
            }

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
