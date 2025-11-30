/**
 * Unified API Response and Error System
 * Combines standardized responses with error handling
 */

/**
 * Standard success response
 * @param {any} data - Data to return
 * @param {string} message - Optional message
 * @returns {object} Formatted response
 */
const success = (data, message = null) => ({
  ok: true,
  data,
  ...(message && { message })
});

/**
 * API Error class with standardized response format
 * Extends Error to work with try/catch and next() patterns
 */
class ApiResponse extends Error {
  constructor(code, message, errors = null) {
    super(message);
    this.code = code;
    this.statusCode = code;
    this.ok = false;
    this.errors = errors;
  }

  // Standard error responses
  static badRequest(message = 'Solicitud inválida', errors = null) {
    return new ApiResponse(400, message, errors);
  }

  static unauthorized(message = 'Acceso no autorizado') {
    return new ApiResponse(401, message);
  }

  static forbidden(message = 'Acceso prohibido') {
    return new ApiResponse(403, message);
  }

  static notFound(resource = 'Recurso') {
    return new ApiResponse(404, `${resource} no encontrado`);
  }

  static conflict(message = 'Conflicto en los datos') {
    return new ApiResponse(409, message);
  }

  static internal(message = 'Error interno del servidor') {
    return new ApiResponse(500, message);
  }

  // Validation errors with array of errors
  static validationErrors(errors, message = 'Errores de validación') {
    return new ApiResponse(400, message, errors);
  }

  // Convert to JSON response format
  toJSON() {
    const response = {
      ok: false,
      message: this.message
    };

    if (this.errors) {
      response.errors = this.errors;
    }

    return response;
  }

  // Get status code for HTTP response
  getStatusCode() {
    return this.statusCode;
  }
}

/**
 * Helper functions for direct responses (non-error cases)
 */
const ResponseHelpers = {
  success,
  
  error: (message, statusCode = 500) => ({
    ok: false,
    message,
    statusCode
  }),

  validationErrors: (errors, message = 'Errores de validación') => ({
    ok: false,
    message,
    errors
  }),

  notFound: (resource = 'Recurso') => ({
    ok: false,
    message: `${resource} no encontrado`,
    statusCode: 404
  }),

  unauthorized: (message = 'Acceso no autorizado') => ({
    ok: false,
    message,
    statusCode: 401
  })
};

/**
 * Middleware for standard responses
 * Extends res object with helper methods
 */
const standardResponseMiddleware = (req, res, next) => {
  // Success
  res.success = (data, message) => {
    return res.json(success(data, message));
  };

  // Generic error
  res.error = (message, statusCode = 500) => {
    const response = ResponseHelpers.error(message, statusCode);
    return res.status(response.statusCode).json(response);
  };

  // Validation errors
  res.validationErrors = (errors, message) => {
    return res.status(400).json(ResponseHelpers.validationErrors(errors, message));
  };

  // Not found
  res.notFound = (resource) => {
    return res.status(404).json(ResponseHelpers.notFound(resource));
  };

  // Unauthorized
  res.unauthorized = (message) => {
    return res.status(401).json(ResponseHelpers.unauthorized(message));
  };

  // Bad request (400 error with custom message)
  res.badRequest = (message) => {
    return res.status(400).json({
      ok: false,
      message
    });
  };

  // Throw API error (for use with next())
  res.throwError = (statusCode, message, errors = null) => {
    throw new ApiResponse(statusCode, message, errors);
  };

  next();
};

// Export everything
module.exports = {
  // Main class (replaces ApiError)
  ApiResponse,
  
  // Helper functions (for direct use)
  success,
  error: ResponseHelpers.error,
  validationErrors: ResponseHelpers.validationErrors,
  notFound: ResponseHelpers.notFound,
  unauthorized: ResponseHelpers.unauthorized,
  
  // Middleware
  standardResponseMiddleware,
  
  // Backward compatibility (aliases)
  ApiError: ApiResponse  // For existing code that uses ApiError
};