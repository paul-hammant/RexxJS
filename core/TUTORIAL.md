# RexxJS Tutorial

Welcome to RexxJS! This tutorial takes you step-by-step from your very first "Hello World" to building powerful automation scripts. Each chapter builds naturally on what you've learned before.

**What You'll Build:**
- Your first working programs with immediate results
- Simple calculations and text processing
- Smart decision-making programs  
- Programs that repeat tasks automatically
- Web page automation that clicks and fills forms
- Multi-application workflows

**Prerequisites:** None! If you can use a computer, you can learn Rexx.

## 🚀 Getting Started

### Quick Setup

```bash
# Start the HTTP server
npx http-server -p 8082 -c-1

# Open the tutorial environment
open http://localhost:8082/tests/test-harness-dom.html
```

The DOM test harness is perfect for learning - it provides a complete environment with forms, buttons, and interactive elements to practice on.

## Chapter 1: Your First Program

Let's write your very first Rexx program! 

### Step 1: Hello World

Type this exactly as shown:

```rexx
SAY "Hello, World!"
```

**Try it now:** 
1. Open `http://localhost:8082/tests/test-harness-dom.html`
2. Paste the code above into the script area
3. Click "Execute Script"
4. Look at the output - you should see "Hello, World!"

🎉 **Congratulations!** You just wrote and ran your first Rexx program!

### What Just Happened?

- `SAY` tells Rexx to display something on the screen
- The quotes `" "` contain the exact text you want to show
- When you run the program, Rexx shows your message

### Step 2: Making It Personal

Let's make the program say hello to YOU:

```rexx
SAY "Hello, [YOUR NAME]!"
```

Replace `[YOUR NAME]` with your actual name and run it. 

### Step 3: Multiple Lines

You can make your program say multiple things:

```rexx
SAY "Hello!"
SAY "My name is Rexx"
SAY "Nice to meet you!"
```

**Try it:** Run this and see all three messages appear.

### What You Learned

- Programs run line by line, from top to bottom
- `SAY` displays text to the user
- You can have as many `SAY` statements as you want

## Chapter 2: Storing Information (Variables)

Your programs can remember things! We call these "variables" - they're like labeled boxes that hold information.

### Step 1: Your First Variable

```rexx
LET name = "Alice"
SAY "Hello, " || name
```

**Try it:** You should see "Hello, Alice"

### What Happened?

- `LET name = "Alice"` puts the text "Alice" into a box labeled "name"
- `||` glues text together (we call this "concatenation")  
- `SAY` displays the combined result

### Step 2: Multiple Variables

```rexx
LET first_name = "John"
LET last_name = "Smith"
SAY "Hello, " || first_name || " " || last_name
```

**Try it:** You should see "Hello, John Smith"

### Step 3: Changing Variables

Variables can change! That's why they're called "variable":

```rexx
LET message = "Good morning"
SAY message

LET message = "Good evening"
SAY message
```

**Try it:** You'll see both messages, showing how the variable changed.

### Step 4: Comments (Notes to Yourself)

Add notes to your programs with `--`:

```rexx
-- This is a comment - Rexx ignores this line
LET age = 25        -- You can also put comments at the end of lines
SAY "I am " || age || " years old"
```

Comments help you remember what your program does!

### What You Learned

- Variables store information using `LET variable_name = value`
- Use `||` to join text together
- Comments start with `--` and are ignored when the program runs
- Variables can change their value anytime

## Chapter 3: Basic Math

Let's make your programs calculate things!

### Step 1: Simple Addition

```rexx
LET result = 5 + 3
SAY "5 + 3 = " || result
```

**Try it:** You should see "5 + 3 = 8"

### Step 2: All the Math Operations

```rexx
LET a = 10
LET b = 3

SAY "Addition: " || a || " + " || b || " = " || (a + b)
SAY "Subtraction: " || a || " - " || b || " = " || (a - b)
SAY "Multiplication: " || a || " * " || b || " = " || (a * b)
SAY "Division: " || a || " / " || b || " = " || (a / b)
```

**Try it:** See all four math operations in action!

### Step 3: A Simple Calculator

Let's build something useful - a tip calculator:

```rexx
LET bill = 50
LET tip_percent = 18

LET tip_amount = bill * tip_percent / 100
LET total = bill + tip_amount

SAY "Bill: $" || bill
SAY "Tip (18%): $" || tip_amount  
SAY "Total: $" || total
```

**Try it:** Change the `bill` amount and run it again!

### Step 4: Using Built-in Math Functions

Rexx has helpful math functions:

