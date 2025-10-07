/*! @rexxjs-meta=BATHHOUSE_FUNCTIONS_MAIN */

/**
 * Spirited Away Bathhouse Library
 * Test library for operation syntax (no parentheses) vs functions (with parentheses)
 *
 * Based on Ghibli's "Spirited Away" worldbuilding
 */

// Metadata provider function
function BATHHOUSE_FUNCTIONS_META() {
  return {
    canonical: "org.rexxjs.tests/bathhouse",
    type: "functions-library",
    name: 'Bathhouse Functions',
    version: '1.0.0',
    description: 'Spirited Away bathhouse management functions and operations',
    functions: {
      'GUEST_STATUS': { description: 'Get guest satisfaction status', params: ['guest'] },
      'COUNT_TOKENS': { description: 'Count issued work tokens', params: [] },
      'IDENTIFY_SPIRIT': { description: 'Identify spirit by description', params: ['description'] },
      'BATHHOUSE_CAPACITY': { description: 'Get max guest capacity', params: [] },
      'CLEANLINESS_LEVEL': { description: 'Get area cleanliness level', params: ['area'] },
      'SOOT_SPRITE_ENERGY': { description: 'Get soot sprite energy level', params: [] },
      'WORKER_COUNT': { description: 'Count registered workers', params: [] },
      'GET_LOG': { description: 'Get operation log', params: [] }
    },
    operations: {
      'SERVE_GUEST': { description: 'Serve a guest in specified bath', params: ['guest', 'bath'] },
      'CLEAN_BATHHOUSE': { description: 'Clean bathhouse area', params: ['area', 'intensity'] },
      'FEED_SOOT_SPRITES': { description: 'Feed soot sprites', params: ['treats', 'amount'] },
      'ISSUE_TOKEN': { description: 'Issue work token', params: ['worker', 'task'] },
      'RENAME_WORKER': { description: 'Rename a worker (Yubaba style)', params: ['from', 'to'] }
    },
    detectionFunction: 'BATHHOUSE_FUNCTIONS_MAIN'
  };
}

// Bathhouse state for testing
const bathhouse = {
  guests: new Map(),
  workers: new Map(),
  tokens: [],
  sootSprites: { count: 100, fed: false, energy: 50 },
  cleanliness: { main_hall: 70, bath_area: 80, boiler_room: 40 },
  log: []
};

// Operations (side effects, imperative actions)
const bathhouseOperations = {
  'SERVE_GUEST': function(params) {
    const { guest, bath = 'regular' } = params;
    bathhouse.guests.set(guest, { bath, served: true, satisfaction: 100 });
    bathhouse.log.push(`Served ${guest} in ${bath} bath`);
    return { success: true };
  },

  'CLEAN_BATHHOUSE': function(params) {
    const { area = 'main_hall', intensity = 'normal' } = params;
    const boost = intensity === 'deep' ? 30 : 20;
    bathhouse.cleanliness[area] = Math.min(100, (bathhouse.cleanliness[area] || 0) + boost);
    bathhouse.log.push(`Cleaned ${area} (intensity: ${intensity})`);
    return { success: true };
  },

  'FEED_SOOT_SPRITES': function(params) {
    const { treats = 'konpeito', amount = 1 } = params;
    bathhouse.sootSprites.fed = true;
    bathhouse.sootSprites.energy = Math.min(100, bathhouse.sootSprites.energy + (amount * 10));
    bathhouse.log.push(`Fed soot sprites ${amount} ${treats}`);
    return { success: true };
  },

  'ISSUE_TOKEN': function(params) {
    const { worker, task = 'cleaning' } = params;
    const token = { worker, task, issued: Date.now() };
    bathhouse.tokens.push(token);
    bathhouse.log.push(`Issued token to ${worker} for ${task}`);
    return { success: true };
  },

  'RENAME_WORKER': function(params) {
    const { from, to } = params;
    if (bathhouse.workers.has(from)) {
      const worker = bathhouse.workers.get(from);
      bathhouse.workers.delete(from);
      bathhouse.workers.set(to, { ...worker, originalName: from });
      bathhouse.log.push(`Renamed ${from} to ${to}`);
    }
    return { success: true };
  }
};

// Functions (return values, query state)
const bathhouseFunctions = {
  'GUEST_STATUS': function(guest) {
    const guestData = bathhouse.guests.get(guest);
    if (!guestData) return 'not_found';
    return guestData.served ? 'satisfied' : 'waiting';
  },

  'COUNT_TOKENS': function() {
    return bathhouse.tokens.length;
  },

  'IDENTIFY_SPIRIT': function(description) {
    const spirits = {
      'muddy': 'river_spirit',
      'hungry': 'no_face',
      'quiet': 'radish_spirit',
      'small_black': 'soot_sprite'
    };
    return spirits[description] || 'unknown_spirit';
  },

  'BATHHOUSE_CAPACITY': function() {
    return 50; // Max guests
  },

  'CLEANLINESS_LEVEL': function(area = 'main_hall') {
    return bathhouse.cleanliness[area] || 0;
  },

  'SOOT_SPRITE_ENERGY': function() {
    return bathhouse.sootSprites.energy;
  },

  'WORKER_COUNT': function() {
    return bathhouse.workers.size;
  },

  'GET_LOG': function() {
    return bathhouse.log.join('\n');
  }
};

// Reset function for tests
function resetBathhouse() {
  bathhouse.guests.clear();
  bathhouse.workers.clear();
  bathhouse.tokens = [];
  bathhouse.sootSprites = { count: 100, fed: false, energy: 50 };
  bathhouse.cleanliness = { main_hall: 70, bath_area: 80, boiler_room: 40 };
  bathhouse.log = [];
}

// Combine all functions and operations into single object for REQUIRE system
const bathhouseFunctionsAll = {
  // Detection function (required by REQUIRE system)
  'BATHHOUSE_FUNCTIONS_MAIN': () => BATHHOUSE_FUNCTIONS_META(),

  // Functions (return values)
  ...bathhouseFunctions,

  // Operations (side effects)
  ...bathhouseOperations
};

// Export for both REQUIRE system and direct testing
if (typeof module !== 'undefined' && module.exports) {
  // Node.js: Export both formats
  module.exports = bathhouseFunctionsAll;

  // Also export structured format for testing
  module.exports.name = 'bathhouse';
  module.exports.operations = bathhouseOperations;
  module.exports.functions = bathhouseFunctions;
  module.exports.resetBathhouse = resetBathhouse;
  module.exports.BATHHOUSE_FUNCTIONS_META = BATHHOUSE_FUNCTIONS_META;
} else if (typeof window !== 'undefined') {
  // Browser: Register globally
  Object.assign(window, bathhouseFunctionsAll);
  window.BATHHOUSE_FUNCTIONS_META = BATHHOUSE_FUNCTIONS_META;
}
