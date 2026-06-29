const requestLogger = (req, res, next) => {
  const start     = Date.now();
  const timestamp = new Date().toISOString();

  
  console.log(`\x1b[36m[${timestamp}]\x1b[0m → \x1b[1m${req.method}\x1b[0m ${req.originalUrl}`);

  
  res.on('finish', () => {
    const duration  = Date.now() - start;
    const statusCode = res.statusCode;

    
    let color = '\x1b[32m'; 
    if (statusCode >= 400) color = '\x1b[31m'; 
    else if (statusCode >= 300) color = '\x1b[33m'; 

    console.log(
      `${color}[${statusCode}]\x1b[0m ${req.method} ${req.originalUrl} — ${duration}ms`
    );
  });

  next(); 
};

module.exports = requestLogger;
