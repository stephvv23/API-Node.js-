const express = require('express');
const cors = require('cors');
const routes = require('./routes.js');
const errorHandler = require('./middlewares/error.middleware.js');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.send('API funcionando en JavaScript'));
app.use('/api', routes);

// 404 y errores
app.use((_req, res) => res.status(404).json({ ok:false, message:'Not found' }));
app.use(errorHandler);




module.exports = app;