```rexx
LET number = -25
LET positive = ABS(number)        -- Remove negative sign
LET bigger = MAX(10, 25, 8, 30)   -- Find the biggest number
LET smaller = MIN(10, 25, 8, 30)  -- Find the smallest

SAY "Absolute value of " || number || " is " || positive
SAY "Biggest number: " || bigger
SAY "Smallest number: " || smaller
```

### What You Learned

- Basic math: `+`, `-`, `*`, `/`
- Parentheses `()` control the order of operations
- `ABS()` removes negative signs
- `MAX()` finds the largest number
- `MIN()` finds the smallest number

## Chapter 4: Making Smart Decisions

Your programs can make choices! Let's teach them to think.

### Step 1: Your First Decision

```rexx
LET age = 18

IF age >= 18 THEN
    SAY "You can vote!"
ELSE
    SAY "Too young to vote"
ENDIF
```

**Try it:** Change the `age` to different numbers and see what happens!

### What Happened?

- `IF` starts a decision
- `age >= 18` is the condition (18 or older)
- `THEN` says "do this if true"
- `ELSE` says "do this if false" 
- `ENDIF` closes the decision

### Step 2: Weather Advisor

Let's make a program that gives weather advice:

```rexx
LET temperature = 75

IF temperature > 80 THEN
    SAY "It's hot! Wear shorts and drink water."
ELSE IF temperature > 60 THEN
    SAY "Nice weather! Perfect for a walk."
ELSE IF temperature > 32 THEN
    SAY "A bit chilly. You might need a jacket."
ELSE
    SAY "It's freezing! Bundle up!"
ENDIF
```

**Try it:** Change the temperature and get different advice!

### Step 3: Grade Calculator

Here's a program that converts test scores to letter grades:

```rexx
LET score = 87

IF score >= 90 THEN
    SAY "Grade A - Excellent!"
ELSE IF score >= 80 THEN
    SAY "Grade B - Good work!"
ELSE IF score >= 70 THEN
    SAY "Grade C - Passing"
ELSE IF score >= 60 THEN
    SAY "Grade D - Below average"
ELSE
    SAY "Grade F - Study harder!"
ENDIF

SAY "Your score was " || score
```

### Step 4: Complex Decisions

You can combine conditions with `AND` and `OR`:

```rexx
LET age = 25
LET has_license = "yes"

IF age >= 18 AND has_license = "yes" THEN
    SAY "You can rent a car!"
ELSE
    SAY "You cannot rent a car"
    IF age < 18 THEN
        SAY "Reason: Too young"
    ENDIF
    IF has_license = "no" THEN
        SAY "Reason: No driver's license"
    ENDIF
ENDIF
```

### What You Learned

- `IF...THEN...ELSE...ENDIF` makes decisions
- `>=`, `>`, `<`, `<=`, `=` compare values
- `AND` means both conditions must be true
- `OR` means either condition can be true
- You can nest decisions inside other decisions

## Chapter 5: Repeating Tasks (Loops)

Why do something manually when your program can do it automatically? Let's learn loops!

### Step 1: Counting to 5

```rexx
DO i = 1 TO 5
    SAY "Count: " || i
END
```

**Try it:** You'll see it count from 1 to 5!

### What Happened?

- `DO i = 1 TO 5` starts the loop
- `i` is the counter (starts at 1, ends at 5)
- Everything between `DO` and `END` repeats
- Each time through, `i` gets the next number

### Step 2: Times Tables

Let's make a multiplication table:

```rexx
LET number = 7

SAY "Times table for " || number || ":"
DO i = 1 TO 10
    LET result = number * i
    SAY number || " x " || i || " = " || result
END
```

**Try it:** Change `number` to see different times tables!

### Step 3: Adding Up Numbers

Let's add up all numbers from 1 to 10:

```rexx
LET total = 0

DO i = 1 TO 10
    LET total = total + i
    SAY "Added " || i || ", total is now " || total
END

SAY "Final total: " || total
```

This shows you exactly how the total grows!

### Step 4: Skipping Numbers

Want to count by 2s? Use `BY`:

```rexx
SAY "Even numbers from 2 to 20:"
DO i = 2 TO 20 BY 2
    SAY i
END
```

**Try it:** This counts 2, 4, 6, 8, 10, 12, 14, 16, 18, 20

### Step 5: Finding Something

Let's find the first number over 50 when we double and add:

```rexx
LET number = 1

DO WHILE number <= 50
    SAY "Current number: " || number
    LET number = number * 2 + 1
END

SAY "First number over 50: " || number
```

This uses `WHILE` instead of counting - it keeps going until the condition becomes false.

### What You Learned

- `DO i = 1 TO 5` repeats with a counter
- `BY` lets you skip numbers (count by 2s, 3s, etc.)  
- `DO WHILE condition` repeats until something changes
- Loops can do calculations that build up over time

