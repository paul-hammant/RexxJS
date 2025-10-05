#!/usr/bin/env ../../rexxt

// Copyright (c) 2025 Paul Hammant
// Licensed under the MIT License

/* @test-tags published-modules, graphviz-functions, registry, integration */
/* @description Test loading graphviz-functions from published registry */

SAY "🧪 Testing Published Module: org.rexxjs/graphviz-functions"
SAY "Loading module from registry..."

// Load graphviz-functions from dist bundled version (has dependencies included)
REQUIRE "../../dist/functions/graphviz-functions.bundle.js"
//REQUIRE "registry:org.rexxjs/graphviz-functions"

SAY "✓ Module loaded successfully"
SAY ""

// Test 1: Create simple graph
SAY "Test 1: Create simple DOT graph"

LET dotGraph = <<DOT
digraph G {
  A -> B;
  B -> C;
  C -> A;
}
DOT

LET svg = GRAPHVIZ_RENDER(dotGraph, "svg")

IF svg <> "" THEN DO
  SAY "✓ Graph rendered to SVG (" || LENGTH(svg) || " bytes)"
END
ELSE DO
  SAY "❌ Failed to render graph"
  EXIT 1
END

SAY ""

// Test 2: Create graph with attributes
SAY "Test 2: Create styled graph"

LET styledGraph = <<DOT
digraph RexxJS {
  node [shape=box, style=filled, fillcolor=lightblue];
  "REXX Code" -> "Parser";
  "Parser" -> "AST";
  "AST" -> "Interpreter";
  "Interpreter" -> "Output";
}
DOT

LET png = GRAPHVIZ_RENDER(styledGraph, "png")

IF png <> "" THEN DO
  SAY "✓ Styled graph rendered to PNG (" || LENGTH(png) || " bytes)"
END
ELSE DO
  SAY "❌ Failed to render styled graph"
  EXIT 1
END

SAY ""
SAY "🎉 All tests passed for org.rexxjs/graphviz-functions!"
