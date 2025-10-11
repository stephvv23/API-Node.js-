// Used as a route aggregator. Imports routes from each module,
// compiles them to RegExp (using path.js), sorts by specificity
// (so "/login" wins over "/:email") and matches each request.
// Passes parsed params, query and body to the handlers.

const { URL } = require('url');
const { readJsonBody } = require('../utils/body');
const { sendJson } = require('../utils/response');
const { wrapExpressHandler } = require('../utils/expressify');
const { compilePath, specificityScore } = require('./path');

// 1) Import routes from all modules
const usersRoutes = require('./modules/users/users.routes');
const headquartersRoutes = require('./modules/headquarters/headquarter.routes');
const assetsRoutes = require('./modules/assets/assets.routes');
const cancerRoutes = require('./modules/cancer/cancer.routes');
const categoriesRoutes = require('./modules/Category/category.routes');
const roleRoutes = require('./modules/Role/role.routes');
const roleWindowsRoutes = require('./modules/RoleWindows/roleWindows.routes');
const emergencyContactRoutes = require('./modules/emergencyContact/emergencyContact.routes');
// const patientsRoutes = require('./modules/patients.routes');
// 2) Concatenate and compile paths → { method, pattern, paramNames, handler }
function buildRoutes() {
  const raw = [
    ...usersRoutes,
    ...headquartersRoutes,
    ...assetsRoutes,

    ...cancerRoutes,  
    ...categoriesRoutes,
    ...roleRoutes,
    ...roleWindowsRoutes,
    ...emergencyContactRoutes,
    // ...patientsRoutes,
    // etc.
  ];

  // Sort by specificity ("/login" before "/:email")
  raw.sort((a, b) => specificityScore(b.path) - specificityScore(a.path));

  return raw.map(r => {
    const { regex, names } = compilePath(r.path);
    return {
      method: r.method,
      pattern: regex,
      handler: wrapExpressHandler(r.handler, names),
    };
  });
}

const routes = buildRoutes();

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  for (const r of routes) {
    if (req.method !== r.method) continue;
    const match = pathname.match(r.pattern);
    if (!match) continue;

    const params = match.slice(1).map(p => {
      try { return decodeURIComponent(p); } catch { return p; }
    });
    const query = Object.fromEntries(url.searchParams.entries());
    const body = await readJsonBody(req);

    await r.handler({ req, res, params, query, body });
    return true;
  }
  return false;
}

module.exports = { router };