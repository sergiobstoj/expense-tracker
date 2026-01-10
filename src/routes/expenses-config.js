const express = require('express');

function createExpensesConfigRouter(fileService) {
  const router = express.Router();

  // Get fixed expenses configuration
  router.get('/fixed', async (req, res) => {
    try {
      const config = await fileService.readJSON('fixed-expenses-config.json');
      res.json(config);
    } catch (error) {
      console.error('Error reading fixed expenses config:', error);
      res.status(500).json({ error: 'Failed to read fixed expenses configuration' });
    }
  });

  // Update fixed expenses configuration
  router.put('/fixed', async (req, res) => {
    try {
      await fileService.writeJSON('fixed-expenses-config.json', req.body);
      res.json({ success: true, message: 'Fixed expenses configuration updated successfully' });
    } catch (error) {
      console.error('Error updating fixed expenses config:', error);
      res.status(500).json({ error: 'Failed to update fixed expenses configuration' });
    }
  });

  // Get variable expenses configuration
  router.get('/variable', async (req, res) => {
    try {
      const config = await fileService.readJSON('variable-expenses-config.json');
      res.json(config);
    } catch (error) {
      console.error('Error reading variable expenses config:', error);
      res.status(500).json({ error: 'Failed to read variable expenses configuration' });
    }
  });

  // Update variable expenses configuration
  router.put('/variable', async (req, res) => {
    try {
      await fileService.writeJSON('variable-expenses-config.json', req.body);
      res.json({ success: true, message: 'Variable expenses configuration updated successfully' });
    } catch (error) {
      console.error('Error updating variable expenses config:', error);
      res.status(500).json({ error: 'Failed to update variable expenses configuration' });
    }
  });

  // Get daily expenses configuration
  router.get('/daily', async (req, res) => {
    try {
      const config = await fileService.readJSON('daily-expenses-config.json');
      res.json(config);
    } catch (error) {
      console.error('Error reading daily expenses config:', error);
      res.status(500).json({ error: 'Failed to read daily expenses configuration' });
    }
  });

  // Update daily expenses configuration
  router.put('/daily', async (req, res) => {
    try {
      await fileService.writeJSON('daily-expenses-config.json', req.body);
      res.json({ success: true, message: 'Daily expenses configuration updated successfully' });
    } catch (error) {
      console.error('Error updating daily expenses config:', error);
      res.status(500).json({ error: 'Failed to update daily expenses configuration' });
    }
  });

  return router;
}

module.exports = createExpensesConfigRouter;
