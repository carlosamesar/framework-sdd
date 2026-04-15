import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { simulateDeploy, buildDeployPlan } = require('./deploy.cjs');

export { simulateDeploy, buildDeployPlan };
export default { simulateDeploy, buildDeployPlan };

