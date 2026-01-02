const express = require('express');
const { validateConfig } = require('../utils/validators');

function createConfigRouter(fileService) {
    const router = express.Router();

    // Get config
    router.get('/', async (req, res) => {
        try {
            const config = await fileService.readJSON('config.json');
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
