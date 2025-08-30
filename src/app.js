const express = require('express');
const cors = require('cors');
const routes = require('./routes.js');
const errorHandler = require('./middlewares/error.middleware.js');

const app = express();

// Enable CORS for all requests
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Health check endpoint
app.get('/', (_req, res) => res.send('API funcionando en JavaScript'));

// Mount main API routes under /api
app.use('/api', routes);

// Handle 404 errors for unmatched routes
app.use((_req, res) => res.status(404).json({ ok:false, message:'Not found' }));

// Global error handler middleware
app.use(errorHandler);




module.exports = app;
