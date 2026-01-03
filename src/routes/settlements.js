const express = require('express');

function createSettlementsRouter(fileService) {
    const router = express.Router();

    // Get all settlements
    router.get('/', async (req, res) => {
        try {
            const settlements = await fileService.readJSON('settlements.json');
            res.json(settlements);
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

            await fileService.updateJSON('settlements.json', (data) => {
                data.push(newSettlement);
                return data;
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

    // Delete settlement
    router.delete('/:id', async (req, res) => {
        try {
            const settlementId = parseInt(req.params.id, 10);

            await fileService.updateJSON('settlements.json', (settlements) => {
                return settlements.filter(s => s.id !== settlementId);
            });

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
