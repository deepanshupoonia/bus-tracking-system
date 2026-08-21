export function notFoundHandler(request, response) {
  response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`
  });
}

export function errorHandler(error, _request, response, _next) {
  if (error.name === 'ZodError') {
    return response.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
  }
  console.error('Unexpected server error', error);
  response.status(error.statusCode ?? 500).json({
    success: false,
    message: error.statusCode ? error.message : 'Internal server error'
  });
}
