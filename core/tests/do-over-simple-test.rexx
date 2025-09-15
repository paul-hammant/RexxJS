#!/usr/bin/env rexx

// @description Test DO OVER functionality
//
// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

TestFunction1:
  SAY "TestFunction1 called"
RETURN

TestFunction2:
  SAY "TestFunction2 called"  
RETURN

/* Main test */
SAY "Testing DO OVER with SUBROUTINES()"

LET all_subs = SUBROUTINES()
SAY "All subroutines: " || all_subs

DO sub OVER all_subs
  SAY "Found subroutine: " || sub
  IF RIGHT(sub, 8) = "FUNCTION" THEN DO
    SAY "This is a test function: " || sub
  END
END

SAY "DO OVER test completed"
EXIT 0