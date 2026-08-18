const AppError = require('../utils/appError');

function globalErrorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  const operationalErr = err instanceof AppError ? err : new AppError(err.message || 'Server Error', statusCode);

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    return res.status(operationalErr.statusCode).json({
      success: false,
      status: operationalErr.status,
      message: operationalErr.message,
      stack: err.stack,
    });
  }

  return res.status(operationalErr.statusCode).json({
    success: false,
    status: operationalErr.status,
    message: operationalErr.message,
  });
}

module.exports = globalErrorHandler;

