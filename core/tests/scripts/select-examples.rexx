-- SELECT/WHEN/OTHERWISE/END examples demonstrating multi-way branching
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

-- Check inventory and decide meal type based on available ingredients
ADDRESS inventory
LET chickenStock = checkStock item=chicken
LET potatoStock = checkStock item=potatoes
LET riceStock = checkStock item=rice

-- Select meal type based on chicken availability
ADDRESS kitchen
SELECT
  WHEN chickenStock.quantity >= 8 THEN
    -- Plenty of chicken - make a feast
    createMeal chicken=6 potatoes=4 spices=true
    prepareDish name='Victory Feast' servings=8
  WHEN chickenStock.quantity >= 3 THEN
    -- Moderate chicken - make a regular meal
    createMeal chicken=3 potatoes=2 rice=5
  WHEN chickenStock.quantity >= 1 THEN
    -- Low chicken - make a light meal with rice
    createMeal chicken=1 rice=8 spices=true
  OTHERWISE
    -- No chicken - vegetarian option
    prepareDish name='Vegetarian Special' servings=6
END

-- Nested SELECT for dessert choice based on meal count and rice availability
ADDRESS kitchen
LET mealInfo = listMeals

SELECT
  WHEN mealInfo.count > 0 THEN
    -- We made a meal, now choose dessert based on rice stock
    SELECT
      WHEN riceStock.quantity > 15 THEN
        prepareDish name='Rice Pudding' servings=4
      WHEN riceStock.quantity > 5 THEN
        prepareDish name='Simple Dessert' servings=2
      OTHERWISE
        prepareDish name='Fruit Bowl' servings=3
    END
  OTHERWISE
    -- No meals made, no dessert needed
    prepareDish name='Emergency Snack' servings=1
END

-- Day-based menu selection using string comparison
ADDRESS inventory
LET dayType = checkStock item=dayOfWeek

ADDRESS kitchen
SELECT
  WHEN dayType = 'Friday' THEN
    prepareDish name='Fish Special' servings=5
  WHEN dayType = 'Saturday' THEN
    prepareDish name='Weekend Brunch' servings=8
  WHEN dayType = 'Sunday' THEN
    prepareDish name='Sunday Roast' servings=10
  OTHERWISE
    prepareDish name='Weekday Special' servings=4
END

-- Boolean condition SELECT for special ingredients
ADDRESS inventory  
LET hasSpecialIngredients = checkStock item=specialSpices

ADDRESS kitchen
SELECT
  WHEN hasSpecialIngredients THEN
    prepareDish name='Gourmet Creation' servings=6
    prepareDish name='Signature Sauce' servings=2
  OTHERWISE
    prepareDish name='Classic Dish' servings=4
END