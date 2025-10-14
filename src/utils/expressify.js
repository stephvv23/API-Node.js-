/*
Adaptador Express-like. Envuelve tus controllers actuales (hechos para Express) y les da un req/res/next simulado:

res.status(...).json(...) funciona.

Mapea errores (ApiError, Prisma P2002/P2025, etc.) a respuestas HTTP.
*/

const { sendJson } = require('./response');
const ApiError = require('./apiError');
class ResShim {
  constructor(res) { this.res = res; this._status = 200; }
  status(code) { this._status = code; return this; }
  json(obj) { sendJson(this.res, this._status, obj); }
  send(body = '') {
    this.res.writeHead(this._status, { 'Content-Type': 'text/plain; charset=utf-8' });
    this.res.end(body);
  }
}

function mapErrorToHttp(resShim, err) {
  // ApiError propio
  if (err && typeof err.code === 'number') {   
    return resShim.status(err.code).json({
      ok: false,
      message: err.message,
      details: err.details || undefined
    });
  }
  // Common Prisma errors
  if (err && err.code === 'P2002')
    return resShim.status(409).json({ ok: false, message: 'Duplicate record (unique constraint)' });
  if (err && err.code === 'P2025')
    return resShim.status(404).json({ ok: false, message: 'Resource not found' });

  // Fallback
  console.error('[UNHANDLED ERROR]', err);
  return resShim.status(500).json({ ok: false, message: 'Internal Server Error' });
}

/**
 * Envuelve un handler estilo Express (req, res, next) para usarlo en nuestro router nativo.
 * paramNames: nombres de los params que extraemos del regex (en el mismo orden de los grupos).
 */
function wrapExpressHandler(handler, paramNames = []) {
  return async ({ req, res, params, query, body }) => {
    const resShim = new ResShim(res);
    // construimos req estilo Express
    const reqShim = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query,
      body,
      params: {},
    };
    paramNames.forEach((name, i) => { reqShim.params[name] = params[i]; });

    const next = (err) => {
      if (!err) return;
      mapErrorToHttp(resShim, err);
    };

    try {
      await handler(reqShim, resShim, next);
    } catch (err) {
      mapErrorToHttp(resShim, err);
    }
  };
}

module.exports = { wrapExpressHandler };
