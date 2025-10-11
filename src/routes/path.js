/*index collaborator. 
Routing utilities:

compilePath('/api/users/:email') → { regex: /^\/api\/users\/([^/]+)$/, names: ['email'] }

specificityScore(path) to sort routes (more static > fewer parameters).
Avoids writing RegExp by hand and ensures named params.
*/
function compilePath(template) {
  const names = [];
  // ensure no trailing slash (except root)
  let t = template.replace(/\/+$/, '') || '/';
  const regexStr = '^' + t.replace(/:[^/]+/g, (m) => {
    names.push(m.slice(1));
    return '([^/]+)';
  }) + '$';
  return { regex: new RegExp(regexStr), names };
}

// Heuristic for sorting: first more specific routes (fewer :params)
function specificityScore(path) {
  const parts = path.split('/').filter(Boolean);
  const params = parts.filter(p => p.startsWith(':')).length;
  const statics = parts.length - params;
  return (statics * 100) - params; // higher = more specific
}

module.exports = { compilePath, specificityScore };
