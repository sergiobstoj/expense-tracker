const express = require('express');

function createSettlementsRouter(fileService) {
    const router = express.Router();

    // Get settlements (optional: ?month=YYYY-MM)
    router.get('/', async (req, res) => {
        try {
            const { month } = req.query;

            if (month) {
                // Return only the specified month
                const settlements = await fileService.readMonthData(month, 'settlements');
                res.json(settlements);
            } else {
                // Return all months (backwards compatibility)
                const settlements = await fileService.readAllMonthlyData('settlements');
                res.json(settlements);
            }
        } catch (error) {
            console.error('❌ Error reading settlements:', error);
            res.status(500).json({ error: 'Error reading settlements' });
        }
    });

    // Add new settlement
    router.post('/', async (req, res) => {
        try {
            const { month, from, to, amount, date, description } = req.body;

            // Validate required fields
            if (!month || !from || !to || !amount || !date) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: ['Faltan campos requeridos: month, from, to, amount, date']
                });
            }

            // Validate amount is positive
            if (parseFloat(amount) <= 0) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: ['El monto debe ser mayor que 0']
                });
            }

            // Validate from and to are different
            if (from === to) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: ['Las personas deben ser diferentes']
                });
            }

            const newSettlement = {
                id: Date.now(),
                month,
                from,
                to,
                amount: parseFloat(amount),
                date,
                description: description || '',
                createdAt: new Date().toISOString()
            };

            await fileService.updateMonthData(month, 'settlements', (settlements) => {
                settlements.push(newSettlement);
                return settlements;
            });

            console.log(`💰 Liquidación registrada: ${from} → ${to}: €${amount}`);
            res.json(newSettlement);
        } catch (error) {
            console.error('❌ Error saving settlement:', error.message);
            res.status(500).json({
                error: 'Error saving settlement',
                details: error.message
            });
        }
    });

    // Delete settlement (requires ?month=YYYY-MM)
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
            const settlementId = req.params.id;
            const settlementIdNum = parseInt(settlementId, 10);

            let found = false;
            await fileService.updateMonthData(month, 'settlements', (settlements) => {
                const originalLength = settlements.length;
                const filtered = settlements.filter(s =>
                    s.id !== settlementId && s.id !== settlementIdNum
                );
                found = filtered.length < originalLength;
                return filtered;
            });

            if (!found) {
                return res.status(404).json({
                    error: 'Settlement not found',
                    details: `No settlement found with id: ${req.params.id} in month ${month}`
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('❌ Error deleting settlement:', error.message);
            res.status(500).json({
                error: 'Error deleting settlement',
                details: error.message
            });
        }
    });

    return router;
}

module.exports = createSettlementsRouter;
