/**
 * seedTestProfiles.js
 *
 * ⚠️  STAGING / TEST DATABASE ONLY — NEVER RUN AGAINST PRODUCTION.
 *
 * Usage:
 *   node seedTestProfiles.js                     # seeds 150 profiles (default)
 *   node seedTestProfiles.js --count 50          # seeds a custom number
 *   node seedTestProfiles.js --lat 37.77 --lng -122.41 # seeds around specific location (SF)
 *   node seedTestProfiles.js --dry-run           # logs profiles without inserting
 *   node seedTestProfiles.js --cleanup           # deletes all isSeedData profiles
 *
 * Purpose:
 *   Fills your test environment with enough believable, spread-out profiles
 *   that a tester swiping for 10–20 minutes never hits an empty feed.
 *   This is a developer / QA tool, not a growth or marketing solution.
 *
 * Tagging:
 *   Every generated profile has `isSeedData: true` so you can bulk-delete
 *   the entire set with a single query (see CLEANUP section at the bottom).
 */

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, getDocs, query, where, writeBatch, orderBy, limit } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const geofire = require('geofire-common');

// ─── Environment configuration ────────────────────────────────────────────────
try {
  const envPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, ''); // strip quotes
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.warn("Could not load root .env file:", e.message);
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAKI9IAchNbjtx1LxzfloXkCSm5zbost2o",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "loviq-33ac0.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "loviq-33ac0",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "loviq-33ac0.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "627555697682",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:627555697682:web:d2ae681b3f983a8a1784cb",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-J1W86JB7S2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── Configuration ────────────────────────────────────────────────────────────

const DEFAULT_COUNT = 150;

// Center of the test area. Fallback center: New York City
const TEST_CENTER_LAT = 40.7128;
const TEST_CENTER_LNG = -74.006;

// Seeded profiles spread within this radius of the center point.
const SPREAD_RADIUS_MILES = 20;

// ─── Data pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Ava', 'Liam', 'Sophia', 'Noah', 'Isabella', 'Mason', 'Mia', 'Ethan',
  'Amelia', 'Lucas', 'Harper', 'Oliver', 'Evelyn', 'Elijah', 'Abigail',
  'James', 'Emily', 'Benjamin', 'Charlotte', 'Alexander', 'Luna', 'Aria',
  'Jackson', 'Chloe', 'Sebastian', 'Penelope', 'Aiden', 'Layla', 'Mateo',
  'Riley', 'Leo', 'Zoey', 'Dylan', 'Nora', 'Ryan', 'Lily', 'Nathan',
  'Eleanor', 'Aaron', 'Hannah', 'Zoe', 'Skyler', 'Jordan', 'Morgan',
  'Taylor', 'Casey', 'Quinn', 'Avery', 'Peyton', 'Reese',
];

const LAST_INITIALS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K',
  'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'Y',
];

const JOBS = [
  'Graphic Designer', 'Software Engineer', 'Nurse', 'Teacher', 'Chef',
  'Marketing Manager', 'Photographer', 'Architect', 'Physical Therapist',
  'UX Designer', 'Data Scientist', 'Journalist', 'Event Planner',
  'Yoga Instructor', 'Financial Analyst', 'Barista', 'Real Estate Agent',
  'Veterinarian', 'Social Worker', 'Startup Founder',
];

const INTERESTS_POOL = [
  'Travel', 'Fitness', 'Music', 'Foodie', 'Movies', 'Reading',
  'Gaming', 'Art', 'Hiking', 'Dogs', 'Cats', 'Coffee', 'Yoga',
  'Photography', 'Cooking', 'Dancing', 'Wine', 'Sports', 'Meditation',
  'Rock Climbing', 'Running', 'Cycling', 'Painting', 'Theater',
  'Volunteering', 'Fashion', 'Astronomy', 'Board Games', 'Podcasts',
];

const BIOS = [
  "Looking for someone to explore the city with.",
  "Coffee enthusiast, dog parent, weekend hiker.",
  "Just moved here — show me the best spots.",
  "Big fan of trivia nights and terrible puns.",
  "Trying to find someone who'll split dessert with me.",
  "Work hard, travel harder. Adventure > Netflix.",
  "My dog will like you more than I do at first.",
  "Recovering from too many failed sourdough attempts.",
  "Avid reader looking for someone who also judges books by their covers.",
  "Equal parts homebody and spontaneous road-tripper.",
  "If you can make me laugh I'm probably already sold.",
  "I cook, you clean. It's only fair.",
  "Searching for a partner in crime for farmers markets and late-night diners.",
  "Recently went skydiving. Now everything feels manageable.",
  "Will always split the appetizers. Non-negotiable.",
  "Gym in the morning, concert at night. Balance.",
  "Love a good debate that ends in agreeing to disagree over pizza.",
  "I have opinions about oat milk. Strong opinions.",
  "Life's too short for bad coffee or boring people.",
  "Here because my friends said I should 'put myself out there.'",
];

