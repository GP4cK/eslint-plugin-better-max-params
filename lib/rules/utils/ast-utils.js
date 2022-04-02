
/**
 * Checks if the given token is an opening parenthesis token or not.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is an opening parenthesis token.
 */
function isOpeningParenToken(token) {
  return token.value === "(" && token.type === "Punctuator";
}


/**
 * Checks if the given token is an arrow token or not.
 * @param {Token} token The token to check.
 * @returns {boolean} `true` if the token is an arrow token.
 */
function isArrowToken(token) {
  return token.value === "=>" && token.type === "Punctuator";
}

/**
 * Gets the `(` token of the given function node.
 * @param {ASTNode} node The function node to get.
 * @param {SourceCode} sourceCode The source code object to get tokens.
 * @returns {Token} `(` token.
 */
function getOpeningParenOfParams(node, sourceCode) {

  // If the node is an arrow function and doesn't have parens, this returns the identifier of the first param.
  if (node.type === "ArrowFunctionExpression" && node.params.length === 1) {
    const argToken = sourceCode.getFirstToken(node.params[0]);
    const maybeParenToken = sourceCode.getTokenBefore(argToken);

    return isOpeningParenToken(maybeParenToken) ? maybeParenToken : argToken;
  }

  // Otherwise, returns paren.
  return node.id
    ? sourceCode.getTokenAfter(node.id, isOpeningParenToken)
    : sourceCode.getFirstToken(node, isOpeningParenToken);
}


/**
 * Determines whether the given node is a `null` literal.
 * @param {ASTNode} node The node to check
 * @returns {boolean} `true` if the node is a `null` literal
 */
 function isNullLiteral(node) {

  /*
   * Checking `node.value === null` does not guarantee that a literal is a null literal.
   * When parsing values that cannot be represented in the current environment (e.g. unicode
   * regex's in Node 4), `node.value` is set to `null` because it wouldn't be possible to
   * set `node.value` to a unicode regex. To make sure a literal is actually `null`, check
   * `node.regex` instead. Also see: https://github.com/eslint/eslint/issues/8020
   */
  return node.type === "Literal" && node.value === null && !node.regex && !node.bigint;
}

/**
 * Returns the result of the string conversion applied to the evaluated value of the given expression node,
 * if it can be determined statically.
 *
 * This function returns a `string` value for all `Literal` nodes and simple `TemplateLiteral` nodes only.
 * In all other cases, this function returns `null`.
 * @param {ASTNode} node Expression node.
 * @returns {string|null} String value if it can be determined. Otherwise, `null`.
 */
 function getStaticStringValue(node) {
  switch (node.type) {
      case "Literal":
          if (node.value === null) {
              if (isNullLiteral(node)) {
                  return String(node.value); // "null"
              }
              if (node.regex) {
                  return `/${node.regex.pattern}/${node.regex.flags}`;
              }
              if (node.bigint) {
                  return node.bigint;
              }

              // Otherwise, this is an unknown literal. The function will return null.

          } else {
              return String(node.value);
          }
          break;
      case "TemplateLiteral":
          if (node.expressions.length === 0 && node.quasis.length === 1) {
              return node.quasis[0].value.cooked;
          }
          break;

          // no default
  }

  return null;
}

/**
 * Gets the property name of a given node.
 * The node can be a MemberExpression, a Property, or a MethodDefinition.
 *
 * If the name is dynamic, this returns `null`.
 *
 * For examples:
 *
 *     a.b           // => "b"
 *     a["b"]        // => "b"
 *     a['b']        // => "b"
 *     a[`b`]        // => "b"
 *     a[100]        // => "100"
 *     a[b]          // => null
 *     a["a" + "b"]  // => null
 *     a[tag`b`]     // => null
 *     a[`${b}`]     // => null
 *
 *     let a = {b: 1}            // => "b"
 *     let a = {["b"]: 1}        // => "b"
 *     let a = {['b']: 1}        // => "b"
 *     let a = {[`b`]: 1}        // => "b"
 *     let a = {[100]: 1}        // => "100"
 *     let a = {[b]: 1}          // => null
 *     let a = {["a" + "b"]: 1}  // => null
 *     let a = {[tag`b`]: 1}     // => null
 *     let a = {[`${b}`]: 1}     // => null
 * @param {ASTNode} node The node to get.
 * @returns {string|null} The property name if static. Otherwise, null.
 */
 function getStaticPropertyName(node) {
  let prop;

  switch (node && node.type) {
      case "ChainExpression":
          return getStaticPropertyName(node.expression);

      case "Property":
      case "PropertyDefinition":
      case "MethodDefinition":
          prop = node.key;
          break;

      case "MemberExpression":
          prop = node.property;
          break;

          // no default
  }

  if (prop) {
      if (prop.type === "Identifier" && !node.computed) {
          return prop.name;
      }

      return getStaticStringValue(prop);
  }

  return null;
}

