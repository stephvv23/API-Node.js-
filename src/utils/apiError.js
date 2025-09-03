/*
Error de aplicación con statusCode (400/401/403/404/409/500). 
Permite hacer next(ApiError.badRequest('...')) en controllers y 
que el adaptador devuelva la respuesta correcta.
*/ 
class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.ok = false;
  }

  static badRequest(msg) {
    return new ApiError(400, msg);
  }
  static unauthorized(msg) {
    return new ApiError(401, msg);
  }
  static forbidden(msg) {
    return new ApiError(403, msg);
  }
  static internal(msg) {
    return new ApiError(500, msg);
  }
  static notFound(msg)    { return new ApiError(404, msg); }
  static conflict(msg)    { return new ApiError(409, msg); }
}

module.exports = ApiError;
