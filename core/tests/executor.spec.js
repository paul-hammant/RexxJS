/**
 * Executor Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const fs = require('fs');
const path = require('path');
const { executeScript } = require('../src/executor');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('Rexx Script Executor', () => {
  let kitchenService;
  let addressSender;

  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
  });

  it('should execute a script from string', async () => {
    const script = `
      ADDRESS inventory
      LET stock = checkStock item=potatoes
      ADDRESS kitchen
      createMeal potatoes=stock.quantity rice=2
    `;
    
    const interpreter = await executeScript(script, addressSender);
    
    // Check variable was stored
    expect(interpreter.getVariable('stock')).toEqual({ 
      item: 'potatoes', 
      quantity: 100 
    });
    
    // Check meal was created using all potatoes
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      potatoes: 100,
      rice: 2
    });
    
    // Check inventory was updated
    expect(kitchenService.getInventory().potatoes).toBe(0);
    expect(kitchenService.getInventory().rice).toBe(98);
  });

  it('should execute a script from file', async () => {
    const scriptPath = path.join(__dirname, 'scripts', 'simple-command.rexx');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Add some meals first
    await kitchenService.handleKitchenMethod('createMeal', { rice: 1 });
    
    await executeScript(scriptContent, addressSender);
    
    // listMeals should have been executed
    const result = await kitchenService.handleKitchenMethod('listMeals', {});
    expect(result.count).toBe(1);
  });

  it('should handle complex script execution with state management', async () => {
    const script = `
      -- Initialize kitchen
      ADDRESS kitchen
      prepareDish name='Appetizer' servings=2
      
      -- Switch to inventory management
      ADDRESS inventory
      addStock item=chicken quantity=3
      LET newStock = checkStock item=chicken
      
      -- Switch back and create meal with new stock
      ADDRESS kitchen
      createMeal chicken=newStock.quantity potatoes=2 spices=true
    `;
    
    const interpreter = await executeScript(script, addressSender);
    
    // Verify dishes/meals were created
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(2);
    
    // First item: appetizer
    expect(meals[0].name).toBe('Appetizer');
    expect(meals[0].servings).toBe(2);
    
    // Second item: meal with all chicken (100 original + 3 added = 103)
    expect(meals[1].ingredients).toEqual({
      chicken: 103,
      potatoes: 2,
      spices: 1
    });
    
    // Verify variable storage
    expect(interpreter.getVariable('newStock')).toEqual({
      item: 'chicken',
      quantity: 103
    });
    
    // Verify final inventory
    const inventory = kitchenService.getInventory();
    expect(inventory.chicken).toBe(0);  // All 103 used
    expect(inventory.potatoes).toBe(98);  // 100 - 2
    expect(inventory.spices).toBe(99);   // 100 - 1
  });

  it('should handle appliance operations', async () => {
    const script = `
      -- Set up cooking environment
      ADDRESS appliance
      preheatOven temperature=375
      turnOnBurner burner=2
      LET ovenStatus = getOvenStatus()
      
      -- Prepare meal while oven heats
      ADDRESS kitchen
      createMeal potatoes=3 chicken=1
    `;
    
    const interpreter = await executeScript(script, addressSender);
    
    // Verify appliance state
    const appliances = kitchenService.getAppliances();
    expect(appliances.oven.status).toBe('heating');
    expect(appliances.oven.temperature).toBe(375);
    expect(appliances.stove.burners[1]).toBe(true);  // burner 2 is index 1
    
    // Verify oven status was stored
    expect(interpreter.getVariable('ovenStatus')).toEqual({
      status: 'heating',
      temperature: 375
    });
    
    // Verify meal was created
    const meals = kitchenService.getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0].ingredients).toEqual({
      potatoes: 3,
      chicken: 1
    });
  });
});