// Will be used as Route Aggregator. Imports routes from each module, 
// compiles them to RegExp (with path.js), sorts by specificity 
// (so that /login beats /:email) and does the matching for each request. 
// Passes to handlers params, query and body already parsed.

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
const emergencyContactPhoneRoutes = require('./modules/emergencyContactPhone/emergencyContactPhone.routes');
const permissionRoutes = require('./modules/auth/permission.routes');
const survivorRoutes = require('./modules/survivor/survivor.routes');
const cancerSurvivorRoutes = require('./modules/cancerSurvivor/cancerSurvivor.routes');
const emergencyContactSurvivorRoutes = require('./modules/emergencyContactSurvivor/emergencyContactSurvivor.routes');
const phoneRoutes = require('./modules/phone/phone.routes');
const phoneSurvivorRoutes = require('./modules/phoneSurvivor/phoneSurvivor.routes');
const phoneGodparentRoutes = require('./modules/phoneGodparent/phoneGodparent.routes');
const phoneHeadquarterRoutes = require('./modules/phoneHeadquarter/phoneHeadquarter.routes');
const phoneVolunteerRoutes = require('./modules/phoneVolunteer/phoneVolunteer.routes');
const godParentRoutes = require('./modules/GodParent/godParent.routes');
const activityRoutes = require('./modules/activity/activity.routes');
const volunteerRoutes = require('./modules/volunteer/volunteer.routes');

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
    ...emergencyContactPhoneRoutes,
    ...permissionRoutes,
    ...survivorRoutes,
    ...cancerSurvivorRoutes,
    ...emergencyContactSurvivorRoutes,
    ...phoneRoutes,
    ...phoneSurvivorRoutes,
    ...phoneGodparentRoutes,
    ...phoneHeadquarterRoutes,
    ...phoneVolunteerRoutes,
    ...godParentRoutes,
    ...activityRoutes,
    ...volunteerRoutes,
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