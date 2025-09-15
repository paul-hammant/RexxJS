-- DO loop examples demonstrating different loop types
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License

-- Simple range loop
DO i = 1 TO 3
  prepareDish name='Breakfast' servings=i
END

-- Range loop with step - use prepareDish to avoid inventory issues
DO portions = 2 TO 8 BY 2
  prepareDish name='Portion Meal' servings=portions
END

-- Repeat loop
DO 3
  prepareDish name='Snack' servings=1
END

-- Nested loops for combinations
DO meal = 1 TO 2
  DO side = 1 TO 2
    prepareDish name='Combo Meal' servings=meal time=side
  END
END

-- Loop using variables from inventory
ADDRESS inventory
LET chickenCount = checkStock item=chicken
ADDRESS kitchen
DO i = 1 TO chickenCount.quantity
  IF i <= 3 THEN
    prepareDish name='Light Meal' servings=i
  ELSE
    prepareDish name='Hearty Meal' servings=i
  ENDIF
END