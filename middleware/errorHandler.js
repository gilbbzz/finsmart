const errorHandler = (err, req, res, next) => {
  
  console.error('\x1b[31m[ERROR HANDLER]\x1b[0m', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  
  let statusCode = err.statusCode || 500;
  let message    = err.message   || 'Internal Server Error';

  
  
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message    = Object.values(err.errors).map(e => e.message).join(', ');
  }

  
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `ID tidak valid: ${err.value}`;
  }

  
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message    = `${field} sudah digunakan`;
  }

  
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Token tidak valid';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token sudah kadaluarsa, silakan login kembali';
  }

  
  const response = {
    success: false,
    message,
  };

  
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
