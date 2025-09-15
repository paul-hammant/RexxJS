/**
 * Integration Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('../src/parser');
const { RexxInterpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('Rexx Script File Integration', () => {
  const scriptsDir = path.join(__dirname, 'scripts');
  let kitchenService;
  let addressSender;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    kitchenService.reset(); // Reset to test inventory values
    addressSender = kitchenService.createRpcClient();
  });
  
  // Helper function to read and execute a .rexx file
  async function executeRexxJSFile(filename) {
    const scriptPath = path.join(scriptsDir, filename);
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const commands = parse(scriptContent);
    const interpreter = new RexxInterpreter(addressSender);
    await interpreter.run(commands);
    return { commands, interpreter };
  }

  it('should execute simple-command.rexx', async () => {
    // Create some meals first
    await kitchenService.handleKitchenMethod('createMeal', { potatoes: 1 });
    await kitchenService.handleKitchenMethod('createMeal', { rice: 2 });
    
    const { commands } = await executeRexxJSFile('simple-command.rexx');
    
    expect(commands).toHaveLength(1);
    expect(commands[0].type).toBe('FUNCTION_CALL');
    expect(commands[0].command).toBe('listMeals');
    
    // The listMeals command should have been executed
    const result = await kitchenService.handleKitchenMethod('listMeals', {});
    expect(result.count).toBe(2);
  });

  it('should execute with-address.rexx and modify state correctly', async () => {
    await executeRexxJSFile('with-address.rexx');
    
    // Check that meals were created
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(2);
    
    // First meal should have potatoes and chicken
    expect(meals[0].ingredients).toEqual({
      potatoes: 2,
      chicken: 1
    });
    
    // Check that oven was preheated
    const appliances = kitchenService.getAppliances();
    expect(appliances.oven.status).toBe('heating');
    expect(appliances.oven.temperature).toBe(350);
    
    // Second meal should be the dish
    expect(meals[1].name).toBe('Roasted Vegetables');
    expect(meals[1].servings).toBe(4);
    
    // Check inventory was decremented
    const inventory = kitchenService.getInventory();
    expect(inventory.potatoes).toBe(8); // 10 - 2
    expect(inventory.chicken).toBe(4);  // 5 - 1
  });

  it('should execute with-variables.rexx with variable substitution', async () => {
    const { interpreter } = await executeRexxJSFile('with-variables.rexx');
    
    // Check that variables were stored
    expect(interpreter.getVariable('chickenStock')).toEqual({ 
      item: 'chicken', 
      quantity: 5 
    });
    expect(interpreter.getVariable('riceStock')).toEqual({ 
      item: 'rice', 
      quantity: 20 
    });
    
    // Script now uses conditionals - with chicken=5 >= 3, should take THEN branch
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(2);
    expect(meals[0].ingredients).toEqual({
      chicken: 3,  // Only uses 3 chicken due to conditional logic
      rice: 5
    });
    
    // Check the stored meal1 variable
    expect(interpreter.getVariable('meal1')).toMatchObject({
      id: 'meal-1',
      ingredients: { chicken: 3, rice: 5 }
    });
    
    // Rich dessert should be chosen since chicken (3) > 2
    expect(meals[1].name).toBe('Rich Dessert');
    expect(meals[1].servings).toBe(4);
    
    // Check final inventory
    const inventory = kitchenService.getInventory();
    expect(inventory.chicken).toBe(2);  // 5 - 3 used
    expect(inventory.rice).toBe(15);    // 20 - 5
  });

  it('should execute conditional-cooking.rexx with nested conditionals', async () => {
    const { interpreter } = await executeRexxJSFile('conditional-cooking.rexx');
    
    // With initial inventory (chicken=5, potatoes=10), should:
    // - Take first IF branch (chicken >= 3) 
    // - Take nested IF branch (potatoes >= 4)
    // - Create meal with chicken=3, potatoes=4, spices=1
    // - List meals (count > 0), so make dessert
    
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(2);
    
    // First meal should be the full meal
    expect(meals[0].ingredients).toEqual({
      chicken: 3,
      potatoes: 4,
      spices: 1
    });
    
    // Second should be first dessert (now makes one per meal)
    expect(meals[1].name).toBe('Dessert');
    expect(meals[1].servings).toBe(1);
    
    // Check inventory was decremented correctly
    const inventory = kitchenService.getInventory();
    expect(inventory.chicken).toBe(2);  // 5 - 3
    expect(inventory.potatoes).toBe(6); // 10 - 4
    expect(inventory.spices).toBe(29);  // 30 - 1
    
    // Check variables were stored
    expect(interpreter.getVariable('chickenStock')).toEqual({ 
      item: 'chicken', 
      quantity: 5 
    });
    expect(interpreter.getVariable('potatoStock')).toEqual({ 
      item: 'potatoes', 
      quantity: 10 
    });
  });

  it('should execute loop-examples.rexx with various loop types', async () => {
    const { interpreter } = await executeRexxJSFile('loop-examples.rexx');
    
    const meals = kitchenService.getMeals();
    
    // 3 breakfast dishes (i=1,2,3)
    // 4 chicken+potato meals (portions=2,4,6,8)  
    // 3 snacks
    // 4 combo meals (2x2 nested)
    // 5 meals based on chicken inventory (i=1,2,3,4,5)
    expect(meals).toHaveLength(19);
    
    // Check some specific meals
    expect(meals[0].name).toBe('Breakfast');
    expect(meals[0].servings).toBe(1);
    expect(meals[2].servings).toBe(3);
    
    // Check nested loop results
    const comboMeals = meals.filter(m => m.name === 'Combo Meal');
    expect(comboMeals).toHaveLength(4);
    
    // Check conditional meals within loop
    const lightMeals = meals.filter(m => m.name === 'Light Meal');
    const heartyMeals = meals.filter(m => m.name === 'Hearty Meal');
    expect(lightMeals).toHaveLength(3); // servings 1,2,3
    expect(heartyMeals).toHaveLength(2); // servings 4,5
    
    // Check variables were used
    expect(interpreter.getVariable('chickenCount')).toEqual({ item: 'chicken', quantity: 5 });
  });

  it('should list all .rexx files in scripts directory', () => {
    const files = fs.readdirSync(scriptsDir)
      .filter(file => file.endsWith('.rexx'));
    
    expect(files).toContain('simple-command.rexx');
    expect(files).toContain('with-address.rexx');
    expect(files).toContain('with-variables.rexx');
    expect(files).toContain('conditional-cooking.rexx');
    expect(files).toContain('loop-examples.rexx');
    expect(files).toContain('select-examples.rexx');
    expect(files).toContain('expression-examples.rexx');
  });

  it('should handle multi-line scripts with comments', async () => {
    const scriptContent = `
      -- Prepare a full dinner
      ADDRESS kitchen
      createMeal potatoes=3 chicken=2
      
      -- Set up the appliances
      ADDRESS appliance
      preheatOven temperature=425
      turnOnBurner burner=1
    `;
    
    const commands = parse(scriptContent);
    const interpreter = new RexxInterpreter(addressSender);
    await interpreter.run(commands);
    
    // Verify the meal was created
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      potatoes: 3,
      chicken: 2
    });
    
    // Verify appliances were configured
    const appliances = kitchenService.getAppliances();
    expect(appliances.oven.temperature).toBe(425);
    expect(appliances.stove.burners[0]).toBe(true);
  });

  it('should handle complex cooking workflow', async () => {
    const scriptContent = `
      -- Check what we have
      ADDRESS inventory
      LET chickenCount = checkStock item=chicken
      LET potatoCount = checkStock item=potatoes
      
      -- Prepare appliances
      ADDRESS appliance
      preheatOven temperature=400
      
      -- Cook the meal if we have enough ingredients
      ADDRESS kitchen
      createMeal chicken=2 potatoes=4 spices=true
      
      -- Check inventory after cooking
      ADDRESS inventory
      LET newChickenCount = checkStock item=chicken
    `;
    
    const commands = parse(scriptContent);
    const interpreter = new RexxInterpreter(addressSender);
    await interpreter.run(commands);
    
    // Verify variables
    expect(interpreter.getVariable('chickenCount').quantity).toBe(5);
    expect(interpreter.getVariable('potatoCount').quantity).toBe(10);
    expect(interpreter.getVariable('newChickenCount').quantity).toBe(3);
    
    // Verify meal creation
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      chicken: 2,
      potatoes: 4,
      spices: 1
    });
    
    // Verify oven state
    expect(kitchenService.getAppliances().oven.temperature).toBe(400);
  });

  it('should execute select-examples.rexx with multi-way branching', async () => {
    // Mock the day check to return a specific day
    const originalInventoryHandle = kitchenService.handleInventoryMethod;
    kitchenService.handleInventoryMethod = function(method, params) {
      if (method === 'checkStock') {
        if (params.item === 'dayOfWeek') {
          return 'Friday';
        }
        if (params.item === 'specialSpices') {
          return true; // Has special ingredients
        }
      }
      return originalInventoryHandle.call(this, method, params);
    };
    
    const { interpreter } = await executeRexxJSFile('select-examples.rexx');
    
    const meals = kitchenService.getMeals();
    
    // Should create multiple meals based on SELECT logic:
    // 1. Chicken meal (chicken=5 >= 3 but < 8, so moderate meal)
    // 2. Rice pudding dessert (rice=20 > 15)  
    // 3. Fish special (Friday)
    // 4. Gourmet creation + signature sauce (has special ingredients)
    expect(meals.length).toBeGreaterThanOrEqual(5);
    
    // Check first SELECT result - moderate chicken meal
    const mainMeal = meals.find(m => m.ingredients && m.ingredients.chicken === 3);
    expect(mainMeal).toBeDefined();
    expect(mainMeal.ingredients).toEqual({
      chicken: 3,
      potatoes: 2,
      rice: 5
    });
    
    // Check nested SELECT result - rice pudding (rice > 15)
    const dessert = meals.find(m => m.name === 'Rice Pudding');
    expect(dessert).toBeDefined();
    expect(dessert.servings).toBe(4);
    
    // Check day-based selection - Fish Special for Friday
    const fishSpecial = meals.find(m => m.name === 'Fish Special');
    expect(fishSpecial).toBeDefined();
    expect(fishSpecial.servings).toBe(5);
    
    // Check boolean condition - Gourmet Creation with special ingredients
    const gourmet = meals.find(m => m.name === 'Gourmet Creation');
    expect(gourmet).toBeDefined();
    expect(gourmet.servings).toBe(6);
    
    const sauce = meals.find(m => m.name === 'Signature Sauce');
    expect(sauce).toBeDefined();
    expect(sauce.servings).toBe(2);
    
    // Verify inventory was decremented correctly
    const inventory = kitchenService.getInventory();
    expect(inventory.chicken).toBe(2);  // 5 - 3 used in main meal
    expect(inventory.potatoes).toBe(8); // 10 - 2 used in main meal  
    expect(inventory.rice).toBe(15);    // 20 - 5 used in main meal
    
    // Verify variables were stored correctly
    expect(interpreter.getVariable('chickenStock')).toEqual({ 
      item: 'chicken', 
      quantity: 5 
    });
    expect(interpreter.getVariable('mealInfo').count).toBeGreaterThan(0);
    
    // Restore original handler
    kitchenService.handleInventoryMethod = originalInventoryHandle;
  });

  it('should execute expression-examples.rexx with mathematical calculations', async () => {
    // Add extra inventory for the large calculations in this test
    kitchenService.reset();
    const inventory = kitchenService.getInventory();
    inventory.potatoes = 100;  // Increase for large calculations
    inventory.chicken = 100;   // Increase for large calculations  
    inventory.rice = 100;      // Increase for large calculations
    
    const { interpreter } = await executeRexxJSFile('expression-examples.rexx');
    
    const meals = kitchenService.getMeals();
    
    // Should create multiple meals based on calculated expressions
    expect(meals.length).toBeGreaterThanOrEqual(10);
    
    // Check basic arithmetic variables
    expect(interpreter.getVariable('base')).toBe(10);
    expect(interpreter.getVariable('multiplier')).toBe(3);
    expect(interpreter.getVariable('addition')).toBe(15);        // 10 + 5
    expect(interpreter.getVariable('subtraction')).toBe(8);      // 10 - 2
    expect(interpreter.getVariable('multiplication')).toBe(30);  // 10 * 3
    expect(interpreter.getVariable('division')).toBe(5);         // 10 / 2
    
    // Check operator precedence
    expect(interpreter.getVariable('precedence')).toBe(22);      // 10 + (3 * 4)
    expect(interpreter.getVariable('withParens')).toBe(52);      // (10 + 3) * 4
    expect(interpreter.getVariable('complex')).toBe(22);         // 10 * 2 + 3 - 1 = 20 + 3 - 1
    
    // Check inventory-based calculations
    const totalStock = interpreter.getVariable('totalStock');
    // totalStock = chickenStock.quantity + potatoStock.quantity (after some consumption from earlier meals)
    expect(totalStock).toBeGreaterThan(150); // Should be close to 200 minus consumption
    expect(totalStock).toBeLessThan(200);
    
    const chickenPortion = interpreter.getVariable('chickenPortion');
    const potatoPortion = interpreter.getVariable('potatoPortion');
    expect(chickenPortion).toBeCloseTo(totalStock / 4, 1);  // totalStock / 4
    expect(potatoPortion).toBeCloseTo(totalStock / 6, 1);   // totalStock / 6
    
    // Check some specific meals were created
    const basicMeal = meals.find(m => m.name === 'Basic');
    expect(basicMeal).toBeDefined();
    expect(basicMeal.servings).toBe(15);  // addition = 15
    
    const complexMeal = meals.find(m => m.name === 'Complex');
    expect(complexMeal).toBeDefined();
    expect(complexMeal.servings).toBe(22);  // complex = 22
    
    // Check that meals were created with calculated ingredients
    const calculatedMeal = meals.find(m => m.ingredients && 
                                      Math.abs(m.ingredients.chicken - chickenPortion) < 0.01);
    expect(calculatedMeal).toBeDefined();
    expect(Math.abs(calculatedMeal.ingredients.potatoes - potatoPortion)).toBeLessThan(0.01);
    
    // Check nested expressions
    const nested = interpreter.getVariable('nested');
    const chickenStock = interpreter.getVariable('chickenStock');
    const potatoStock = interpreter.getVariable('potatoStock');
    const expectedNested = (chickenStock.quantity + 2) * (potatoStock.quantity - 3);
    expect(nested).toBe(expectedNested);
    
    // Check division results
    const evenDivision = interpreter.getVariable('evenDivision');
    const oddDivision = interpreter.getVariable('oddDivision');
    expect(evenDivision).toBe(totalStock / 5);        // totalStock / 5
    expect(oddDivision).toBeCloseTo((totalStock + 1) / 3, 1); // (totalStock + 1) / 3
    
    // Check feast quantity calculation  
    const feastQuantity = interpreter.getVariable('feastQuantity');
    const riceStock = interpreter.getVariable('riceStock');
    const expectedFeastQuantity = chickenStock.quantity + riceStock.quantity / 2;
    expect(feastQuantity).toBe(expectedFeastQuantity);
    
    // Should have created feast meals based on SELECT logic
    let feastMeal;
    let expectedServings;
    
    if (feastQuantity > 20) {
      feastMeal = meals.find(m => m.name === 'Grand Feast');
      expectedServings = feastQuantity / 4;
    } else if (feastQuantity > 10) {
      feastMeal = meals.find(m => m.name === 'Medium Feast');
      expectedServings = feastQuantity / 6;
    } else {
      feastMeal = meals.find(m => m.name === 'Simple Meal');
      expectedServings = feastQuantity / 8;
    }
    
    expect(feastMeal).toBeDefined();
    expect(feastMeal.servings).toBeCloseTo(expectedServings, 1);
    
    // Check loop-generated meals
    const loopMeals = meals.filter(m => m.name === 'Loop Meal');
    const expectedLoopCount = Math.floor(totalStock / 5);
    expect(loopMeals.length).toBe(expectedLoopCount);
    // Check that loop meals have correct servings pattern: i*2+1
    if (loopMeals.length > 0) {
      expect(loopMeals[0].servings).toBe(3); // i=1: 1*2+1 = 3
    }
    if (loopMeals.length > 1) {
      expect(loopMeals[1].servings).toBe(5); // i=2: 2*2+1 = 5
    }
    if (loopMeals.length > 2) {
      expect(loopMeals[2].servings).toBe(7); // i=3: 3*2+1 = 7
    }
    
    // Check adjusted total with negative number
    const adjustedTotal = interpreter.getVariable('adjustedTotal');
    const adjustment = interpreter.getVariable('adjustment');
    expect(adjustedTotal).toBe(totalStock + adjustment); // totalStock + (-2)
    
    const adjustedMeal = meals.find(m => m.name === 'Adjusted');
    expect(adjustedMeal).toBeDefined();
    expect(adjustedMeal.servings).toBe(adjustedTotal);
    
    // Verify inventory was properly accessed and used
    expect(interpreter.getVariable('chickenStock')).toEqual(expect.objectContaining({ 
      item: 'chicken'
    }));
    expect(interpreter.getVariable('potatoStock')).toEqual(expect.objectContaining({ 
      item: 'potatoes'
    }));
    
    // Verify quantities are reasonable (after consumption)
    expect(chickenStock.quantity).toBeGreaterThan(50);
    expect(chickenStock.quantity).toBeLessThan(100);
    expect(potatoStock.quantity).toBeGreaterThan(50);
    expect(potatoStock.quantity).toBeLessThan(100);
    expect(interpreter.getVariable('riceStock')).toEqual(expect.objectContaining({ 
      item: 'rice'
    }));
    expect(riceStock.quantity).toBeGreaterThan(50);
    expect(riceStock.quantity).toBeLessThanOrEqual(100);
  });
});