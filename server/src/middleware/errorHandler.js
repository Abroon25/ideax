const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ error: 'A record with this ' + field + ' already exists' });
  }
  if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large' });

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
