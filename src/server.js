// Entry point. Creates the native HTTP server, applies CORS/OPTIONS, 
// captures errors and delegates everything to src/routes/index.js.

// CommonJS to avoid ESM issues in shared hosting
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

