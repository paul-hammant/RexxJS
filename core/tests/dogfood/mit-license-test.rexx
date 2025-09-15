#!/usr/bin/env ./rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

REQUIRE "expectations-address"
    
/* Rexx test to verify the MIT license file */

/* Read the entire LICENSE file (one directory up from core/) */
LET license_result = FILE_READ("../LICENSE")
LET license_content = license_result.content

/* Split content into lines using MODERN_SPLIT */
LET license_lines = MODERN_SPLIT(license_content, "\n")

/* Get first line - canonical array access */
LET first_line = license_lines[0]

ADDRESS EXPECTATIONS
"{first_line} should equal 'MIT License'"
