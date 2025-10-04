#!/usr/bin/env rexx
/*
 * Test Google Docs REPLACE - Template-based document generation
 * Demonstrates elegant find/replace for mail merge style operations
 */

PARSE ARG credFile, docId

SAY "Google Docs Template Generation Demo"
SAY "====================================="
SAY ""

LET documentId = docId

/* First, create a template document with placeholders */
LET template = <<TEMPLATE
Dear {{NAME}},

Thank you for your interest in {{PRODUCT}}. We're excited to share
that the product is now available at {{PRICE}}.

Key Features:
- {{FEATURE1}}
- {{FEATURE2}}
- {{FEATURE3}}

Your {{ROLE}} status gives you access to:
• Exclusive {{BENEFIT}} benefits
• Priority support
• Early access to new features

We appreciate your business and look forward to serving you.

Best regards,
{{COMPANY}}
TEMPLATE

/* Now define the replacement values */
LET customerName = "Alice Johnson"
LET productName = "RexxJS Pro"
LET price = "$99/month"
LET feature1 = "Cloud integration with GCP"
LET feature2 = "Advanced scripting capabilities"
LET feature3 = "Enterprise support included"
LET customerRole = "Premium"
LET benefit = "VIP"
LET companyName = "RexxJS Solutions Inc."

REQUIRE "./extras/addresses/provisioning-and-orchestration/address-gcp.js"

ADDRESS GCP

SAY "Step 1: Connecting to document..."
"DOCS CONNECT document={documentId}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Connected to: " || RESULT.document.title
SAY ""

SAY "Step 2: Inserting template..."
"DOCS INSERT text={template}"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Template inserted"
SAY ""

SAY "Step 3: Replacing placeholders with actual values..."
SAY ""

/* Replace each placeholder - elegant one-liners! */
"DOCS REPLACE find={{NAME}} replace={customerName}"
SAY "  ✓ {{NAME}} → " || customerName || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{PRODUCT}} replace={productName}"
SAY "  ✓ {{PRODUCT}} → " || productName || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{PRICE}} replace={price}"
SAY "  ✓ {{PRICE}} → " || price || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{FEATURE1}} replace={feature1}"
SAY "  ✓ {{FEATURE1}} → " || feature1 || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{FEATURE2}} replace={feature2}"
SAY "  ✓ {{FEATURE2}} → " || feature2 || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{FEATURE3}} replace={feature3}"
SAY "  ✓ {{FEATURE3}} → " || feature3 || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{ROLE}} replace={customerRole}"
SAY "  ✓ {{ROLE}} → " || customerRole || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{BENEFIT}} replace={benefit}"
SAY "  ✓ {{BENEFIT}} → " || benefit || " (" || RESULT.occurrencesChanged || " changes)"

"DOCS REPLACE find={{COMPANY}} replace={companyName}"
SAY "  ✓ {{COMPANY}} → " || companyName || " (" || RESULT.occurrencesChanged || " changes)"

SAY ""
SAY "✓ All placeholders replaced!"
SAY ""

SAY "Step 4: Reading final document..."
"DOCS READ"

IF RC \= 0 THEN DO
  SAY "✗ FAILED: " || ERRORTEXT
  EXIT 1
END

SAY "✓ Final document: " || RESULT.length || " characters"
SAY ""
SAY "This demonstrates:"
SAY "  • Template-based document generation"
SAY "  • Mail merge style operations"
SAY "  • Elegant placeholder replacement"
SAY "  • Perfect for automated letters, reports, contracts"
SAY ""
SAY "View personalized document at:"
SAY "https://docs.google.com/document/d/" || documentId

EXIT 0
