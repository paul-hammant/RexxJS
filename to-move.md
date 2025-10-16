# Functions to move from core/src/interpreter.js

Based on the analysis of `core/src/interpreter.js` and the "most-depended-on-least-depending" principle, here is a shortlist of functions to move to other modules.

## Candidate 1: `executeFunctionCall`

This function is a strong candidate for extraction.

*   **Description**: This function handles the logic for executing all types of function calls, including built-in functions, operations, external functions from `REQUIRE`'d libraries, and RPC calls. It's a large and complex function.
*   **Dependencies**: It's called by `executeCommand` and `evaluateExpression`. It depends on utility functions like `resolveValue` and `callConvertParamsToArgs`, and accesses the interpreter's function and operation registries.
*   **Rationale**: Extracting this function would isolate the function call dispatch logic into its own module, making `interpreter.js` smaller and cleaner. It's a significant piece of logic that can stand on its own.

## Candidate 2: `evaluateRexxCallbackExpression` and its helpers

This set of functions is another excellent candidate for extraction.

*   **Description**: This group of functions (`evaluateRexxCallbackExpression`, `evaluateRexxExpressionPart`, `parseSimpleArguments`) implements a small, self-contained REXX expression evaluator used for array filter and map callbacks.
*   **Dependencies**: These functions are called from `createInterpreterAwareArrayFunctions`. They have minimal dependencies on the main interpreter state, primarily using `resolveValue` and `compareValues`.
*   **Rationale**: These functions are already a self-contained logical unit. Moving them to a new file (e.g., `interpreter-callback-evaluation.js`) would be straightforward and would improve the separation of concerns in the codebase.
