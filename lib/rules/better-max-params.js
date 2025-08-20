/**
 * @fileoverview Set a max param number for your constructors, functions, methods etc.
 * @author GP4cK
 */
"use strict";

const astUtils = require("./utils/ast-utils");

/**
 * Converts the first letter of a string to uppercase.
 * @param {string} string The string to operate on
 * @returns {string} The converted string
 */
function upperCaseFirst(string) {
  if (string.length <= 1) {
    return string.toUpperCase();
  }
  return string[0].toUpperCase() + string.slice(1);
}

function buildError(node, name, sourceCode, constructorNumParams) {
  return {
    loc: astUtils.getFunctionHeadLoc(node, sourceCode),
    node,
    messageId: "exceed",
    data: {
      name: upperCaseFirst(name),
      count: node.params.length,
      max: constructorNumParams
    }
  }
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    defaultOptions: [{ func: undefined, constructor: undefined }],
    type: "suggestion", // `problem`, `suggestion`, or `layout`
    docs: {
      description: "Set a max param number for your constructors, functions, methods etc.",
      recommended: false,
      url: null, // URL to the documentation page for this rule
    },
    fixable: null, // Or `code` or `whitespace`
    schema: [{
      oneOf: [{
        // Only specify a limit for functions
        type: "object",
        properties: {
          func: {
            type: "integer",
            description: "The maximum number of parameters allowed for functions",
            minimum: 0
          },
        },
        additionalProperties: false
      }, {
        // Specify a limit for both functions and constructors
        type: "object",
        properties: {
          func: {
            type: "integer",
            description: "The maximum number of parameters allowed for functions",
            minimum: 0
          },
          constructor: {
            type: "integer",
            description: "The maximum number of parameters allowed for constructors",
            minimum: 0,
          }
        },
        additionalProperties: false
      }]
    }],
    messages: {
      exceed: "{{name}} has too many parameters ({{count}}). Maximum allowed is {{max}}."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode;
    const option = context.options[0];
    let funcNumParams;
    let constructorNumParams;

    if (option) {
      if (option.func) funcNumParams = option.func;
      if (option.constructor) constructorNumParams = option.constructor;
    }

    /**
     * Checks a function to see if it has too many parameters.
     * @param {ASTNode} node The node to check.
     * @returns {void}
     * @private
     */
    function checkFunction(node) {
      const name = astUtils.getFunctionNameWithKind(node);
      if (name === 'constructor') {
        if (node.params.length > constructorNumParams) {
          context.report(buildError(node, name, sourceCode, constructorNumParams));
        }
      } else if (node.params.length > funcNumParams) {
        context.report(buildError(node, name, sourceCode, funcNumParams));
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      ArrowFunctionExpression: checkFunction,
      FunctionExpression: checkFunction
    };
  },
};
