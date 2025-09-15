-- Test variable assignment and substitution with conditionals
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License
ADDRESS inventory
LET chickenStock = checkStock item=chicken
LET riceStock = checkStock item=rice

-- Use conditionals to decide what to cook
IF chickenStock.quantity >= 3 THEN
  ADDRESS kitchen
  createMeal chicken=3 rice=5
  LET meal1 = getMeal id="meal-1"
  -- Make dessert servings based on chicken amount
  IF meal1.ingredients.chicken > 2 THEN
    prepareDish name='Rich Dessert' servings=4
  ELSE
    prepareDish name='Light Dessert' servings=2
  ENDIF
ELSE
  ADDRESS kitchen
  prepareDish name='Rice Bowl' servings=3
ENDIF