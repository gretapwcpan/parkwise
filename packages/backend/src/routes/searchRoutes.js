const express = require('express');
const router = express.Router();
const nlSearchService = require('../services/nlSearchService');

/**
 * Natural language search endpoint
 * POST /api/search/nl
 */
router.post('/nl', async (req, res) => {
    try {
        const { query, location } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Query is required'
            });
        }

        // Process the natural language query
        const result = await nlSearchService.processQuery(query, location);

        // Return the results
        res.json(result);

    } catch (error) {
        console.error('Search endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to process your search request'
        });
    }
});

/**
 * Test endpoint to check if LLM service is available
 * GET /api/search/status
 */
router.get('/status', async (req, res) => {
    try {
        const testQuery = "test query";
        const llmResponse = await nlSearchService.callLLMService(testQuery);
        
        res.json({
            llmAvailable: llmResponse.success,
            llmServiceUrl: process.env.LLM_SERVICE_URL || 'http://localhost:8001',
            status: llmResponse.success ? 'connected' : 'disconnected',
            error: llmResponse.error
        });
    } catch (error) {
        res.json({
            llmAvailable: false,
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
