const express = require('express');

function createCategoriesRouter(fileService) {
    const router = express.Router();

    // Get expense categories
    router.get('/', async (req, res) => {
        try {
            const categories = await fileService.readJSON('categories.json');
            res.json(categories);
        } catch (error) {
            console.error('❌ Error reading categories:', error);
            res.status(500).json({ error: 'Error reading categories' });
        }
    });

    // Update expense categories
    router.put('/', async (req, res) => {
        try {
            await fileService.writeJSON('categories.json', req.body);
            res.json(req.body);
        } catch (error) {
            console.error('❌ Error updating categories:', error);
            res.status(500).json({ error: 'Error updating categories' });
        }
    });

    return router;
}

function createIncomeCategoriesRouter(fileService) {
    const router = express.Router();

    // Get income categories
    router.get('/', async (req, res) => {
        try {
            const categories = await fileService.readJSON('income-categories.json');
            res.json(categories);
        } catch (error) {
            console.error('❌ Error reading income categories:', error);
            res.status(500).json({ error: 'Error reading income categories' });
        }
    });

    // Update income categories
    router.put('/', async (req, res) => {
        try {
            await fileService.writeJSON('income-categories.json', req.body);
            res.json(req.body);
        } catch (error) {
            console.error('❌ Error updating income categories:', error);
            res.status(500).json({ error: 'Error updating income categories' });
        }
    });

    return router;
}

module.exports = { createCategoriesRouter, createIncomeCategoriesRouter };
