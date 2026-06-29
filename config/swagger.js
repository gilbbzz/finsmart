const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinSmart API',
      version: '2.2.0',
      description: 'API dokumentasi untuk FinSmart — aplikasi manajemen keuangan pribadi dengan fitur Google OAuth, transaksi, budget, goals, hutang, investasi, dan recurring.',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT access token disimpan di cookie httpOnly',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id:          { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            name:         { type: 'string', example: 'Budi Santoso' },
            email:        { type: 'string', format: 'email', example: 'budi@example.com' },
            authProvider: { type: 'string', enum: ['local', 'google'], example: 'local' },
            avatar:       { type: 'string', example: '' },
            currency:     { type: 'string', example: 'IDR' },
            createdAt:    { type: 'string', format: 'date-time' },
            updatedAt:    { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            _id:       { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            user:      { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            category:  { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            type:      { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            amount:    { type: 'number', example: 50000 },
            note:      { type: 'string', example: 'Makan siang' },
            date:      { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            user:        { type: 'string' },
            category:    { type: 'string' },
            limitAmount: { type: 'number', example: 1000000 },
            month:       { type: 'string', example: '2024-06' },
            createdAt:   { type: 'string', format: 'date-time' },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            _id:           { type: 'string' },
            user:          { type: 'string' },
            name:          { type: 'string', example: 'Beli Laptop' },
            targetAmount:  { type: 'number', example: 15000000 },
            savedAmount:   { type: 'number', example: 5000000 },
            deadline:      { type: 'string', format: 'date' },
            status:        { type: 'string', enum: ['active', 'completed', 'cancelled'] },
            createdAt:     { type: 'string', format: 'date-time' },
          },
        },
        Debt: {
          type: 'object',
          properties: {
            _id:           { type: 'string' },
            user:          { type: 'string' },
            name:          { type: 'string', example: 'KPR Bank BCA' },
            type:          { type: 'string', enum: ['receivable', 'payable'] },
            totalAmount:   { type: 'number', example: 200000000 },
            paidAmount:    { type: 'number', example: 10000000 },
            dueDate:       { type: 'string', format: 'date' },
            status:        { type: 'string', enum: ['active', 'paid'] },
            createdAt:     { type: 'string', format: 'date-time' },
          },
        },
        Investment: {
          type: 'object',
          properties: {
            _id:           { type: 'string' },
            user:          { type: 'string' },
            name:          { type: 'string', example: 'Saham BBCA' },
            type:          { type: 'string', enum: ['saham', 'reksa_dana', 'emas', 'deposito', 'obligasi', 'kripto', 'lainnya'] },
            buyPrice:      { type: 'number', example: 8000 },
            currentPrice:  { type: 'number', example: 9500 },
            quantity:      { type: 'number', example: 100 },
            buyDate:       { type: 'string', format: 'date' },
            createdAt:     { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id:       { type: 'string' },
            user:      { type: 'string' },
            name:      { type: 'string', example: 'Makanan' },
            icon:      { type: 'string', example: '🍜' },
            color:     { type: 'string', example: '#f59e0b' },
            type:      { type: 'string', enum: ['income', 'expense', 'both'] },
            isDefault: { type: 'boolean', example: false },
          },
        },
        Recurring: {
          type: 'object',
          properties: {
            _id:        { type: 'string' },
            user:       { type: 'string' },
            name:       { type: 'string', example: 'Netflix' },
            amount:     { type: 'number', example: 54000 },
            type:       { type: 'string', enum: ['income', 'expense'] },
            frequency:  { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
            nextDue:    { type: 'string', format: 'date' },
            isActive:   { type: 'boolean', example: true },
            createdAt:  { type: 'string', format: 'date-time' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Berhasil' },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Terjadi kesalahan' },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
    tags: [
      { name: 'Auth',        description: 'Autentikasi pengguna (register, login, Google OAuth)' },
      { name: 'Transactions', description: 'Manajemen transaksi keuangan' },
      { name: 'Categories',  description: 'Kategori transaksi' },
      { name: 'Budgets',     description: 'Budget per kategori per bulan' },
      { name: 'Goals',       description: 'Target tabungan / financial goals' },
      { name: 'Debts',       description: 'Manajemen hutang piutang' },
      { name: 'Recurring',   description: 'Transaksi berulang otomatis' },
      { name: 'Investments', description: 'Portofolio investasi' },
      { name: 'Summary',     description: 'Ringkasan & laporan keuangan' },
      { name: 'Health',      description: 'Skor kesehatan keuangan' },
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register pengguna baru',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name:     { type: 'string', example: 'Budi Santoso' },
                    email:    { type: 'string', format: 'email', example: 'budi@example.com' },
                    password: { type: 'string', minLength: 8, example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Registrasi berhasil', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            409: { description: 'Email sudah terdaftar', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login dengan email & password',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email:    { type: 'string', format: 'email', example: 'budi@example.com' },
                    password: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login berhasil', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { description: 'Email atau password salah', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout (hapus token cookie)',
          responses: {
            200: { description: 'Logout berhasil' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token menggunakan refresh token cookie',
          security: [],
          responses: {
            200: { description: 'Token berhasil diperbarui' },
            401: { description: 'Refresh token tidak valid atau kadaluarsa' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Ambil data profil pengguna yang sedang login',
          responses: {
            200: { description: 'Data profil berhasil diambil', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { description: 'Tidak terautentikasi' },
          },
        },
      },
      '/api/auth/change-password': {
        put: {
          tags: ['Auth'],
          summary: 'Ubah password pengguna',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string', example: 'password123' },
                    newPassword:     { type: 'string', example: 'newpassword456' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password berhasil diubah' },
            400: { description: 'Password lama salah' },
          },
        },
      },
      '/api/auth/google': {
        get: {
          tags: ['Auth'],
          summary: 'Redirect ke halaman OAuth Google',
          security: [],
          responses: {
            302: { description: 'Redirect ke Google consent screen' },
          },
        },
      },
      '/api/transactions': {
        get: {
          tags: ['Transactions'],
          summary: 'Ambil semua transaksi milik pengguna',
          parameters: [
            { name: 'type',     in: 'query', schema: { type: 'string', enum: ['income', 'expense'] }, description: 'Filter berdasarkan tipe' },
            { name: 'month',    in: 'query', schema: { type: 'string', example: '2024-06' }, description: 'Filter berdasarkan bulan (YYYY-MM)' },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter berdasarkan ID kategori' },
            { name: 'page',     in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit',    in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'Daftar transaksi', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          },
        },
        post: {
          tags: ['Transactions'],
          summary: 'Tambah transaksi baru',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['category', 'type', 'amount'],
                  properties: {
                    category: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
                    type:     { type: 'string', enum: ['income', 'expense'] },
                    amount:   { type: 'number', example: 50000 },
                    note:     { type: 'string', example: 'Makan siang' },
                    date:     { type: 'string', format: 'date', example: '2024-06-15' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Transaksi berhasil ditambahkan' },
          },
        },
      },
      '/api/transactions/{id}': {
        put: {
          tags: ['Transactions'],
          summary: 'Update transaksi berdasarkan ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number' },
                    note:   { type: 'string' },
                    date:   { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Transaksi berhasil diupdate' },
            404: { description: 'Transaksi tidak ditemukan' },
          },
        },
        delete: {
          tags: ['Transactions'],
          summary: 'Hapus transaksi berdasarkan ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Transaksi berhasil dihapus' },
            404: { description: 'Transaksi tidak ditemukan' },
          },
        },
      },
      '/api/transactions/export': {
        get: {
          tags: ['Transactions'],
          summary: 'Export transaksi ke file CSV',
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'string', example: '2024-06' } },
          ],
          responses: {
            200: { description: 'File CSV', content: { 'text/csv': {} } },
          },
        },
      },
      '/api/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Ambil semua kategori milik pengguna',
          responses: {
            200: { description: 'Daftar kategori', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          },
        },
        post: {
          tags: ['Categories'],
          summary: 'Tambah kategori baru',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type'],
                  properties: {
                    name:  { type: 'string', example: 'Olahraga' },
                    icon:  { type: 'string', example: '🏋️' },
                    color: { type: 'string', example: '#10b981' },
                    type:  { type: 'string', enum: ['income', 'expense', 'both'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Kategori berhasil ditambahkan' },
          },
        },
      },
      '/api/categories/{id}': {
        delete: {
          tags: ['Categories'],
          summary: 'Hapus kategori berdasarkan ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Kategori berhasil dihapus' },
            404: { description: 'Kategori tidak ditemukan' },
          },
        },
      },
      '/api/budgets': {
        get: {
          tags: ['Budgets'],
          summary: 'Ambil semua budget',
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'string', example: '2024-06' }, description: 'Filter bulan (YYYY-MM)' },
          ],
          responses: { 200: { description: 'Daftar budget' } },
        },
        post: {
          tags: ['Budgets'],
          summary: 'Tambah budget baru',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['category', 'limitAmount', 'month'],
                  properties: {
                    category:    { type: 'string' },
                    limitAmount: { type: 'number', example: 1000000 },
                    month:       { type: 'string', example: '2024-06' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Budget berhasil ditambahkan' } },
        },
      },
      '/api/budgets/{id}': {
        put: {
          tags: ['Budgets'],
          summary: 'Update budget',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { limitAmount: { type: 'number' } } } } },
          },
          responses: { 200: { description: 'Budget berhasil diupdate' } },
        },
        delete: {
          tags: ['Budgets'],
          summary: 'Hapus budget',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Budget berhasil dihapus' } },
        },
      },
      '/api/budgets/alerts': {
        get: {
          tags: ['Budgets'],
          summary: 'Ambil alert budget yang hampir atau sudah melebihi limit',
          responses: { 200: { description: 'Daftar alert budget' } },
        },
      },
      '/api/goals': {
        get: {
          tags: ['Goals'],
          summary: 'Ambil semua financial goals',
          responses: { 200: { description: 'Daftar goals' } },
        },
        post: {
          tags: ['Goals'],
          summary: 'Tambah goal baru',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'targetAmount'],
                  properties: {
                    name:         { type: 'string', example: 'Beli Laptop' },
                    targetAmount: { type: 'number', example: 15000000 },
                    deadline:     { type: 'string', format: 'date', example: '2024-12-31' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Goal berhasil dibuat' } },
        },
      },
      '/api/goals/{id}': {
        put: {
          tags: ['Goals'],
          summary: 'Update goal',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Goal' } } } },
          responses: { 200: { description: 'Goal berhasil diupdate' } },
        },
        delete: {
          tags: ['Goals'],
          summary: 'Hapus goal',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Goal berhasil dihapus' } },
        },
      },
      '/api/goals/{id}/topup': {
        post: {
          tags: ['Goals'],
          summary: 'Top up tabungan ke goal tertentu',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['amount'], properties: { amount: { type: 'number', example: 500000 } } },
              },
            },
          },
          responses: { 200: { description: 'Top up berhasil' } },
        },
      },
      '/api/goals/{id}/claim': {
        post: {
          tags: ['Goals'],
          summary: 'Klaim / selesaikan goal yang sudah tercapai',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Goal berhasil diklaim' } },
        },
      },
      '/api/debts': {
        get: {
          tags: ['Debts'],
          summary: 'Ambil semua data hutang piutang',
          responses: { 200: { description: 'Daftar hutang piutang' } },
        },
        post: {
          tags: ['Debts'],
          summary: 'Tambah data hutang piutang',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type', 'totalAmount'],
                  properties: {
                    name:        { type: 'string', example: 'Hutang ke Budi' },
                    type:        { type: 'string', enum: ['receivable', 'payable'] },
                    totalAmount: { type: 'number', example: 500000 },
                    dueDate:     { type: 'string', format: 'date' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Hutang berhasil ditambahkan' } },
        },
      },
      '/api/debts/{id}': {
        put: {
          tags: ['Debts'],
          summary: 'Update data hutang',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Debt' } } } },
          responses: { 200: { description: 'Hutang berhasil diupdate' } },
        },
        delete: {
          tags: ['Debts'],
          summary: 'Hapus data hutang',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Hutang berhasil dihapus' } },
        },
      },
      '/api/debts/{id}/pay': {
        post: {
          tags: ['Debts'],
          summary: 'Catat pembayaran hutang',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['amount'], properties: { amount: { type: 'number', example: 100000 } } },
              },
            },
          },
          responses: { 200: { description: 'Pembayaran berhasil dicatat' } },
        },
      },
      '/api/recurring': {
        get: {
          tags: ['Recurring'],
          summary: 'Ambil semua transaksi berulang',
          responses: { 200: { description: 'Daftar recurring' } },
        },
        post: {
          tags: ['Recurring'],
          summary: 'Tambah transaksi berulang',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'amount', 'type', 'frequency', 'nextDue'],
                  properties: {
                    name:      { type: 'string', example: 'Netflix' },
                    amount:    { type: 'number', example: 54000 },
                    type:      { type: 'string', enum: ['income', 'expense'] },
                    frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'] },
                    nextDue:   { type: 'string', format: 'date', example: '2024-07-01' },
                    category:  { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Recurring berhasil ditambahkan' } },
        },
      },
      '/api/recurring/{id}': {
        put: {
          tags: ['Recurring'],
          summary: 'Update recurring',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Recurring' } } } },
          responses: { 200: { description: 'Recurring berhasil diupdate' } },
        },
        delete: {
          tags: ['Recurring'],
          summary: 'Hapus recurring',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Recurring berhasil dihapus' } },
        },
      },
      '/api/recurring/{id}/execute': {
        post: {
          tags: ['Recurring'],
          summary: 'Eksekusi manual satu recurring tertentu',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Berhasil dieksekusi' } },
        },
      },
      '/api/recurring/execute-due': {
        post: {
          tags: ['Recurring'],
          summary: 'Eksekusi semua recurring yang sudah jatuh tempo',
          responses: { 200: { description: 'Semua recurring jatuh tempo berhasil dieksekusi' } },
        },
      },
      '/api/investments': {
        get: {
          tags: ['Investments'],
          summary: 'Ambil semua data investasi',
          responses: { 200: { description: 'Daftar investasi' } },
        },
        post: {
          tags: ['Investments'],
          summary: 'Tambah data investasi',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type', 'buyPrice', 'quantity', 'buyDate'],
                  properties: {
                    name:     { type: 'string', example: 'Saham BBCA' },
                    type:     { type: 'string', enum: ['saham', 'reksa_dana', 'emas', 'deposito', 'obligasi', 'kripto', 'lainnya'] },
                    buyPrice: { type: 'number', example: 8000 },
                    quantity: { type: 'number', example: 100 },
                    buyDate:  { type: 'string', format: 'date', example: '2024-01-15' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Investasi berhasil ditambahkan' } },
        },
      },
      '/api/investments/{id}': {
        put: {
          tags: ['Investments'],
          summary: 'Update data investasi',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Investment' } } } },
          responses: { 200: { description: 'Investasi berhasil diupdate' } },
        },
        delete: {
          tags: ['Investments'],
          summary: 'Hapus data investasi',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Investasi berhasil dihapus' } },
        },
      },
      '/api/investments/{id}/update-value': {
        patch: {
          tags: ['Investments'],
          summary: 'Update harga terkini investasi',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['currentPrice'], properties: { currentPrice: { type: 'number', example: 9500 } } },
              },
            },
          },
          responses: { 200: { description: 'Harga berhasil diupdate' } },
        },
      },
      '/api/summary': {
        get: {
          tags: ['Summary'],
          summary: 'Ambil ringkasan keuangan bulanan',
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'string', example: '2024-06' } },
          ],
          responses: { 200: { description: 'Ringkasan keuangan' } },
        },
      },
      '/api/summary/chart': {
        get: {
          tags: ['Summary'],
          summary: 'Ambil data chart keuangan',
          parameters: [
            { name: 'months', in: 'query', schema: { type: 'integer', default: 6 }, description: 'Jumlah bulan ke belakang' },
          ],
          responses: { 200: { description: 'Data chart' } },
        },
      },
      '/api/health/score': {
        get: {
          tags: ['Health'],
          summary: 'Ambil skor kesehatan keuangan pengguna',
          responses: { 200: { description: 'Skor kesehatan keuangan beserta breakdown komponen' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;