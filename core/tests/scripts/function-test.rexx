-- Test script for function parsing strategy improvements
-- 
-- Copyright (c) 2025 Paul Hammant
-- Licensed under the MIT License
say "Testing MAX function"
let result = MAX values="10,25,8,30,12"
say "MAX result:" result

say "Testing R_MAX function"
let r_result = R_MAX x="[1,2,3,4,5]"
say "R_MAX result:" r_result

say "Testing string concatenation"
say "hello" "world"