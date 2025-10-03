/*!
 * Terry Pratchett's Discworld Science Library
 * Functions for advanced thaumic calculations and narrative imperative analysis
 * @rexxjs-meta=DISCWORLD_SCIENCE_MAIN
 *
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Primary detection function (required naming pattern: LIBRARY_NAME_MAIN)
function DISCWORLD_SCIENCE_MAIN(library1, library2, librarian_mood = "ook") {
  if (arguments.length === 0) {
    return {
      type: 'library_info',
      loaded: true,
      functions: ['DISCWORLD_SCIENCE_MAIN', 'L_SPACE_DISTANCE', 'NARRATIVE_CAUSALITY', 'THAUMIC_RESONANCE', 'QUANTUM_WEATHER'],
      source: 'discworld-science-test',
      author: 'The Librarian (ook ook)',
      version: '42.L'
    };
  }
  
  // Delegate to L_SPACE_DISTANCE for actual functionality
  return L_SPACE_DISTANCE(library1, library2, librarian_mood);
}

// Calculate L-Space distances between libraries (main functionality)
function L_SPACE_DISTANCE(library1, library2, librarian_mood = "ook") {
  
  if (!library1 || !library2) {
    throw new Error('L_SPACE_DISTANCE: Both libraries must be specified for interdimensional navigation');
  }
  
  // Calculate using advanced L-Space geometry
  const l1_entropy = library1.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const l2_entropy = library2.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  
  // Apply librarian mood coefficient
  const mood_multiplier = librarian_mood === "ook" ? 1.0 : 
                         librarian_mood === "eek" ? 2.3 : 
                         1.618; // golden ratio for neutral mood
  
  const raw_distance = Math.abs(l1_entropy - l2_entropy) * mood_multiplier;
  const folded_distance = raw_distance % 2001; // Space folds every 2001 units
  
  return {
    type: 'l_space_measurement',
    from: library1,
    to: library2,
    raw_distance: raw_distance,
    folded_distance: folded_distance,
    librarian_mood: librarian_mood,
    navigation_time: `${Math.floor(folded_distance / 42)} minutes, ${folded_distance % 42} seconds`,
    warning: folded_distance > 1000 ? "Beware of Things From The Dungeon Dimensions" : "Safe passage"
  };
}

// Calculate narrative causality coefficient for plot events
function NARRATIVE_CAUSALITY(event_description, character_importance = 5, dramatic_timing = "perfect") {
  if (!event_description) {
    throw new Error('NARRATIVE_CAUSALITY: Event description required for narrative analysis');
  }
  
  // Measure narrative weight using advanced plot mathematics
  const base_weight = event_description.length * character_importance;
  
  // Apply dramatic timing modifiers
  const timing_coefficients = {
    "terrible": 0.1,
    "poor": 0.3,
    "adequate": 0.7,
    "good": 1.0,
    "perfect": 1.618,
    "dramatically_inevitable": Math.PI
  };
  
  const timing_modifier = timing_coefficients[dramatic_timing] || 1.0;
  const causality_index = base_weight * timing_modifier;
  
  // Calculate probability using narrative physics
  const probability = Math.min(causality_index / 1000, 0.95); // Nothing is ever 100% certain
  
  return {
    type: 'narrative_analysis',
    event: event_description,
    causality_index: causality_index,
    probability_of_occurrence: probability,
    dramatic_timing: dramatic_timing,
    narrative_weight: base_weight,
    plot_armor_active: probability > 0.8,
    story_genre: probability > 0.9 ? "Heroic Fantasy" : 
                probability > 0.6 ? "Adventure" : 
                probability > 0.3 ? "Comedy" : "Tragedy"
  };
}

// Measure thaumic field resonance for magical calculations
function THAUMIC_RESONANCE(spell_components, ambient_magic = 1.0, moon_phase = "full") {
  if (!Array.isArray(spell_components) || spell_components.length === 0) {
    throw new Error('THAUMIC_RESONANCE: Spell components array required for thaumic analysis');
  }
  
  // Calculate base thaumic signature
  const component_sum = spell_components.reduce((sum, component) => {
    return sum + (typeof component === 'string' ? component.length : Number(component) || 0);
  }, 0);
  
  // Apply lunar modifiers (moon phase affects magical potency)
  const lunar_modifiers = {
    "new": 0.3,
    "waxing": 0.7,
    "full": 1.5,
    "waning": 0.8,
    "eclipsed": Math.E // Special case for magical eclipses
  };
  
  const lunar_multiplier = lunar_modifiers[moon_phase] || 1.0;
  const raw_thaumic_level = component_sum * ambient_magic * lunar_multiplier;
  
  // Normalize to thaum scale (0-100 thaums)
  const thaum_level = Math.min(raw_thaumic_level / 10, 100);
  
  // Determine magical classification
  let magic_class = "Hedge Wizardry";
  if (thaum_level > 80) magic_class = "Sourcery";
  else if (thaum_level > 60) magic_class = "High Magic";
  else if (thaum_level > 40) magic_class = "Wizardry";
  else if (thaum_level > 20) magic_class = "Witchcraft";
  
  return {
    type: 'thaumic_measurement',
    components: spell_components,
    thaum_level: thaum_level,
    magic_class: magic_class,
    moon_phase: moon_phase,
    stability: thaum_level < 90 ? "Stable" : "HIGHLY UNSTABLE - EVACUATE AREA",
    side_effects: thaum_level > 75 ? ["Temporary color changes", "Spontaneous poetry", "Rubber duck manifestation"] : []
  };
}

// Predict quantum weather patterns (because Discworld weather is quantum)
function QUANTUM_WEATHER(location, season = "spring", narrative_requirements = "none") {
  if (!location) {
    throw new Error('QUANTUM_WEATHER: Location required for quantum meteorological prediction');
  }
  
  // Calculate base weather probability matrix
  const location_entropy = location.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const seasonal_modifier = {
    "spring": 1.2,
    "summer": 0.8,
    "autumn": 1.0,
    "winter": 1.5,
    "forge": 2.0 // Special Discworld season
  }[season] || 1.0;
  
  // Apply narrative weather requirements
  const weather_types = [
    "Sunny with chance of narrative irony",
    "Dramatically appropriate storms", 
    "Unseasonably pleasant (suspicious)",
    "Raining cats and dogs (literally)",
    "Quantum precipitation",
    "Temporally displaced weather from next Tuesday"
  ];
  
  if (narrative_requirements !== "none") {
    weather_types.push(`${narrative_requirements} weather as required by plot`);
  }
  
  const quantum_index = (location_entropy * seasonal_modifier) % weather_types.length;
  const selected_weather = weather_types[Math.floor(quantum_index)];
  
  // Calculate probability collapse
  const certainty = Math.random() > 0.5 ? "Definitely maybe" : "Probably uncertain";
  
  return {
    type: 'quantum_forecast',
    location: location,
    season: season,
    predicted_weather: selected_weather,
    quantum_certainty: certainty,
    observation_effect: "Weather will change when observed",
    umbrella_recommendation: quantum_index > 3 ? "Bring umbrella and/or small boat" : "Umbrella optional",
    narrative_significance: narrative_requirements !== "none" ? "High" : "Moderate"
  };
}

// Create the library namespace object (matches REQUIRE string)
const DiscworldScience = {
  // Detection function (required for REQUIRE system)
  DISCWORLD_SCIENCE_MAIN,
  
  // Public API functions
  L_SPACE_DISTANCE,
  NARRATIVE_CAUSALITY,
  THAUMIC_RESONANCE,
  QUANTUM_WEATHER
};

// Export to global scope for browser/Node.js compatibility
if (typeof window !== 'undefined') {
  // Browser environment - preserve clean namespace (matches REQUIRE string)
  window['discworld-science'] = DiscworldScience;
  
  // Export individual functions for REQUIRE system compatibility (unfortunately necessary)
  window.DISCWORLD_SCIENCE_MAIN = DISCWORLD_SCIENCE_MAIN;
  window.L_SPACE_DISTANCE = L_SPACE_DISTANCE;
  window.NARRATIVE_CAUSALITY = NARRATIVE_CAUSALITY;
  window.THAUMIC_RESONANCE = THAUMIC_RESONANCE;
  window.QUANTUM_WEATHER = QUANTUM_WEATHER;
  
  // Self-register with the library detection system
  if (typeof window.registerLibraryDetectionFunction === 'function') {
    window.registerLibraryDetectionFunction('discworld-science', 'DISCWORLD_SCIENCE_MAIN');
  }
} else if (typeof global !== 'undefined') {
  // Node.js environment - preserve clean namespace (matches REQUIRE string)
  global['discworld-science'] = DiscworldScience;
  
  // Export individual functions for REQUIRE system compatibility (unfortunately necessary)
  global.DISCWORLD_SCIENCE_MAIN = DISCWORLD_SCIENCE_MAIN;
  global.L_SPACE_DISTANCE = L_SPACE_DISTANCE;
  global.NARRATIVE_CAUSALITY = NARRATIVE_CAUSALITY;
  global.THAUMIC_RESONANCE = THAUMIC_RESONANCE;
  global.QUANTUM_WEATHER = QUANTUM_WEATHER;
  
  // Self-register with the library detection system
  if (typeof global.registerLibraryDetectionFunction === 'function') {
    global.registerLibraryDetectionFunction('discworld-science', 'DISCWORLD_SCIENCE_MAIN');
  }
}

// Module export for testing frameworks
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiscworldScience;
}