/**
 * Discworld Science Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { Interpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const fs = require('fs');
const path = require('path');

describe('Discworld Science Library Tests', () => {
  let interpreter;
  
  beforeEach(() => {
    interpreter = new Interpreter(null);

    // Set script path for relative path resolution in inline scripts
    // Simulates running from tests/discworld-science.spec.js
    interpreter.scriptPath = __filename;

    // Clear any previously loaded functions
    if (global.DISCWORLD_SCIENCE_MAIN) delete global.DISCWORLD_SCIENCE_MAIN;
    if (global.L_SPACE_DISTANCE) delete global.L_SPACE_DISTANCE;
    if (global.NARRATIVE_CAUSALITY) delete global.NARRATIVE_CAUSALITY;
    if (global.THAUMIC_RESONANCE) delete global.THAUMIC_RESONANCE;
    if (global.QUANTUM_WEATHER) delete global.QUANTUM_WEATHER;
  });

  test('should load contrived Discworld science functions and perform calculations', async () => {
    const script = `
      REQUIRE "./test-libs/discworld-science.js"
      
      -- Test L-Space library navigation
      LET distance = L_SPACE_DISTANCE library1="Unseen University" library2="British Museum" librarian_mood="ook"
      
      -- Test narrative causality for dramatic events
      LET causality = NARRATIVE_CAUSALITY event_description="Hero finds magical sword at crucial moment" character_importance=9 dramatic_timing="dramatically_inevitable"
      
      -- Test thaumic resonance with spell components
      LET components = JSON_PARSE text='["newt eye", "bat wing", "dramatic pause", 42]'
      LET resonance = THAUMIC_RESONANCE spell_components=components ambient_magic=1.5 moon_phase="eclipsed"
      
      -- Test quantum weather prediction
      LET weather = QUANTUM_WEATHER location="Ankh-Morpork" season="forge" narrative_requirements="dramatically_appropriate"
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify library functions are available
    expect(typeof global.DISCWORLD_SCIENCE_MAIN).toBe('function');
    expect(typeof global.L_SPACE_DISTANCE).toBe('function');
    expect(typeof global.NARRATIVE_CAUSALITY).toBe('function');
    expect(typeof global.THAUMIC_RESONANCE).toBe('function');
    expect(typeof global.QUANTUM_WEATHER).toBe('function');
    
    // Verify L-Space distance calculation
    const distance = interpreter.getVariable('distance');
    expect(distance.type).toBe('l_space_measurement');
    expect(distance.from).toBe('Unseen University');
    expect(distance.to).toBe('British Museum');
    expect(distance.librarian_mood).toBe('ook');
    expect(typeof distance.folded_distance).toBe('number');
    expect(distance.navigation_time).toMatch(/\d+ minutes, \d+ seconds/);
    expect(['Safe passage', 'Beware of Things From The Dungeon Dimensions']).toContain(distance.warning);
    
    // Verify narrative causality calculation
    const causality = interpreter.getVariable('causality');
    expect(causality.type).toBe('narrative_analysis');
    expect(causality.event).toBe('Hero finds magical sword at crucial moment');
    expect(causality.dramatic_timing).toBe('dramatically_inevitable');
    expect(typeof causality.probability_of_occurrence).toBe('number');
    expect(causality.probability_of_occurrence).toBeGreaterThan(0.8); // Should be very likely
    expect(causality.plot_armor_active).toBe(true);
    expect(['Heroic Fantasy', 'Adventure', 'Comedy', 'Tragedy']).toContain(causality.story_genre);
    
    // Verify thaumic resonance measurement
    const resonance = interpreter.getVariable('resonance');
    expect(resonance.type).toBe('thaumic_measurement');
    expect(Array.isArray(resonance.components)).toBe(true);
    expect(resonance.components).toContain('newt eye');
    expect(resonance.moon_phase).toBe('eclipsed');
    expect(typeof resonance.thaum_level).toBe('number');
    expect(resonance.thaum_level).toBeGreaterThan(0);
    expect(['Hedge Wizardry', 'Witchcraft', 'Wizardry', 'High Magic', 'Sourcery']).toContain(resonance.magic_class);
    expect(['Stable', 'HIGHLY UNSTABLE - EVACUATE AREA']).toContain(resonance.stability);
    
    // Verify quantum weather prediction
    const weather = interpreter.getVariable('weather');
    expect(weather.type).toBe('quantum_forecast');
    expect(weather.location).toBe('Ankh-Morpork');
    expect(weather.season).toBe('forge');
    expect(typeof weather.predicted_weather).toBe('string');
    expect(['Definitely maybe', 'Probably uncertain']).toContain(weather.quantum_certainty);
    expect(weather.observation_effect).toBe('Weather will change when observed');
    expect(['Bring umbrella and/or small boat', 'Umbrella optional']).toContain(weather.umbrella_recommendation);
    expect(weather.narrative_significance).toBe('High'); // Because we specified narrative requirements
  });

  test('should handle Discworld library detection function', async () => {
    const script = `
      REQUIRE "./test-libs/discworld-science.js"
      
      -- Test detection function by calling with no parameters
      LET library_info = DISCWORLD_SCIENCE_MAIN
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify detection function works
    const library_info = interpreter.getVariable('library_info');
    expect(library_info.type).toBe('library_info');
    expect(library_info.loaded).toBe(true);
    expect(library_info.functions).toContain('DISCWORLD_SCIENCE_MAIN');
    expect(library_info.functions).toContain('L_SPACE_DISTANCE');
    expect(library_info.functions).toContain('NARRATIVE_CAUSALITY');
    expect(library_info.functions).toContain('THAUMIC_RESONANCE');
    expect(library_info.functions).toContain('QUANTUM_WEATHER');
    expect(library_info.source).toBe('discworld-science-test');
    expect(library_info.author).toBe('The Librarian (ook ook)');
    expect(library_info.version).toBe('42.L');
  });

  test('should preserve clean namespace while maintaining compatibility', async () => {
    const script = `
      REQUIRE "./test-libs/discworld-science.js"
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify clean namespace object exists
    expect(typeof global['discworld-science']).toBe('object');
    expect(global['discworld-science']).not.toBeNull();
    
    // Verify namespace contains all functions
    expect(typeof global['discworld-science'].DISCWORLD_SCIENCE_MAIN).toBe('function');
    expect(typeof global['discworld-science'].L_SPACE_DISTANCE).toBe('function');
    expect(typeof global['discworld-science'].NARRATIVE_CAUSALITY).toBe('function');
    expect(typeof global['discworld-science'].THAUMIC_RESONANCE).toBe('function');
    expect(typeof global['discworld-science'].QUANTUM_WEATHER).toBe('function');
    
    // Verify individual functions are also available (for REQUIRE system compatibility)
    expect(typeof global.DISCWORLD_SCIENCE_MAIN).toBe('function');
    expect(typeof global.L_SPACE_DISTANCE).toBe('function');
    expect(typeof global.NARRATIVE_CAUSALITY).toBe('function');
    expect(typeof global.THAUMIC_RESONANCE).toBe('function');
    expect(typeof global.QUANTUM_WEATHER).toBe('function');
    
    // Verify they're the same functions (not duplicated)
    expect(global['discworld-science'].L_SPACE_DISTANCE).toBe(global.L_SPACE_DISTANCE);
    expect(global['discworld-science'].NARRATIVE_CAUSALITY).toBe(global.NARRATIVE_CAUSALITY);
    
    // Usage recommendation: prefer namespace access
    const distance = global['discworld-science'].L_SPACE_DISTANCE('Library A', 'Library B', 'ook');
    expect(distance.type).toBe('l_space_measurement');
    expect(distance.librarian_mood).toBe('ook');
  });

  test('should handle error conditions in Discworld functions', async () => {
    const script = `
      REQUIRE "./test-libs/discworld-science.js"
      
      -- This should fail because both libraries are required
      LET bad_distance = L_SPACE_DISTANCE library1="Only One Library"
    `;
    
    const commands = parse(script);
    
    // Should throw error with appropriate Discworld-style message
    await expect(interpreter.run(commands)).rejects.toThrow('Both libraries must be specified for interdimensional navigation');
  });

  test('should demonstrate the absurdity works in practice', async () => {
    const script = `
      REQUIRE "./test-libs/discworld-science.js"
      
      -- Calculate if a rubber duck will spontaneously appear during high magic
      LET high_magic_components = JSON_PARSE text='["dragon scale", "phoenix feather", "concentrated narrative", 99]'
      LET dangerous_magic = THAUMIC_RESONANCE spell_components=high_magic_components ambient_magic=2.0 moon_phase="eclipsed"
      
      -- Predict weather for the inevitable final confrontation
      LET epic_weather = QUANTUM_WEATHER location="Tower of Art" season="spring" narrative_requirements="dramatically_appropriate"
      
      -- Calculate probability of hero surviving based on narrative weight
      LET hero_survival = NARRATIVE_CAUSALITY event_description="Inexperienced farm boy must defeat ancient evil overlord" character_importance=10 dramatic_timing="perfect"
    `;
    
    const commands = parse(script);
    await interpreter.run(commands);
    
    // Verify that high-level magic has appropriate warnings
    const dangerous_magic = interpreter.getVariable('dangerous_magic');
    if (dangerous_magic.thaum_level > 75) {
      expect(dangerous_magic.side_effects).toContain('Rubber duck manifestation');
      expect(dangerous_magic.side_effects).toContain('Spontaneous poetry');
      expect(dangerous_magic.side_effects).toContain('Temporary color changes');
    }
    
    // Verify epic weather is appropriately dramatic (allow for quantum randomness)
    const epic_weather = interpreter.getVariable('epic_weather');
    expect(typeof epic_weather.predicted_weather).toBe('string');
    expect(epic_weather.predicted_weather.length).toBeGreaterThan(0);
    expect(epic_weather.narrative_significance).toBe('High');
    
    // Verify hero has plot armor
    const hero_survival = interpreter.getVariable('hero_survival');
    expect(hero_survival.plot_armor_active).toBe(true);
    expect(hero_survival.story_genre).toBe('Heroic Fantasy');
    expect(hero_survival.probability_of_occurrence).toBeGreaterThan(0.9); // Heroes always win
  });
});