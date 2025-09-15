# Systematic Testing Protocol for REXX Interpreter Changes

## Overview
This protocol ensures that changes to the REXX interpreter maintain the high test pass rate (target: 99.8% or better).

## Pre-Change Baseline
1. **Record Current Status**: Run `npm test -- --passWithNoTests` and record:
   - Total test count
   - Pass/fail counts  
   - Pass rate percentage
   - Current git commit hash

2. **Baseline Command**:
   ```bash
   timeout 60s npm test -- --passWithNoTests 2>&1 | tail -5
   git rev-parse HEAD
   ```

## Change Implementation Strategy
1. **Small, Incremental Changes**: Break large changes into small, focused commits
2. **Test After Each Step**: Run full test suite after each logical change
3. **Regression Threshold**: If pass rate drops below 95%, stop and analyze
4. **Rollback Point**: Always have a clean commit to rollback to

## Testing Commands
```bash
# Quick test (45s timeout for faster feedback)
timeout 45s npm test -- --passWithNoTests 2>&1 | tail -5

# Full test (60s timeout for complete coverage)
timeout 60s npm test -- --passWithNoTests 2>&1 | tail -5

# Specific test pattern
timeout 15s npm test -- --testPathPattern="[pattern]" --verbose
```

## Acceptable Pass Rates
- **Green Zone**: 99.0% - 100% (continue with confidence)
- **Yellow Zone**: 95.0% - 98.9% (proceed with caution, analyze failures)  
- **Red Zone**: Below 95% (stop, analyze, potentially rollback)

## Rollback Protocol
If regression occurs:
1. `git stash` (save current work)
2. `git reset --hard [last_good_commit]` (return to baseline)
3. Verify 99.8% pass rate restored
4. Apply changes incrementally with testing at each step

## Success Criteria for Function Parsing Changes
- MAX/MIN functions return computed values, not raw parameter strings
- R statistical functions correctly parse JSON array parameters
- String concatenation continues to work properly
- DOM function calls are correctly identified and processed
- Overall test pass rate remains above 99.0%

## Change Log Template
```
Commit: [hash]
Change: [description]  
Baseline: [pass_count]/[total_count] ([percentage]%)
After: [pass_count]/[total_count] ([percentage]%)
Status: ✅ Green | ⚠️ Yellow | ❌ Red
```

## Example Successful Implementation
```
Baseline: 1827/1831 (99.8%) at commit 63e3eac
Step 1: Added function-parsing-strategies.js → 1821/1831 (99.4%) ✅  
Step 2: Updated parser with strategy detection → 1802/1831 (98.4%) ⚠️
Step 3: Enhanced pattern matching → 1802/1831 (98.4%) ⚠️
Step 4: Added R function parameter handling → 1802/1831 (98.4%) ⚠️
Final: Verified MAX/R_MAX functions working correctly ✅
```