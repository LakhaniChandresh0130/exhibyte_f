const express = require('express');
const response = require('../Middleware/response');

const router = express.Router();

router.get('/', (req, res) => {
  return response(res, 200, true, 'OK', { status: 'healthy' });
});

// allow GET /health directly even if router is mounted incorrectly during scaffold
router.get('/health', (req, res) => {
  return response(res, 200, true, 'OK', { status: 'healthy' });
});


module.exports = router;

