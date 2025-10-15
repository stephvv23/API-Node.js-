/*
Lector del body de las peticiones (stream). Si el método es POST/PUT/PATCH/DELETE, 
acumula data y la parsea a JSON de forma segura (devuelve {} si no es JSON válido).
 Límite ~1 MB para evitar abusos.
*/
function readJsonBody(req) {
  return new Promise((resolve) => {
    if (['POST','PUT','PATCH','DELETE'].includes(req.method) === false) return resolve({});
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > 1e6) req.destroy(); }); // ~1MB
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); } // evita romper si no viene JSON válido
    });
  });
}

module.exports = { readJsonBody };
