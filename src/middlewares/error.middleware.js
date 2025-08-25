// src/middlewares/error.middleware.js
/**
 * Middleware de errores: SIEMPRE debe tener 4 parámetros (err, req, res, next)
 */
function errorHandler(err, _req, res, _next) {
  const status = err && typeof err.status === 'number' ? err.status : 500;
  const message = (err && err.message) || 'Internal Server Error';

  // Puedes loguear el error aquí si quieres
  // console.error(err);

  res.status(status).json({
    ok: false,
    message,
  });
}

module.exports = errorHandler;