const GENDERS = ['Woman', 'Man', 'Non-binary'];
const INTENTS  = ['long_term', 'short_term', 'not_sure'];

// Picsum photo seeds — variety of stable placeholder images
const PHOTO_SEEDS = [
  'helena', 'marco', 'jasmine', 'felix', 'priya', 'leandro', 'yuki',
  'amara', 'sam', 'nadia', 'omar', 'celine', 'raj', 'luna', 'theo',
  'simone', 'kai', 'imani', 'arjun', 'elena', 'dani', 'river',
];

// ─── Utility functions ────────────────────────────────────────────────────────

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAge() {
  const weights = [
    { min: 21, max: 24, weight: 20 },
    { min: 25, max: 30, weight: 40 },
    { min: 31, max: 35, weight: 25 },
    { min: 36, max: 40, weight: 15 },
  ];
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const range of weights) {
    cumulative += range.weight;
    if (roll < cumulative) {
      return range.min + Math.floor(Math.random() * (range.max - range.min + 1));
    }
  }
  return 28; // fallback
}

function randomPhotoCount() {
  const counts = [1, 2, 2, 3, 3, 3, 4, 4, 5, 6];
  return counts[Math.floor(Math.random() * counts.length)];
}

/**
 * Spreads profiles in a realistic radius around the center point so they show
 * up at a variety of distances — not all stacked at 0 miles.
 * Uses a uniform random distribution within a circle (rejection sampling).
 */
function randomNearbyCoord(centerLat, centerLng, maxMiles) {
  const maxDeg = maxMiles / 69; // rough miles-to-degrees conversion
  while (true) {
    const dx = (Math.random() - 0.5) * 2 * maxDeg;
    const dy = (Math.random() - 0.5) * 2 * maxDeg;
    if (dx * dx + dy * dy <= maxDeg * maxDeg) {
      return {
        lat: parseFloat((centerLat + dy).toFixed(6)),
        lng: parseFloat((centerLng + dx).toFixed(6)),
      };
    }
  }
}

