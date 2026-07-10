// ─────────────────────────────────────────────
// Loviq Mock Data
// Wire up to real backend by replacing these with API calls
// ─────────────────────────────────────────────

export const MOCK_USER = {
  id: 'me_001',
  name: 'Alex',
  age: 26,
  bio: "Adventure seeker & coffee enthusiast ☕\nAlways up for a spontaneous road trip or finding the best hidden café in town. Let's make some memories.",
  location: 'New York, NY',
  distance: 0,
  photos: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
  ],
  interests: ['Coffee', 'Hiking', 'Photography', 'Travel', 'Cooking'],
  gender: 'Woman',
  interestedIn: 'Men',
  age_range: [24, 35],
  distance_range: 25,
  isPremium: false,
  joinedDate: '2024-01-15',
};

export const MOCK_PROFILES = [
  {
    id: 'p_001',
    name: 'Sofia',
    age: 25,
    bio: "Art director by day, stargazer by night 🌙\nI believe good design can change the world. Looking for someone who appreciates beauty in the everyday.",
    location: 'Brooklyn, NY',
    distance: 3,
    photos: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
      'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=600',
    ],
    interests: ['Art', 'Design', 'Astronomy', 'Jazz', 'Museums'],
    gender: 'Woman',
    isVerified: true,
    isOnline: true,
    job: 'Art Director',
    school: 'Parsons School of Design',
  },
  {
    id: 'p_002',
    name: 'Mia',
    age: 27,
    bio: "Chef 👨‍🍳 | Foodie 🍜 | Traveler ✈️\nIf you can't handle spice, we probably won't get along. Seeking my partner in crime for weekend farmers markets and 3am ramen runs.",
    location: 'Manhattan, NY',
    distance: 5,
    photos: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600',
    ],
    interests: ['Cooking', 'Travel', 'Wine', 'Yoga', 'Markets'],
    gender: 'Woman',
    isVerified: false,
    isOnline: false,
    job: 'Head Chef',
    school: 'Culinary Institute of America',
  },
  {
    id: 'p_003',
    name: 'Zara',
    age: 24,
    bio: "Bookworm 📚 | Dog mom 🐕 | Half marathon runner\nLooking for someone who won't judge me for spending Sundays in pajamas with my golden retriever and a good novel.",
    location: 'Queens, NY',
    distance: 8,
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600',
      'https://images.unsplash.com/photo-1496440543397-5b50c1ce02cf?w=600',
    ],
    interests: ['Reading', 'Running', 'Dogs', 'Coffee', 'Pottery'],
    gender: 'Woman',
    isVerified: true,
    isOnline: true,
    job: 'UX Researcher',
    school: 'Columbia University',
  },
  {
    id: 'p_004',
    name: 'Luna',
    age: 29,
    bio: "Musician & music teacher 🎸\nI write songs about people I've met and places I've been. Looking for someone who'll be worth writing about.",
    location: 'Williamsburg, NY',
    distance: 2,
    photos: [
      'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600',
      'https://images.unsplash.com/photo-1496440543397-5b50c1ce02cf?w=600',
    ],
    interests: ['Music', 'Guitar', 'Vinyl', 'Concerts', 'Writing'],
    gender: 'Woman',
    isVerified: true,
    isOnline: false,
    job: 'Music Teacher',
    school: 'NYU Steinhardt',
  },
  {
    id: 'p_005',
    name: 'Emma',
    age: 26,
    bio: "Yoga instructor ☮️ Plant parent 🌿 Sunset chaser\nMy love language is quality time and home-cooked meals. Let's explore the city and find our favourite coffee shop.",
    location: 'SoHo, NY',
    distance: 6,
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600',
    ],
    interests: ['Yoga', 'Plants', 'Meditation', 'Cooking', 'Sunsets'],
    gender: 'Woman',
    isVerified: false,
    isOnline: true,
    job: 'Yoga Instructor',
    school: 'Hunter College',
  },
];

export const MOCK_MATCHES = [
  {
    id: 'm_001',
    profile: MOCK_PROFILES[0],
    matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastMessage: {
      text: "Hey! I saw you like astronomy too 🌙",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
      sentByMe: false,
    },
  },
  {
    id: 'm_002',
    profile: MOCK_PROFILES[2],
    matchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    lastMessage: {
      text: "That sounds amazing! Which trail?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
      sentByMe: true,
    },
  },
  {
    id: 'm_003',
    profile: MOCK_PROFILES[3],
    matchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    lastMessage: null, // No message yet
  },
  {
    id: 'm_004',
    profile: MOCK_PROFILES[1],
    matchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastMessage: {
      text: "You HAVE to try their pasta 🍝",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isRead: true,
      sentByMe: false,
    },
  },
];

