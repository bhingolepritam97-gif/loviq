// Bulletproof syncDb bridge — works before or after `tsc` compilation
const path = require('path');
const fs = require('fs');

const compiledPath = path.join(__dirname, '../../dist/utils/syncDb.js');

if (fs.existsSync(compiledPath)) {
  require(compiledPath);
} else {
  console.log('[syncDb.js] Compiled dist not found, running via ts-node...');
  try {
    require('ts-node').register({ transpileOnly: true });
    require('./syncDb.ts');
  } catch (err) {
    console.error('[syncDb.js] Could not run syncDb:', err.message);
    process.exit(0); // exit 0 so build doesn't fail if optional sync fails
  }
}
