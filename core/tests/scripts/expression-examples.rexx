-- Mathematical expression examples demonstrating arithmetic operations
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

-- Basic arithmetic operations in assignments
LET base = 10
LET multiplier = 3
LET addition = base + 5
LET subtraction = base - 2
LET multiplication = base * multiplier
LET division = base / 2

-- Operator precedence - should calculate as 10 + (3 * 4) = 22
LET precedence = base + multiplier * 4

-- Parentheses to override precedence - should calculate as (10 + 3) * 4 = 52
LET withParens = (base + multiplier) * 4

-- Complex expressions with multiple operations
LET complex = base * 2 + multiplier - 1

-- Using expressions in function parameters
ADDRESS kitchen
prepareDish name='Basic' servings=addition
prepareDish name='Complex' servings=complex
createMeal potatoes=precedence chicken=withParens/10

-- Expressions using inventory data
ADDRESS inventory
LET chickenStock = checkStock item=chicken
LET potatoStock = checkStock item=potatoes

-- Calculate total available ingredients
LET totalStock = chickenStock.quantity + potatoStock.quantity

-- Calculate portions based on ratios
LET chickenPortion = totalStock / 4
LET potatoPortion = totalStock / 6

ADDRESS kitchen
createMeal chicken=chickenPortion potatoes=potatoPortion

-- Nested expressions with parentheses
LET nested = (chickenStock.quantity + 2) * (potatoStock.quantity - 3)

-- Division with remainder considerations
LET evenDivision = totalStock / 5
LET oddDivision = (totalStock + 1) / 3

-- Create meals based on calculated values
prepareDish name='Even Portions' servings=evenDivision
prepareDish name='Odd Portions' servings=oddDivision

-- Complex calculation for special meal
LET specialRatio = (chickenStock.quantity * 2 + potatoStock.quantity) / 3
prepareDish name='Special Calculation' servings=specialRatio

-- Conditional expressions based on inventory levels
ADDRESS inventory
LET riceStock = checkStock item=rice

-- Calculate if we have enough for a feast
LET feastQuantity = chickenStock.quantity + riceStock.quantity / 2

SELECT
  WHEN feastQuantity > 20 THEN
    ADDRESS kitchen
    createMeal chicken=feastQuantity/3 rice=feastQuantity*2/3 spices=true
    prepareDish name='Grand Feast' servings=feastQuantity/4
  WHEN feastQuantity > 10 THEN
    ADDRESS kitchen
    createMeal chicken=feastQuantity/5 rice=feastQuantity/2
    prepareDish name='Medium Feast' servings=feastQuantity/6
  OTHERWISE
    ADDRESS kitchen
    prepareDish name='Simple Meal' servings=feastQuantity/8
END

-- Using expressions in DO loops
ADDRESS kitchen
DO i = 1 TO totalStock/5
  prepareDish name='Loop Meal' servings=i*2+1
END

-- Expressions with negative numbers
LET adjustment = -2
LET adjustedTotal = totalStock + adjustment
prepareDish name='Adjusted' servings=adjustedTotal