export const MOCK_MESSAGES = [
  {
    id: 'msg_001',
    matchId: 'm_001',
    text: "Hey! I saw you like astronomy too 🌙",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    sentByMe: false,
    read: true,
  },
  {
    id: 'msg_002',
    matchId: 'm_001',
    text: "Yes! I love stargazing. Have you ever been to the observatory?",
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    sentByMe: true,
    read: true,
  },
  {
    id: 'msg_003',
    matchId: 'm_001',
    text: "Not yet but it's been on my list forever! We should go sometime 😊",
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    sentByMe: false,
    read: true,
  },
  {
    id: 'msg_004',
    matchId: 'm_001',
    text: "That would be awesome! I'd love that",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    sentByMe: true,
    read: false,
  },
];

export const ALL_INTERESTS = [
  // Lifestyle
  { id: 'i_01', label: 'Coffee', emoji: '☕', category: 'Lifestyle' },
  { id: 'i_02', label: 'Travel', emoji: '✈️', category: 'Lifestyle' },
  { id: 'i_03', label: 'Yoga', emoji: '🧘', category: 'Lifestyle' },
  { id: 'i_04', label: 'Cooking', emoji: '🍳', category: 'Lifestyle' },
  { id: 'i_05', label: 'Wine', emoji: '🍷', category: 'Lifestyle' },
  // Sports
  { id: 'i_06', label: 'Hiking', emoji: '🥾', category: 'Sports' },
  { id: 'i_07', label: 'Running', emoji: '🏃', category: 'Sports' },
  { id: 'i_08', label: 'Gym', emoji: '💪', category: 'Sports' },
  { id: 'i_09', label: 'Cycling', emoji: '🚴', category: 'Sports' },
  { id: 'i_10', label: 'Swimming', emoji: '🏊', category: 'Sports' },
  // Arts
  { id: 'i_11', label: 'Photography', emoji: '📷', category: 'Arts' },
  { id: 'i_12', label: 'Music', emoji: '🎵', category: 'Arts' },
  { id: 'i_13', label: 'Art', emoji: '🎨', category: 'Arts' },
  { id: 'i_14', label: 'Reading', emoji: '📚', category: 'Arts' },
  { id: 'i_15', label: 'Writing', emoji: '✍️', category: 'Arts' },
  // Social
  { id: 'i_16', label: 'Concerts', emoji: '🎤', category: 'Social' },
  { id: 'i_17', label: 'Movies', emoji: '🎬', category: 'Social' },
  { id: 'i_18', label: 'Gaming', emoji: '🎮', category: 'Social' },
  { id: 'i_19', label: 'Dancing', emoji: '💃', category: 'Social' },
  { id: 'i_20', label: 'Foodie', emoji: '🍜', category: 'Social' },
  // Nature
  { id: 'i_21', label: 'Dogs', emoji: '🐕', category: 'Nature' },
  { id: 'i_22', label: 'Plants', emoji: '🌿', category: 'Nature' },
  { id: 'i_23', label: 'Astronomy', emoji: '🌙', category: 'Nature' },
  { id: 'i_24', label: 'Surfing', emoji: '🏄', category: 'Nature' },
  { id: 'i_25', label: 'Camping', emoji: '🏕️', category: 'Nature' },
  // Tech
  { id: 'i_26', label: 'Design', emoji: '🎯', category: 'Tech' },
  { id: 'i_27', label: 'Podcasts', emoji: '🎙️', category: 'Tech' },
  { id: 'i_28', label: 'Investing', emoji: '📈', category: 'Tech' },
];

export const PREMIUM_FEATURES = [
  { icon: '👀', title: 'See who liked you', description: 'Know exactly who wants to match before you swipe' },
  { icon: '⚡', title: 'Unlimited Likes', description: 'Never run out of likes again' },
  { icon: '🔄', title: 'Rewind', description: 'Undo your last swipe — everyone makes mistakes' },
  { icon: '🚀', title: '5 Boosts/month', description: 'Jump to the front of the queue in your area' },
  { icon: '⭐', title: '5 Super Likes/day', description: 'Stand out with a Super Like' },
  { icon: '🌍', title: 'Passport', description: 'Change your location and match anywhere in the world' },
  { icon: '🚫', title: 'No Ads', description: 'Clean, uninterrupted experience' },
  { icon: '🎯', title: 'Advanced Filters', description: 'Filter by height, education, religion, and more' },
];
