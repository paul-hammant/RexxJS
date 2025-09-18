#!/bin/bash

set -e

# Initialize statistics
TOTAL_JEST_SUITES=0
TOTAL_JEST_TESTS=0
TOTAL_JEST_PASSED=0
TOTAL_JEST_FAILED=0
TOTAL_REXXT_FILES=0
TOTAL_REXXT_TESTS=0
TOTAL_REXXT_EXPECTATIONS=0
JEST_MODULES=()
REXXT_MODULES=()
SKIPPED_MODULES=()

# Function to extract Jest stats from output
extract_jest_stats() {
  local output="$1"
  local module="$2"
  local module_path="$3"
  local temp_file="$4"
  
  # Extract test suites from Jest output
  local suites_line=$(echo "$output" | grep -E "Test Suites:" | tail -1)
  local passed_suites=0
  local failed_suites=0
  
  if [[ "$suites_line" =~ Test\ Suites:\ ([0-9]+)\ passed ]]; then
    passed_suites=${BASH_REMATCH[1]}
  elif [[ "$suites_line" =~ Test\ Suites:\ ([0-9]+)\ failed,\ ([0-9]+)\ passed ]]; then
    failed_suites=${BASH_REMATCH[1]}
    passed_suites=${BASH_REMATCH[2]}
  fi
  
  # Extract tests from Jest output
  local tests_line=$(echo "$output" | grep -E "Tests:" | tail -1)
  local passed_tests=0
  local failed_tests=0
  
  if [[ "$tests_line" =~ Tests:\ +([0-9]+)\ passed ]]; then
    passed_tests=${BASH_REMATCH[1]}
  elif [[ "$tests_line" =~ Tests:\ +([0-9]+)\ failed,\ ([0-9]+)\ passed ]]; then
    failed_tests=${BASH_REMATCH[1]}
    passed_tests=${BASH_REMATCH[2]}
  fi
  
  # Extract duration from Jest output
  local duration_line=$(echo "$output" | grep -E "Time:" | tail -1)
  local duration=""
  if [[ "$duration_line" =~ Time:.*([0-9]+\.?[0-9]*\ s) ]]; then
    duration=${BASH_REMATCH[1]}
  fi
  
  # Default to 0 if extraction failed
  passed_suites=${passed_suites:-0}
  failed_suites=${failed_suites:-0}
  passed_tests=${passed_tests:-0}
  failed_tests=${failed_tests:-0}
  
  local total_suites=$((passed_suites + failed_suites))
  local total_tests=$((passed_tests + failed_tests))
  
  TOTAL_JEST_SUITES=$((TOTAL_JEST_SUITES + total_suites))
  TOTAL_JEST_TESTS=$((TOTAL_JEST_TESTS + total_tests))
  TOTAL_JEST_PASSED=$((TOTAL_JEST_PASSED + passed_tests))
  TOTAL_JEST_FAILED=$((TOTAL_JEST_FAILED + failed_tests))
  
  # Output temp file content if there were failures
  if [ "$failed_tests" -gt 0 ] && [ -f "$temp_file" ]; then
    echo "❌ Test failures in $module:"
    cat "$temp_file"
  fi
  
  if [ -n "$duration" ]; then
    JEST_MODULES+=("$module_path: $passed_tests/$total_tests tests ($duration)")
  else
    JEST_MODULES+=("$module_path: $passed_tests/$total_tests tests")
  fi
}

# Function to extract rexxt stats from output
extract_rexxt_stats() {
  local output="$1"
  local module="$2"
  local module_path="$3"
  local temp_file="$4"
  
  # Extract files, tests, and expectations from rexxt summary
  local files=$(echo "$output" | grep "test sources executed" | sed -E 's/.*([0-9]+) test sources executed.*/\1/' | tail -1)
  local tests=$(echo "$output" | grep -E "[0-9]+ tests" | sed -E 's/.*([0-9]+) tests.*/\1/' | tail -1)
  local expectations=$(echo "$output" | grep "expectations executed" | sed -E 's/.*([0-9]+) expectations executed.*/\1/' | tail -1)
  
  files=${files:-0}
  tests=${tests:-0}
  expectations=${expectations:-0}
  
  TOTAL_REXXT_FILES=$((TOTAL_REXXT_FILES + files))
  TOTAL_REXXT_TESTS=$((TOTAL_REXXT_TESTS + tests))
  TOTAL_REXXT_EXPECTATIONS=$((TOTAL_REXXT_EXPECTATIONS + expectations))
  
  if [ "$files" -gt 0 ]; then
    REXXT_MODULES+=("$module_path: $files files, $tests tests, $expectations expectations")
  fi
  
  # Check for rexxt failures (look for error patterns in output)
  if echo "$output" | grep -q -E "(Error|FAIL|failed|exception)" && [ -f "$temp_file" ]; then
    echo "❌ Rexxt failures in $module:"
    cat "$temp_file"
  fi
}

echo "🚀 Starting CI pipeline..."
echo "========================="

# Run core tests
echo "📦 Running core tests..."
cd core/
CORE_JEST_TEMP=$(mktemp)
CORE_JEST_OUTPUT=$(npx jest 2>&1 | tee "$CORE_JEST_TEMP")
extract_jest_stats "$CORE_JEST_OUTPUT" "core" "$(pwd)" "$CORE_JEST_TEMP"
rm -f "$CORE_JEST_TEMP"

