const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../../../data/items.json');

// Utility to read data (intentionally sync to highlight blocking issue)
function readData() {
  const raw = fs.readFileSync(DATA_PATH);
  return JSON.parse(raw);
}

// GET /api/items
router.get('/', (req, res, next) => {
  try {
    const data = readData();
    const { limit, q, page } = req.query;
    let results = data;

    if (q) {
      // Simple substring search
      const ql = q.toLowerCase();
      results = results.filter(item => (item.name || '').toLowerCase().includes(ql));
    }

    const total = results.length;

    // Pagination
    const perPage = limit ? Math.max(1, parseInt(limit, 10)) : 20;
    const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
    const start = (pageNum - 1) * perPage;
    const paged = results.slice(start, start + perPage);

    res.json({ items: paged, total, page: pageNum, limit: perPage });
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get('/:id', (req, res, next) => {
  try {
    const data = readData();
    const item = data.find(i => i.id === parseInt(req.params.id));
    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      throw err;
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post('/', (req, res, next) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = readData();
    item.id = Date.now();
    data.push(item);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;