// Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License

/* 
 * CHECKPOINT Technology Example - Claude AI Collaboration
 * Demonstrates COMET-style long-polling with structured callbacks
 */

SAY "=== Claude CHECKPOINT Technology Demo ==="
SAY ""

-- Load Claude ADDRESS library
REQUIRE "claude-address.js"
ADDRESS claude

-- Example 1: Code Analysis with Structured Output
SAY "1. Analyzing JavaScript code..."
LET sourceCode = "function fibonacci(n) { if (n <= 1) return n; return fibonacci(n-1) + fibonacci(n-2); }"

-- Create CHECKPOINT for code analysis
LET analysisCheckpoint = checkpoint operation="ANALYZE_CODE" code=sourceCode format="structured" timeout="15000"
SAY "   Created checkpoint:" analysisCheckpoint.checkpointId

-- COMET-style long-polling loop
LET checkpointId = analysisCheckpoint.checkpointId
DO WHILE isDone <> "true"
    -- Poll for completion (long-polling)
    LET pollResult = wait_for_checkpoint checkpoint_id=checkpointId
    
    -- Show progress
    SAY "   Status:" pollResult.progress.status "(" || pollResult.progress.percentage || "%)"
    
    -- Check if done
    IF pollResult.done = "true" THEN DO
        LET isDone = "true"
        LET codeAnalysis = pollResult.result
        SAY "   ✓ Analysis complete!"
        SAY "   Analysis:" codeAnalysis.data.analysis
        SAY "   Issues found:" codeAnalysis.data.issues.length
        SAY "   Quality score:" codeAnalysis.data.quality_score
    END
    ELSE DO
        -- Wait a bit before next poll (in real implementation, this would be event-driven)
        WAIT milliseconds=1000
    END
END

SAY ""

-- Example 2: Text Review with Progress Updates
SAY "2. Reviewing documentation text..."
LET documentText = "This is a sample document. It may contains some grammatical errors and could use improvement in terms of clarity and style."

-- Create CHECKPOINT for text review
LET reviewCheckpoint = checkpoint operation="REVIEW_TEXT" text=documentText format="structured"
LET reviewId = reviewCheckpoint.checkpointId
SAY "   Created checkpoint:" reviewId

-- Poll until complete
LET reviewDone = "false"
DO WHILE reviewDone <> "true"
    LET reviewPoll = wait_for_checkpoint checkpoint_id=reviewId
    
    SAY "   Progress:" reviewPoll.progress.message
    
    IF reviewPoll.done = "true" THEN DO
        LET reviewDone = "true"
        LET textReview = reviewPoll.result
        SAY "   ✓ Review complete!"
        SAY "   Overall assessment:" textReview.data.review
        SAY "   Grammar issues:" textReview.data.grammar_issues.length
        SAY "   Readability:" textReview.data.readability
    END
    ELSE DO
        WAIT milliseconds=1000
    END
END

SAY ""

-- Example 3: Code Generation
SAY "3. Generating code with Claude..."
LET codeRequest = "Create a JavaScript function that validates email addresses using regex"

LET generateCheckpoint = checkpoint operation="GENERATE_CODE" text=codeRequest format="structured"
LET generateId = generateCheckpoint.checkpointId
SAY "   Created checkpoint:" generateId

-- Simple polling (could be made more sophisticated)
LET attempts = 0
DO WHILE attempts < 30  -- Max 30 seconds
    LET genPoll = wait_for_checkpoint checkpoint_id=generateId
    
    IF genPoll.done = "true" THEN DO
        LET generatedCode = genPoll.result
        SAY "   ✓ Code generation complete!"
        SAY "   Generated code:"
        SAY "   " || generatedCode.data.code
        SAY "   Dependencies:" generatedCode.data.dependencies.length
        LEAVE
    END
    ELSE DO
        SAY "   " || genPoll.progress.message
        WAIT milliseconds=1000
        LET attempts = attempts + 1
    END
END

SAY ""

-- Example 4: Custom Analysis Operation
SAY "4. Custom analysis operation..."
LET customData = "User feedback: 'The app is good but could be faster and more intuitive'"

LET customCheckpoint = checkpoint operation="SENTIMENT_ANALYSIS" data=customData format="structured"
LET customId = customCheckpoint.checkpointId

-- Demonstrate manual completion (simulating external collaborator)
SAY "   Checkpoint created, completing manually..."
LET manualResult = '{"sentiment": "mixed", "positive_aspects": ["good"], "negative_aspects": ["could be faster", "more intuitive"], "score": 0.6}'
LET completeResult = complete_checkpoint checkpoint_id=customId result=manualResult

SAY "   ✓ Manual completion successful!"
SAY "   Sentiment:" completeResult.result.sentiment
SAY "   Score:" completeResult.result.score

SAY ""

-- Show service status
LET serviceStatus = status
SAY "=== Service Status ==="
SAY "Active sessions:" serviceStatus.activeSessions  
SAY "Active checkpoints:" serviceStatus.activeCheckpoints
SAY "Available methods:" serviceStatus.methods.length

SAY ""
SAY "=== CHECKPOINT Demo Complete ==="
SAY "This demonstrates:"
SAY "• Structured output generation with Claude"
SAY "• COMET-style long-polling for collaboration" 
SAY "• Progress updates and status monitoring"
SAY "• Multiple operation types (analyze, generate, review)"
SAY "• Manual checkpoint completion for external collaborators"
SAY "• JSON-structured responses for programmatic use"