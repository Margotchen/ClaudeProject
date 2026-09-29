require('dotenv').config();

module.exports = {
  secret: process.env.SESSION_SECRET || 'flight-system-secret-key-2026',
  name: process.env.SESSION_COOKIE_NAME || 'flight_session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
    httpOnly: true,
    // 生产环境建议启用 secure，且需 HTTPS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
};