module.exports = {
  /**
     * Gets the location of the given function node for reporting.
     *
     * - `function foo() {}`
     *    ^^^^^^^^^^^^
     * - `(function foo() {})`
     *     ^^^^^^^^^^^^
     * - `(function() {})`
     *     ^^^^^^^^
     * - `function* foo() {}`
     *    ^^^^^^^^^^^^^
     * - `(function* foo() {})`
     *     ^^^^^^^^^^^^^
     * - `(function*() {})`
     *     ^^^^^^^^^
     * - `() => {}`
     *       ^^
     * - `async () => {}`
     *             ^^
     * - `({ foo: function foo() {} })`
     *       ^^^^^^^^^^^^^^^^^
     * - `({ foo: function() {} })`
     *       ^^^^^^^^^^^^^
     * - `({ ['foo']: function() {} })`
     *       ^^^^^^^^^^^^^^^^^
     * - `({ [foo]: function() {} })`
     *       ^^^^^^^^^^^^^^^
     * - `({ foo() {} })`
     *       ^^^
     * - `({ foo: function* foo() {} })`
     *       ^^^^^^^^^^^^^^^^^^
     * - `({ foo: function*() {} })`
     *       ^^^^^^^^^^^^^^
     * - `({ ['foo']: function*() {} })`
     *       ^^^^^^^^^^^^^^^^^^
     * - `({ [foo]: function*() {} })`
     *       ^^^^^^^^^^^^^^^^
     * - `({ *foo() {} })`
     *       ^^^^
     * - `({ foo: async function foo() {} })`
     *       ^^^^^^^^^^^^^^^^^^^^^^^
     * - `({ foo: async function() {} })`
     *       ^^^^^^^^^^^^^^^^^^^
     * - `({ ['foo']: async function() {} })`
     *       ^^^^^^^^^^^^^^^^^^^^^^^
     * - `({ [foo]: async function() {} })`
     *       ^^^^^^^^^^^^^^^^^^^^^
     * - `({ async foo() {} })`
     *       ^^^^^^^^^
     * - `({ get foo() {} })`
     *       ^^^^^^^
     * - `({ set foo(a) {} })`
     *       ^^^^^^^
     * - `class A { constructor() {} }`
     *              ^^^^^^^^^^^
     * - `class A { foo() {} }`
     *              ^^^
     * - `class A { *foo() {} }`
     *              ^^^^
     * - `class A { async foo() {} }`
     *              ^^^^^^^^^
     * - `class A { ['foo']() {} }`
     *              ^^^^^^^
     * - `class A { *['foo']() {} }`
     *              ^^^^^^^^
     * - `class A { async ['foo']() {} }`
     *              ^^^^^^^^^^^^^
     * - `class A { [foo]() {} }`
     *              ^^^^^
     * - `class A { *[foo]() {} }`
     *              ^^^^^^
     * - `class A { async [foo]() {} }`
     *              ^^^^^^^^^^^
     * - `class A { get foo() {} }`
     *              ^^^^^^^
     * - `class A { set foo(a) {} }`
     *              ^^^^^^^
     * - `class A { static foo() {} }`
     *              ^^^^^^^^^^
     * - `class A { static *foo() {} }`
     *              ^^^^^^^^^^^
     * - `class A { static async foo() {} }`
     *              ^^^^^^^^^^^^^^^^
     * - `class A { static get foo() {} }`
     *              ^^^^^^^^^^^^^^
     * - `class A { static set foo(a) {} }`
     *              ^^^^^^^^^^^^^^
     * - `class A { foo = function() {} }`
     *              ^^^^^^^^^^^^^^
     * - `class A { static foo = function() {} }`
     *              ^^^^^^^^^^^^^^^^^^^^^
     * - `class A { foo = (a, b) => {} }`
     *              ^^^^^^
     * @param {ASTNode} node The function node to get.
     * @param {SourceCode} sourceCode The source code object to get tokens.
     * @returns {string} The location of the function node for reporting.
     */
  getFunctionHeadLoc(node, sourceCode) {
    const parent = node.parent;
    let start = null;
    let end = null;

    if (parent.type === "Property" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") {
      start = parent.loc.start;
      end = getOpeningParenOfParams(node, sourceCode).loc.start;
    } else if (node.type === "ArrowFunctionExpression") {
      const arrowToken = sourceCode.getTokenBefore(node.body, isArrowToken);

      start = arrowToken.loc.start;
      end = arrowToken.loc.end;
    } else {
      start = node.loc.start;
      end = getOpeningParenOfParams(node, sourceCode).loc.start;
    }

    return {
      start: Object.assign({}, start),
      end: Object.assign({}, end)
    };
  },


  /**
   * Gets the name and kind of the given function node.
   *
   * - `function foo() {}`  .................... `function 'foo'`
   * - `(function foo() {})`  .................. `function 'foo'`
   * - `(function() {})`  ...................... `function`
   * - `function* foo() {}`  ................... `generator function 'foo'`
   * - `(function* foo() {})`  ................. `generator function 'foo'`
   * - `(function*() {})`  ..................... `generator function`
   * - `() => {}`  ............................. `arrow function`
   * - `async () => {}`  ....................... `async arrow function`
   * - `({ foo: function foo() {} })`  ......... `method 'foo'`
   * - `({ foo: function() {} })`  ............. `method 'foo'`
   * - `({ ['foo']: function() {} })`  ......... `method 'foo'`
   * - `({ [foo]: function() {} })`  ........... `method`
   * - `({ foo() {} })`  ....................... `method 'foo'`
   * - `({ foo: function* foo() {} })`  ........ `generator method 'foo'`
   * - `({ foo: function*() {} })`  ............ `generator method 'foo'`
   * - `({ ['foo']: function*() {} })`  ........ `generator method 'foo'`
   * - `({ [foo]: function*() {} })`  .......... `generator method`
   * - `({ *foo() {} })`  ...................... `generator method 'foo'`
   * - `({ foo: async function foo() {} })`  ... `async method 'foo'`
   * - `({ foo: async function() {} })`  ....... `async method 'foo'`
   * - `({ ['foo']: async function() {} })`  ... `async method 'foo'`
   * - `({ [foo]: async function() {} })`  ..... `async method`
   * - `({ async foo() {} })`  ................. `async method 'foo'`
   * - `({ get foo() {} })`  ................... `getter 'foo'`
   * - `({ set foo(a) {} })`  .................. `setter 'foo'`
   * - `class A { constructor() {} }`  ......... `constructor`
   * - `class A { foo() {} }`  ................. `method 'foo'`
   * - `class A { *foo() {} }`  ................ `generator method 'foo'`
   * - `class A { async foo() {} }`  ........... `async method 'foo'`
   * - `class A { ['foo']() {} }`  ............. `method 'foo'`
   * - `class A { *['foo']() {} }`  ............ `generator method 'foo'`
   * - `class A { async ['foo']() {} }`  ....... `async method 'foo'`
   * - `class A { [foo]() {} }`  ............... `method`
   * - `class A { *[foo]() {} }`  .............. `generator method`
   * - `class A { async [foo]() {} }`  ......... `async method`
   * - `class A { get foo() {} }`  ............. `getter 'foo'`
   * - `class A { set foo(a) {} }`  ............ `setter 'foo'`
   * - `class A { static foo() {} }`  .......... `static method 'foo'`
   * - `class A { static *foo() {} }`  ......... `static generator method 'foo'`
   * - `class A { static async foo() {} }`  .... `static async method 'foo'`
   * - `class A { static get foo() {} }`  ...... `static getter 'foo'`
   * - `class A { static set foo(a) {} }`  ..... `static setter 'foo'`
   * - `class A { foo = () => {}; }`  .......... `method 'foo'`
   * - `class A { foo = function() {}; }`  ..... `method 'foo'`
   * - `class A { foo = function bar() {}; }`  . `method 'foo'`
   * - `class A { static foo = () => {}; }`  ... `static method 'foo'`
   * - `class A { '#foo' = () => {}; }`  ....... `method '#foo'`
   * - `class A { #foo = () => {}; }`  ......... `private method #foo`
   * - `class A { static #foo = () => {}; }`  .. `static private method #foo`
   * - `class A { '#foo'() {} }`  .............. `method '#foo'`
   * - `class A { #foo() {} }`  ................ `private method #foo`
   * - `class A { static #foo() {} }`  ......... `static private method #foo`
   * @param {ASTNode} node The function node to get.
   * @returns {string} The name and kind of the function node.
   */
  getFunctionNameWithKind(node) {
    const parent = node.parent;
    const tokens = [];

    if (parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") {

      // The proposal uses `static` word consistently before visibility words: https://github.com/tc39/proposal-static-class-features
      if (parent.static) {
        tokens.push("static");
      }
      if (!parent.computed && parent.key.type === "PrivateIdentifier") {
        tokens.push("private");
      }
    }
    if (node.async) {
      tokens.push("async");
    }
    if (node.generator) {
      tokens.push("generator");
    }

    if (parent.type === "Property" || parent.type === "MethodDefinition") {
      if (parent.kind === "constructor") {
        return "constructor";
      }
      if (parent.kind === "get") {
        tokens.push("getter");
      } else if (parent.kind === "set") {
        tokens.push("setter");
      } else {
        tokens.push("method");
      }
    } else if (parent.type === "PropertyDefinition") {
      tokens.push("method");
    } else {
      if (node.type === "ArrowFunctionExpression") {
        tokens.push("arrow");
      }
      tokens.push("function");
    }

    if (parent.type === "Property" || parent.type === "MethodDefinition" || parent.type === "PropertyDefinition") {
      if (!parent.computed && parent.key.type === "PrivateIdentifier") {
        tokens.push(`#${parent.key.name}`);
      } else {
        const name = getStaticPropertyName(parent);

        if (name !== null) {
          tokens.push(`'${name}'`);
        } else if (node.id) {
          tokens.push(`'${node.id.name}'`);
        }
      }
    } else if (node.id) {
      tokens.push(`'${node.id.name}'`);
    }

    return tokens.join(" ");
  },
}