/** Pick N unique items from an array. */
function pickUnique(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// ─── Profile builder ──────────────────────────────────────────────────────────

function buildFakeProfile(index, centerLat, centerLng) {
  const coord = randomNearbyCoord(centerLat, centerLng, SPREAD_RADIUS_MILES);
  const gender = randomFrom(GENDERS);
  const name = randomFrom(FIRST_NAMES);
  const lastName = randomFrom(LAST_INITIALS) + '.';
  const age = randomAge();
  const photoSeed = PHOTO_SEEDS[index % PHOTO_SEEDS.length];
  const photoCount = randomPhotoCount();
  const interestCount = 3 + Math.floor(Math.random() * 3); // 3–5

  // Build photo array with stable picsum seeds
  const photos = Array.from({ length: photoCount }, (_, i) =>
    `https://picsum.photos/seed/${photoSeed}${i === 0 ? '' : `_${i}`}/600/800`
  );

  return {
    id: `seed_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    displayName: `${name} ${lastName}`,
    age,
    gender,
    job: randomFrom(JOBS),
    intent: randomFrom(INTENTS),
    bio: randomFrom(BIOS),
    interests: pickUnique(INTERESTS_POOL, interestCount),
    location: {
      latitude: coord.lat,
      longitude: coord.lng,
      geohash: geofire.geohashForLocation([coord.lat, coord.lng])
    },
    photos,
    isVerified: Math.random() > 0.45,       // ~55% verified
    profileComplete: true,
    isSeedData: true,                        // IMPORTANT: tag for bulk-delete
    matchReason: 'normal',                   // shows in the normal feed
    createdAt: new Date().toISOString(),
    // Spread signup times over the past 30 days so profiles feel organic
    joinedAt: new Date(Date.now() - Math.random() * 30 * 86400 * 1000).toISOString(),
  };
}

// ─── Database insert ─────────────────────────────────────────────

async function insertProfileIntoDatabase(profile) {
  const profileRef = doc(db, 'profiles', profile.id);
  await setDoc(profileRef, profile);
  console.log(
    `  + [${profile.id.slice(-8)}] ${profile.displayName}, ${profile.age} (${profile.gender}) ` +
    `· ${profile.job} · ${profile.interests.join(', ')} ` +
    `· ${profile.location.latitude.toFixed(3)},${profile.location.longitude.toFixed(3)}`
  );
}

// ─── Cleanup helper ───────────────────────────────────────────────────────────

async function cleanupSeedData() {
  console.log('\n🗑  Cleanup mode: deleting all profiles with "seed_" ID or isSeedData flag...');
  try {
    const profilesRef = collection(db, 'profiles');
    const snap = await getDocs(profilesRef);
    
    if (snap.empty) {
      console.log('No profiles found in database.');
      return;
    }

    const batchList = [];
    let currentBatch = writeBatch(db);
    let opCount = 0;

    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (docSnap.id.startsWith('seed_') || data.isSeedData === true) {
        currentBatch.delete(docSnap.ref);
        opCount++;
        if (opCount % 400 === 0) {
          batchList.push(currentBatch.commit());
          currentBatch = writeBatch(db);
        }
      }
    });

    if (opCount % 400 !== 0) {
      batchList.push(currentBatch.commit());
    }

    if (opCount === 0) {
      console.log('No seed profiles found to delete.');
      return;
    }

    await Promise.all(batchList);
    console.log(`✅  Successfully deleted ${opCount} seed profiles.`);
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isDryRun  = args.includes('--dry-run');
  const isCleanup = args.includes('--cleanup');
  const countArg  = args.indexOf('--count');
  const count     = countArg !== -1 ? parseInt(args[countArg + 1], 10) || DEFAULT_COUNT : DEFAULT_COUNT;

  const latArg    = args.indexOf('--lat');
  const lngArg    = args.indexOf('--lng');
  const customLat = latArg !== -1 ? parseFloat(args[latArg + 1]) : null;
  const customLng = lngArg !== -1 ? parseFloat(args[lngArg + 1]) : null;

  // ─── Authenticate first to satisfy Firestore Security Rules ───
  console.log('🔑  Authenticating seeder client with Firestore...');
  const testEmail = "sarah.realtime@example.com";
  const testPassword = "password123";
  let isAuthenticated = false;

  try {
    try {
      await signInWithEmailAndPassword(auth, testEmail, testPassword);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
        // Try creating the account
        await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      } else {
        throw authErr;
      }
    }
    isAuthenticated = true;
    console.log(`✅  Authenticated successfully as ${testEmail}.`);
  } catch (err) {
    console.warn(`⚠️   Failed to authenticate: ${err.message}. Database operations may fail if rules are restricted.`);
  }

  if (isCleanup) {
    await cleanupSeedData();
    process.exit(0);
  }

  // ─── Fetch target coordinates dynamically ───────────────────────────────
  let centerLat = TEST_CENTER_LAT;
  let centerLng = TEST_CENTER_LNG;
  let hasFoundCoordinates = false;

  if (customLat !== null && customLng !== null && !isNaN(customLat) && !isNaN(customLng)) {
    centerLat = customLat;
    centerLng = customLng;
    hasFoundCoordinates = true;
    console.log(`📍 Using command-line coordinates: (${centerLat}, ${centerLng}).`);
  } else if (!isCleanup) {
    console.log('🔍  Detecting active test user profile coordinates...');
    try {
      const profilesRef = collection(db, 'profiles');
      // Fetch recent profile complete profiles
      const q = query(profilesRef, orderBy('createdAt', 'desc'), limit(15));
      const snap = await getDocs(q);

      let targetProfile = null;
      snap.forEach(docSnap => {
        const p = docSnap.data();
        if (!p.isSeedData && p.location && p.location.latitude && p.location.longitude) {
          targetProfile = p;
        }
      });

      if (targetProfile) {
        centerLat = targetProfile.location.latitude;
        centerLng = targetProfile.location.longitude;
        hasFoundCoordinates = true;
        console.log(`📍 Found recent user profile "${targetProfile.displayName}" at coordinates (${centerLat}, ${centerLng}).`);
        console.log(`   Seeding profiles around their coordinates so they appear on the Discover Feed immediately.`);
      }
    } catch (err) {
      console.warn(`⚠️   Failed to query recent profile coordinates: ${err.message}. Using default NYC center.`);
    }

    if (!hasFoundCoordinates) {
      console.log(`ℹ️   No active user profiles found. Seeding around default New York City center (${TEST_CENTER_LAT}, ${TEST_CENTER_LNG}).`);
    }
  }

  if (isDryRun) {
    console.log('🔍  Dry run — no data will be written to the database.\n');
  }

  console.log(
    `\n🌱  Seeding ${count} test profiles around (${centerLat}, ${centerLng})` +
    ` within ${SPREAD_RADIUS_MILES} miles...\n`
  );

  const profiles = Array.from({ length: count }, (_, i) => buildFakeProfile(i, centerLat, centerLng));

  let successCount = 0;
  let failCount = 0;

  for (const profile of profiles) {
    try {
      if (!isDryRun) {
        await insertProfileIntoDatabase(profile);
      } else {
        // In dry-run mode, just log a compact summary
        console.log(
          `  [DRY RUN] ${profile.displayName}, ${profile.age} · ` +
          `${profile.job} · ${profile.interests.slice(0, 2).join(', ')}…`
        );
      }
      successCount++;
    } catch (err) {
      console.error(`  ✗ Failed to insert profile #${successCount + failCount + 1}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n✅  Done. Seeded ${successCount}/${count} profiles.`);
  if (failCount > 0) {
    console.log(`⚠️   ${failCount} insertion(s) failed — check the errors above.`);
  }

  console.log('\n📋  To delete all seed data when you\'re done:');
  console.log('    node seedTestProfiles.js --cleanup\n');
}

main().catch(err => {
  console.error('\n❌  Seeder crashed:', err);
  process.exit(1);
});
