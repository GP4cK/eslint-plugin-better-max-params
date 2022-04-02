/**
 * @fileoverview Set a max param number for your constructors, functions, methods etc.
 * @author max-params
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/better-max-params"),
  RuleTester = require("eslint").RuleTester;


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester();
ruleTester.run("better-max-params", rule, {
  valid: [
    "function test(d, e, f, g) {}",
    { code: "var test = function(a, b, c) {};", options: [{ func: 3 }] },
    { code: "var test = function(a, b, c) {};", options: [{ func: 3, constructor: 2 }] },
    { code: "var test = (a, b, c) => {};", options: [{ func: 3}], parserOptions: { ecmaVersion: 6 } },
    { code: "var test = function test(a, b, c) {};", options: [{ func: 3}] },
    { code: "class Test { constructor(a, b, c) {} }", options: [{ func: 2, constructor: 3 }], parserOptions: { ecmaVersion: 6 } },
  ],

  invalid: [
    {
      code: "function test(a, b, c) {}",
      options: [{ func: 2}],
      errors: [{
        messageId: "exceed",
        data: { name: "Function 'test'", count: 3, max: 2.0 },
        type: "FunctionDeclaration"
      }]
    },
    {
      code: "function test(a, b, c, d) {}",
      options: [{ func: 3}],
      errors: [{
        messageId: "exceed",
        data: { name: "Function 'test'", count: 4, max: 3.0 },
        type: "FunctionDeclaration"
      }]
    },
    {
      code: "var test = function(a, b, c, d) {};",
      options: [{ func: 3}],
      errors: [{
        messageId: "exceed",
        data: { name: "Function", count: 4, max: 3.0 },
        type: "FunctionExpression"
      }]
    },
    {
      code: "var test = (a, b, c, d) => {};",
      options: [{ func: 3}],
      parserOptions: { ecmaVersion: 6 },
      errors: [{
        messageId: "exceed",
        data: { name: "Arrow function", count: 4, max: 3.0 },
        type: "ArrowFunctionExpression"
      }]
    },
    {
      code: "(function(a, b, c, d) {});",
      options: [{ func: 3}],
      errors: [{
        messageId: "exceed",
        data: { name: "Function", count: 4, max: 3.0 },
        type: "FunctionExpression"
      }]
    },
    {
      code: "var test = function test(a, b, c) {};",
      options: [{ func: 1}],
      errors: [{
        messageId: "exceed",
        data: { name: "Function 'test'", count: 3, max: 1.0 },
        type: "FunctionExpression"
      }]
    },
    {
      code: "class Test { constructor(a, b, c) {} }",
      options: [{ func: 4, constructor: 2 }],
      parserOptions: { ecmaVersion: 6 },
      errors: [{
        messageId: "exceed",
        data: { name: "Constructor", count: 3, max: 2 },
        type: "FunctionExpression"
      }]
    },
    {
      code: `class Test {
        constructor(a, b, c) {}
        wrongMethod(a, b, c, d, e) {}
      }`,
      options: [{ func: 2, constructor: 3 }],
      parserOptions: { ecmaVersion: 6 },
      errors: [{
        messageId: "exceed",
        data: { name: "Method 'wrongMethod'", count: 5, max: 2 },
        type: "FunctionExpression"
      }]
    },

    // Error location should not cover the entire function; just the name.
    {
      code: `function test(a, b, c) {
        // Just to make it longer
      }`,
      options: [{ func: 2}],
      errors: [{
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 14
      }]
    }
  ],
});
