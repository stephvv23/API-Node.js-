/*
Express-like adapter. Wraps your current controllers (made for Express) and gives them a simulated req/res/next:

res.status(...).json(...) works.

Maps errors (ApiError, Prisma P2002/P2025, etc.) to HTTP responses.
*/

const { sendJson } = require('./response');
const { success, error, validationErrors, notFound, unauthorized, ApiResponse } = require('./apiResponse');
class ResShim {
  constructor(res) { 
    this.res = res; 
    this._status = 200; 
  }
  
  status(code) { 
    this._status = code; 
    return this; 
  }
  
  json(obj) { 
    sendJson(this.res, this._status, obj); 
  }
  
  send(body = '') {
    this.res.writeHead(this._status, { 'Content-Type': 'text/plain; charset=utf-8' });
    this.res.end(body);
  }

  // Standard response methods using centralized utilities
  success(data, message) {
    const response = success(data, message);
    return this.json(response);
  }

  error(message, statusCode = 500) {
    const response = error(message, statusCode);
    this._status = response.statusCode;
    return this.json(response);
  }

  validationErrors(errors, message) {
    const response = validationErrors(errors, message);
    this._status = 400;
    return this.json(response);
  }

  notFound(resource) {
    const response = notFound(resource);
    this._status = response.statusCode;
    return this.json(response);
  }

  unauthorized(message) {
    const response = unauthorized(message);
    this._status = response.statusCode;
    return this.json(response);
  }
}

function mapErrorToHttp(resShim, err) {
  // ApiResponse/ApiError with custom status code
  if (err && (err instanceof ApiResponse || typeof err.code === 'number')) {   
    return resShim.error(err.message, err.code || err.statusCode);
  }
  
  // Common Prisma errors
  if (err && err.code === 'P2002') {
    return resShim.error('Registro duplicado (restricción única)', 409);
  }
  if (err && err.code === 'P2025') {
    return resShim.notFound('Recurso');
  }

  // Fallback
  console.error('[UNHANDLED ERROR]', err);
  return resShim.error('Error interno del servidor', 500);
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
