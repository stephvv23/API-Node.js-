// src/server.js
require('dotenv').config();
const app = require('./app'); 
const PORT = process.env.PORT || 3000;

// Start the Express server on the specified port
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});