CORE_REXXT_TEMP=$(mktemp)
CORE_REXXT_OUTPUT=$(./rexxt tests/dogfood/* 2>&1 | tee "$CORE_REXXT_TEMP")
extract_rexxt_stats "$CORE_REXXT_OUTPUT" "core/dogfood" "$(pwd)" "$CORE_REXXT_TEMP"
rm -f "$CORE_REXXT_TEMP"
cd ..

echo ""
echo "📁 Running extras/functions tests..."

# Iterate over each subdirectory in extras/functions and run tests
for dir in extras/functions/*/; do
  dirname=$(basename "$dir")
  if [ "$dirname" = "r-inspired" ] || [ "$dirname" = "scipy-inspired" ]; then
    # Handle directories with subdirectories (r-inspired, scipy-inspired)
    for subdir in "$dir"*/; do
      if [ -d "$subdir" ]; then
        subdirname=$(basename "$subdir")
        echo "  🧪 Testing $dirname/$subdirname..."
        cd "$subdir"
        if [ -f "package.json" ]; then
          MODULE_JEST_TEMP=$(mktemp)
          MODULE_JEST_OUTPUT=$(npm test 2>&1 | tee "$MODULE_JEST_TEMP")
          extract_jest_stats "$MODULE_JEST_OUTPUT" "$dirname/$subdirname" "$(pwd)" "$MODULE_JEST_TEMP"
          rm -f "$MODULE_JEST_TEMP"
        fi
        if ls *test.rexx 1> /dev/null 2>&1; then
          MODULE_REXXT_TEMP=$(mktemp)
          MODULE_REXXT_OUTPUT=$(../../../core/rexxt *test.rexx 2>&1 | tee "$MODULE_REXXT_TEMP")
          extract_rexxt_stats "$MODULE_REXXT_OUTPUT" "$dirname/$subdirname" "$(pwd)" "$MODULE_REXXT_TEMP"
          rm -f "$MODULE_REXXT_TEMP"
        fi
        cd - > /dev/null
      fi
    done
  else
    # Handle other function directories normally
    cd "$dir"
    # Skip empty directories
    if [ "$(ls -A .)" ]; then
      echo "  🧪 Testing $dirname..."
      MODULE_JEST_TEMP=$(mktemp)
      MODULE_JEST_OUTPUT=$(npx jest 2>&1 | tee "$MODULE_JEST_TEMP")
      extract_jest_stats "$MODULE_JEST_OUTPUT" "$dirname" "$(pwd)" "$MODULE_JEST_TEMP"
      rm -f "$MODULE_JEST_TEMP"
      
      if ls *test.rexx 1> /dev/null 2>&1; then
        MODULE_REXXT_TEMP=$(mktemp)
        MODULE_REXXT_OUTPUT=$(../../core/rexxt *test.rexx 2>&1 | tee "$MODULE_REXXT_TEMP")
        extract_rexxt_stats "$MODULE_REXXT_OUTPUT" "$dirname" "$(pwd)" "$MODULE_REXXT_TEMP"
        rm -f "$MODULE_REXXT_TEMP"
      fi
    else
      echo "  ⏭️  Skipping empty directory: $dirname"
      SKIPPED_MODULES+=("$dirname (empty)")
    fi
    cd - > /dev/null
  fi
done

# Print final statistics
echo ""
echo "🏁 CI PIPELINE SUMMARY"
echo "======================"
echo ""
echo "📊 Jest Test Results:"
echo "  Total Test Suites: $TOTAL_JEST_SUITES"
echo "  Total Tests: $TOTAL_JEST_TESTS"
echo "  ✅ Passed: $TOTAL_JEST_PASSED"
echo "  ❌ Failed: $TOTAL_JEST_FAILED"
if [ "$TOTAL_JEST_TESTS" -gt 0 ]; then
  JEST_PASS_RATE=$((TOTAL_JEST_PASSED * 100 / TOTAL_JEST_TESTS))
  echo "  📈 Pass Rate: $JEST_PASS_RATE%"
fi
echo ""

echo "📊 Rexxt Test Results:"
echo "  Total Test Files: $TOTAL_REXXT_FILES"
echo "  Total Tests: $TOTAL_REXXT_TESTS"
echo "  Total Expectations: $TOTAL_REXXT_EXPECTATIONS"
echo ""

echo "📁 Module Breakdown:"
echo "Jest modules:"
for module in "${JEST_MODULES[@]}"; do
  echo "  • $module"
done
echo ""

if [ ${#REXXT_MODULES[@]} -gt 0 ]; then
  echo "Rexxt modules:"
  for module in "${REXXT_MODULES[@]}"; do
    echo "  • $module"
  done
  echo ""
fi

if [ ${#SKIPPED_MODULES[@]} -gt 0 ]; then
  echo "Skipped modules:"
  for module in "${SKIPPED_MODULES[@]}"; do
    echo "  • $module"
  done
  echo ""
fi

# Final status
if [ "$TOTAL_JEST_FAILED" -eq 0 ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "💥 $TOTAL_JEST_FAILED tests failed"
  exit 1
fi
