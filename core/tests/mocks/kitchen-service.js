/**
 * Mock Kitchen Service - A test implementation that maintains internal state
 * This simulates the "other side" of the RPC calls
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */
class MockKitchenService {
  constructor() {
    this.meals = [];
    this.dishes = [];
    this.inventory = {
      potatoes: 100,
      chicken: 100,
      rice: 100,
      vegetables: 100,
      spices: 100
    };
    this.appliances = {
      oven: { status: 'off', temperature: 0 },
      stove: { status: 'off', burners: [false, false, false, false] }
    };
    this.currentNamespace = 'kitchen';
  }

  /**
   * Create an Address Sender that dispatches to this service
   */
  createRpcClient() {
    return {
      send: async (namespace, method, params) => {
        // Route to appropriate handler based on namespace
        if (namespace === 'kitchen' || namespace === 'default') {
          return this.handleKitchenMethod(method, params);
        } else if (namespace === 'appliance') {
          return this.handleApplianceMethod(method, params);
        } else if (namespace === 'inventory') {
          return this.handleInventoryMethod(method, params);
        }
        
        throw new Error(`Unknown namespace: ${namespace}`);
      }
    };
  }

  handleKitchenMethod(method, params) {
    switch (method) {
      case 'createMeal': {
        const meal = {
          id: `meal-${this.meals.length + 1}`,
          timestamp: new Date().toISOString(),
          ingredients: {}
        };
        
        // Process ingredients from params
        if (params.potatoes) {
          const amount = (params.potatoes === true || params.potatoes === 'true') ? 1 : params.potatoes;
          if (this.inventory.potatoes >= amount) {
            this.inventory.potatoes -= amount;
            meal.ingredients.potatoes = amount;
          } else {
            throw new Error('Not enough potatoes in inventory');
          }
        }
        
        if (params.chicken) {
          if (this.inventory.chicken >= params.chicken) {
            this.inventory.chicken -= params.chicken;
            meal.ingredients.chicken = params.chicken;
          } else {
            throw new Error('Not enough chicken in inventory');
          }
        }
        
        if (params.rice) {
          if (this.inventory.rice >= params.rice) {
            this.inventory.rice -= params.rice;
            meal.ingredients.rice = params.rice;
          } else {
            throw new Error('Not enough rice in inventory');
          }
        }
        
        if (params.spices) {
          // Handle both boolean true and string 'true'
          const amount = (params.spices === true || params.spices === 'true') ? 1 : params.spices;
          if (this.inventory.spices >= amount) {
            this.inventory.spices -= amount;
            meal.ingredients.spices = amount;
          } else {
            throw new Error('Not enough spices in inventory');
          }
        }
        
        // Add note parameter if provided
        if (params.note !== undefined) {
          meal.note = params.note;
        }
        
        this.meals.push(meal);
        return meal;
      }
      
      case 'getMeal': {
        const meal = this.meals.find(m => m.id === params.id);
        if (!meal) {
          throw new Error(`Meal not found: ${params.id}`);
        }
        return meal;
      }
      
      case 'listMeals': {
        return { meals: this.meals, count: this.meals.length };
      }
      
      case 'prepareDish': {
        // Simpler method that just records the dish
        const dish = {
          id: `dish-${this.meals.length + 1}`,
          name: params.name || 'unnamed',
          servings: params.servings !== undefined ? params.servings : 1,
          prepTime: params.prepTime || 30
        };
        
        // Add time parameter if provided
        if (params.time !== undefined) {
          dish.time = params.time;
        }
        
        // Add note parameter if provided
        if (params.note !== undefined) {
          dish.note = params.note;
        }
        
        this.meals.push(dish);
        return dish;
      }
      
      case 'checkStock': {
        const item = params.item;
        if (this.inventory.hasOwnProperty(item)) {
          return {
            item: item,
            quantity: this.inventory[item]
          };
        } else {
          throw new Error(`Unknown inventory item: ${item}`);
        }
      }
      
      case 'status': {
        return {
          meals_prepared: this.meals.length,
          dishes_prepared: this.dishes.length,
          inventory_items: Object.keys(this.inventory).length,
          appliances_available: Object.keys(this.appliances).length
        };
      }
      
      default:
        throw new Error(`Unknown kitchen method: ${method}`);
    }
  }

  handleApplianceMethod(method, params) {
    switch (method) {
      case 'preheatOven': {
        this.appliances.oven.status = 'heating';
        this.appliances.oven.temperature = params.temperature || 350;
        return { 
          status: 'heating', 
          targetTemperature: this.appliances.oven.temperature,
          estimatedTime: 10 
        };
      }
      
      case 'turnOnBurner': {
        const burnerIndex = (params.burner || 1) - 1;
        if (burnerIndex >= 0 && burnerIndex < 4) {
          this.appliances.stove.burners[burnerIndex] = true;
          this.appliances.stove.status = 'on';
        }
        return { burner: params.burner || 1, status: 'on' };
      }
      
      case 'getOvenStatus': {
        return this.appliances.oven;
      }
      
      default:
        throw new Error(`Unknown appliance method: ${method}`);
    }
  }

  handleInventoryMethod(method, params) {
    switch (method) {
      case 'checkStock': {
        if (params.item) {
          return { 
            item: params.item, 
            quantity: this.inventory[params.item] || 0 
          };
        }
        return this.inventory;
      }
      
      case 'addStock': {
        const item = params.item;
        const quantity = params.quantity || 1;
        if (!this.inventory[item]) {
          this.inventory[item] = 0;
        }
        this.inventory[item] += quantity;
        return { 
          item: item, 
          newQuantity: this.inventory[item] 
        };
      }
      
      default:
        throw new Error(`Unknown inventory method: ${method}`);
    }
  }

  // Helper methods for assertions
  getMeals() {
    return this.meals;
  }

  getInventory() {
    return this.inventory;
  }

  getAppliances() {
    return this.appliances;
  }

  reset() {
    this.meals = [];
    this.inventory = {
      potatoes: 10,
      chicken: 5,
      rice: 20,
      vegetables: 15,
      spices: 30
    };
    this.appliances = {
      oven: { status: 'off', temperature: 0 },
      stove: { status: 'off', burners: [false, false, false, false] }
    };
  }
}

module.exports = { MockKitchenService };