/*colaborador de index. 
Utilidades de ruteo:

compilePath('/api/users/:email') → { regex: /^\/api\/users\/([^/]+)$/, names: ['email'] }

specificityScore(path) para ordenar rutas (más estáticas > menos parámetros).
Evita escribir RegExp a mano y asegura params nombrados.
*/
function compilePath(template) {
  const names = [];
  // asegurar sin slash final (excepto la raíz)
  let t = template.replace(/\/+$/, '') || '/';
  const regexStr = '^' + t.replace(/:[^/]+/g, (m) => {
    names.push(m.slice(1));
    return '([^/]+)';
  }) + '$';
  return { regex: new RegExp(regexStr), names };
}

// Heurística para ordenar: primero rutas más específicas (menos :params)
function specificityScore(path) {
  const parts = path.split('/').filter(Boolean);
  const params = parts.filter(p => p.startsWith(':')).length;
  const statics = parts.length - params;
  return (statics * 100) - params; // mayor = más específica
}

module.exports = { compilePath, specificityScore };
