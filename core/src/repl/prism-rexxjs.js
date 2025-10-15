/**
 * Prism.js language definition for RexxJS
 * Extends Prism to support REXX syntax highlighting
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

(function (Prism) {
    'use strict';

    // REXX language definition for Prism.js
    Prism.languages.rexx = {
        // Comments first (highest priority)
        'comment': [
            {
                pattern: /\/\*[\s\S]*?\*\//,
                greedy: true
            },
            {
                pattern: /\/\/.*$/m,
                greedy: true
            }
        ],

        // String literals
        'string': [
            {
                pattern: /"(?:[^"\\]|\\.)*"/,
                greedy: true
            },
            {
                pattern: /'(?:[^'\\]|\\.)*'/,
                greedy: true
            }
        ],

        // REXX keywords
        'keyword': /\b(?:SAY|LET|IF|THEN|ELSE|END|DO|WHILE|UNTIL|FOR|TO|BY|SELECT|WHEN|OTHERWISE|EXIT|RETURN|CALL|PROCEDURE|EXPOSE|ADDRESS|SIGNAL|ON|OFF|ERROR|FAILURE|HALT|NOTREADY|SYNTAX|REQUIRE|AS|INTERPRET|INTERPRET_JS|PARSE|ARG|PULL|PUSH|QUEUE|TRACE|NOP|DROP|NUMERIC|OPTIONS|UPPER|VALUE|ITERATE|LEAVE|OVER)\b/i,

        // Built-in functions (functions that commonly appear with parentheses)
        'function': /\b(?:LENGTH|SUBSTR|POS|LEFT|RIGHT|STRIP|WORD|WORDS|WORDPOS|TRANSLATE|VERIFY|REVERSE|COPIES|OVERLAY|INSERT|DELWORD|SUBWORD|CHANGESTR|COUNTSTR|ABBREV|COMPARE|DELSTR|SPACE|DATE|TIME|RANDOM|ABS|MAX|MIN|SIGN|TRUNC|FORMAT|C2D|C2X|D2C|D2X|X2C|X2D|BITAND|BITOR|BITXOR|DOM_QUERY|DOM_SET_STYLE|DOM_CLICK|DOM_GET_ATTRIBUTE|DOM_SET_ATTRIBUTE|HTTP_GET|HTTP_POST|HTTP_PUT|HTTP_DELETE|MAP|FILTER|REDUCE|ARRAY_GET|ARRAY_SET|ARRAY_LENGTH|SPLIT|JOIN|ARRAY_PUSH|ARRAY_POP|ARRAY_SLICE|ARRAY_CONCAT|ARRAY_REVERSE|ARRAY_SORT|ARRAY_INCLUDES|ARRAY_INDEXOF|ARRAY_MIN|ARRAY_MAX|ARRAY_SUM|ARRAY_AVERAGE|ARRAY_FILTER|ARRAY_MAP|ARRAY_FIND|ARRAY_UNIQUE|ARRAY_FLATTEN)\b(?=\s*\()/i,

        // Variables (UPPERCASE identifiers, but not if they're keywords/functions)
        'variable': {
            pattern: /\b[A-Z][A-Z0-9_]*\b/,
            lookbehind: true
        },

        // Numbers
        'number': /\b(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,

        // Operators
        'operator': /\|\||&&|==|!=|<=|>=|<|>|\+|\-|\*|\/|=|\|\|/,

        // Punctuation
        'punctuation': /[{}[\];(),.:]/,

        // Special ADDRESS targets
        'namespace': /\b(?:ADDRESS)\s+[A-Z_][A-Z0-9_]*/i
    };

    // Alias 'rexxjs' to 'rexx' for consistency
    Prism.languages.rexxjs = Prism.languages.rexx;

}(Prism));