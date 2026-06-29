function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\0/g, '').trim();
}

function containsMongoOperator(value) {
  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).some(k => k.startsWith('$'));
  }
  return false;
}


function sanitizeRequest(req, res, next) {
  const sources = [req.body, req.query, req.params];

  for (const source of sources) {
    if (source && typeof source === 'object') {
      for (const key of Object.keys(source)) {
        if (containsMongoOperator(source[key])) {
          return res.status(400).json({
            success: false,
            message: `Parameter '${key}' mengandung karakter yang tidak diizinkan.`
          });
        }
      }
    }
  }
  next();
}


const sanitizeBody = sanitizeRequest;


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  return /[A-Z]/.test(password) && /[a-z]/.test(password) &&
         /\d/.test(password)    && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
}

function validateRegister(req, res, next) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });

  const cleanName  = sanitizeString(name);
  const cleanEmail = sanitizeString(email).toLowerCase();

  if (cleanName.length < 2 || cleanName.length > 50)
    return res.status(400).json({ success: false, message: 'Nama harus antara 2–50 karakter.' });
  if (!EMAIL_REGEX.test(cleanEmail))
    return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
  if (!isStrongPassword(password))
    return res.status(400).json({
      success: false,
      message: 'Password minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan simbol (contoh: Abc@1234).'
    });

  req.body.name  = cleanName;
  req.body.email = cleanEmail;
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });

  const cleanEmail = sanitizeString(email).toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail))
    return res.status(400).json({ success: false, message: 'Format email tidak valid.' });

  req.body.email = cleanEmail;
  next();
}

function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
  if (currentPassword === newPassword)
    return res.status(400).json({ success: false, message: 'Password baru tidak boleh sama dengan password lama.' });
  if (!isStrongPassword(newPassword))
    return res.status(400).json({
      success: false,
      message: 'Password baru minimal 8 karakter dan harus mengandung huruf besar, huruf kecil, angka, dan simbol.'
    });
  next();
}

module.exports = {
  sanitizeBody,      
  sanitizeRequest,   
  validateRegister,
  validateLogin,
  validateChangePassword,
  isStrongPassword,
  sanitizeString
};