## Chapter 6: Clicking and Typing (Web Automation) 

Now the fun part - making your programs control web pages! Your program can click buttons, fill forms, and interact with websites.

### Step 1: Finding Elements

Your program needs to "see" elements on the page. Let's count how many buttons exist:

```rexx
LET button_count = QUERY(selector="button", operation="count")
SAY "Found " || button_count || " buttons on this page"
```

**Try it:** This tells you how many buttons are on the test page!

### Step 2: Reading Text

Let's read what's in a text input:

```rexx
LET name_text = QUERY(selector="#name-input", operation="value")
SAY "The name field contains: " || name_text
```

If it's empty, you'll see an empty message.

### Step 3: Typing Into Forms

Let's make the program fill out a form:

```rexx
TYPE(selector="#name-input", text="Robot User")
TYPE(selector="#email-input", text="robot@example.com")

SAY "Filled out the form!"
```

**Try it:** Look at the form fields - they should now contain the text!

### Step 4: Clicking Buttons

Make your program click buttons:

```rexx
SAY "About to click the submit button..."
CLICK(selector="#submit-form")
SAY "Clicked!"
```

**Try it:** Watch the form submit when your program clicks!

### Step 5: A Complete Form Filler

Let's combine everything into a useful program:

```rexx
SAY "Starting automatic form filling..."

-- Fill out the form
TYPE(selector="#name-input", text="John Smith")  
TYPE(selector="#email-input", text="john@example.com")

-- Check what we entered
LET name_check = QUERY(selector="#name-input", operation="value")
LET email_check = QUERY(selector="#email-input", operation="value")

SAY "Entered name: " || name_check
SAY "Entered email: " || email_check

-- Submit the form
SAY "Submitting form..."
CLICK(selector="#submit-form")
SAY "Form submitted!"
```

### Step 6: Checking Results

Your program can check if something worked:

```rexx
-- Fill and submit form
TYPE(selector="#name-input", text="Test User")
TYPE(selector="#email-input", text="test@example.com")
CLICK(selector="#submit-form")

-- Wait a moment for the page to respond
WAIT(milliseconds=1000)

-- Check if success message appeared
LET success_visible = QUERY(selector=".success-message", operation="exists")

IF success_visible THEN
    SAY "✅ Form submitted successfully!"
ELSE  
    SAY "❌ Form submission failed"
ENDIF
```

### What You Learned

- `QUERY()` finds and examines elements on the page
- `TYPE()` enters text into input fields
- `CLICK()` clicks buttons and links
- `WAIT()` pauses the program for a moment
- You can check if your actions worked

## Chapter 7: Your First Complete Program

Let's build something amazing that uses everything you've learned! We'll create an automated form tester.

### The Goal

We'll build a program that:
1. Tests if a form works correctly  
2. Tries different types of data
3. Reports what happened
4. Gives a final score

### Step 1: Setting Up

```rexx
SAY "=== AUTOMATIC FORM TESTER ==="
SAY "Starting comprehensive form test..."

LET tests_passed = 0
LET tests_total = 0
```

### Step 2: Test 1 - Empty Form Validation

```rexx
SAY ""
SAY "Test 1: Empty form should show errors"
LET tests_total = tests_total + 1

-- Try submitting empty form
CLICK(selector="#submit-form")
WAIT(milliseconds=500)

-- Count error messages
LET error_count = QUERY(selector=".error-message", operation="count")

IF error_count > 0 THEN
    SAY "✅ PASS: Found " || error_count || " error messages"
    LET tests_passed = tests_passed + 1
ELSE
    SAY "❌ FAIL: No error messages shown"
ENDIF
```

### Step 3: Test 2 - Invalid Email Detection

```rexx
SAY ""
SAY "Test 2: Invalid email should be rejected"  
LET tests_total = tests_total + 1

-- Enter invalid email
TYPE(selector="#name-input", text="Test User")
TYPE(selector="#email-input", text="not-an-email")
CLICK(selector="#submit-form")
WAIT(milliseconds=500)

-- Check for email error
LET email_error = QUERY(selector="#email-error", operation="exists")

IF email_error THEN
    SAY "✅ PASS: Email validation working"
    LET tests_passed = tests_passed + 1
ELSE
    SAY "❌ FAIL: Invalid email was accepted"
ENDIF
```

### Step 4: Test 3 - Valid Form Submission

