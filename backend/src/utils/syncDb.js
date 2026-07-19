// Compatibility bridge for Render build/deploy commands that execute `node src/utils/syncDb.js`
try {
  require('../../dist/utils/syncDb.js');
} catch (err) {
  console.log('[syncDb.js] Fallback to compiled dist path...');
  require('../../../dist/utils/syncDb.js');
}
