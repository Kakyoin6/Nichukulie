// 404 — no route matched
const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

// Centralized error handler — catches anything passed to next(err)
// or thrown in an async route wrapped with asyncHandler.
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};

module.exports = { notFound, errorHandler };
