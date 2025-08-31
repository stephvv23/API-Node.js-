//Punto de entrada. Crea el servidor HTTP nativo, aplica CORS/OPTIONS, 
// captura errores y delega todo a src/routes/index.js.

// CommonJS para evitar líos ESM en hostings compartidos
// src/server.js
const http = require('http');
const { router } = require('./routes');
const { sendJson, setCors } = require('./utils/response'); 

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const matched = await router(req, res);
    if (!matched) return sendJson(res, 404, { error: 'Not Found' });
  } catch (err) {
    console.error('[SERVER ERROR]', err);
    return sendJson(res, 500, { error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => console.log(` API running on port ${PORT}`));

