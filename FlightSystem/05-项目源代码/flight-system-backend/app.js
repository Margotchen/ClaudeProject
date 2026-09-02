const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const sessionConfig = require('./config/session.config');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

const { response } = require('./utils/response');

// 健康检查
app.get('/health', (req, res) => {
  res.json(response(200, 'Service is running', { timestamp: Date.now() }));
});

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
