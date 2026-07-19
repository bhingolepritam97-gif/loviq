const path = require('path');
const fs = require('fs');

// Path to compiled TypeScript output
const distPath = path.resolve(__dirname, '../../dist/utils/syncDb.js');

if (fs.existsSync(distPath)) {
  try {
    require(distPath);
  } catch (err) {
    console.warn('[syncDb] Error executing dist/utils/syncDb.js:', err.message);
  }
} else {
  console.log('[syncDb] Skipping pre-build syncDb. Database syncs automatically when server starts.');
  process.exit(0);
}