```rexx
SAY ""
SAY "Test 3: Valid form should submit successfully"
LET tests_total = tests_total + 1

-- Clear and enter valid data
TYPE(selector="#name-input", text="John Smith")
TYPE(selector="#email-input", text="john@example.com")
CLICK(selector="#submit-form")
WAIT(milliseconds=1000)

-- Check for success message
LET success = QUERY(selector=".success-message", operation="exists")

IF success THEN
    LET success_text = QUERY(selector=".success-message", operation="text")
    SAY "✅ PASS: " || success_text
    LET tests_passed = tests_passed + 1
ELSE
    SAY "❌ FAIL: Valid form was rejected"
ENDIF
```

### Step 5: Smart Reporting

```rexx
SAY ""
SAY "=== TEST RESULTS ==="
SAY "Tests passed: " || tests_passed || " out of " || tests_total

-- Calculate success percentage
LET success_rate = (tests_passed * 100) / tests_total
SAY "Success rate: " || success_rate || "%"

-- Give overall assessment
IF tests_passed = tests_total THEN
    SAY "🎉 EXCELLENT: All tests passed!"
ELSE IF success_rate >= 75 THEN
    SAY "👍 GOOD: Most tests passed"  
ELSE IF success_rate >= 50 THEN
    SAY "⚠️  FAIR: Some issues found"
ELSE
    SAY "❌ POOR: Major problems detected"
ENDIF

SAY ""
SAY "Form testing complete!"
```

### The Complete Program

Here's everything together - copy and run this masterpiece:

```rexx
-- Automatic Form Tester - Complete Program
SAY "=== AUTOMATIC FORM TESTER ==="
SAY "Starting comprehensive form test..."

LET tests_passed = 0
LET tests_total = 0

-- Test 1: Empty form validation
SAY ""
SAY "Test 1: Empty form should show errors"
LET tests_total = tests_total + 1

CLICK(selector="#submit-form")
WAIT(milliseconds=500)

LET error_count = QUERY(selector=".error-message", operation="count")

IF error_count > 0 THEN
    SAY "✅ PASS: Found " || error_count || " error messages"
    LET tests_passed = tests_passed + 1
ELSE
    SAY "❌ FAIL: No error messages shown"
ENDIF

-- Test 2: Invalid email detection  
SAY ""
SAY "Test 2: Invalid email should be rejected"
LET tests_total = tests_total + 1

TYPE(selector="#name-input", text="Test User")
TYPE(selector="#email-input", text="not-an-email")
CLICK(selector="#submit-form")
WAIT(milliseconds=500)

LET email_error = QUERY(selector="#email-error", operation="exists")

IF email_error THEN
    SAY "✅ PASS: Email validation working"
    LET tests_passed = tests_passed + 1
ELSE
    SAY "❌ FAIL: Invalid email was accepted"
ENDIF

-- Test 3: Valid form submission
SAY ""
SAY "Test 3: Valid form should submit successfully"
LET tests_total = tests_total + 1

TYPE(selector="#name-input", text="John Smith")
TYPE(selector="#email-input", text="john@example.com")
CLICK(selector="#submit-form")
WAIT(milliseconds=1000)

LET success = QUERY(selector=".success-message", operation="exists")

IF success THEN
    LET success_text = QUERY(selector=".success-message", operation="text")
    SAY "✅ PASS: " || success_text
    LET tests_passed = tests_passed + 1
ELSE
    SAY "❌ FAIL: Valid form was rejected"
ENDIF

-- Final Results
SAY ""
SAY "=== TEST RESULTS ==="
SAY "Tests passed: " || tests_passed || " out of " || tests_total

LET success_rate = (tests_passed * 100) / tests_total
SAY "Success rate: " || success_rate || "%"

IF tests_passed = tests_total THEN
    SAY "🎉 EXCELLENT: All tests passed!"
ELSE IF success_rate >= 75 THEN
    SAY "👍 GOOD: Most tests passed"  
ELSE IF success_rate >= 50 THEN
    SAY "⚠️  FAIR: Some issues found"
ELSE
    SAY "❌ POOR: Major problems detected"
ENDIF

SAY ""
SAY "Form testing complete!"
```

### What This Program Shows You

This program demonstrates every concept you've learned:

- **Variables** - Storing test results and data
- **Math** - Calculating success percentages  
- **Decisions** - Different responses based on test results
- **Loops** - Could easily be extended with loops for multiple forms
- **DOM Interaction** - Clicking, typing, and checking page elements
- **Real-world usefulness** - This actually tests web forms!

### Your Rexx Journey

🎉 **Congratulations!** You now know Rexx programming!

You can:
- Write programs that make decisions
- Automate repetitive tasks  
- Interact with web pages
- Process data and calculate results
- Build useful tools that solve real problems

### What's Next?

1. **Experiment** - Modify the form tester, add more tests
2. **Build** - Create programs that solve your own problems  
3. **Explore** - Check out the advanced features in other documentation files
4. **Share** - Show others what you've built!

**Keep coding!** 🚀
