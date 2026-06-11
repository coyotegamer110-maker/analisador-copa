const errorHandler = (err, req, res, next) => {
  console.error('❌ Erro:', err);
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
module.exports = errorHandler;
