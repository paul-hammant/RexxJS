-- Conditional cooking example
-- Check inventory and decide what to cook based on available ingredients
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

ADDRESS inventory
LET chickenStock = checkStock item=chicken
LET potatoStock = checkStock item=potatoes

IF chickenStock.quantity >= 3 THEN
  -- We have enough chicken for a main dish
  IF potatoStock.quantity >= 4 THEN
    -- Make a full meal with chicken and potatoes
    ADDRESS kitchen
    createMeal chicken=3 potatoes=4 spices=true
  ELSE
    -- Just make chicken without potatoes
    ADDRESS kitchen
    createMeal chicken=2 spices=true
  ENDIF
ELSE
  -- Not enough chicken, make a vegetarian dish
  IF potatoStock.quantity >= 5 THEN
    ADDRESS kitchen
    prepareDish name='Loaded Potato' servings=3
  ELSE
    ADDRESS kitchen
    prepareDish name='Simple Salad' servings=2
  ENDIF
ENDIF

-- Always finish with dessert if we made a meal
ADDRESS kitchen
LET mealCount = listMeals
IF mealCount.count > 0 THEN
  -- Make one dessert per meal created
  DO i = 1 TO mealCount.count
    prepareDish name='Dessert' servings=1
  END
ENDIF