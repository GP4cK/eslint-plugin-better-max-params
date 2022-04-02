/**
 * @fileoverview Set a max param number for your constructors, functions, methods etc.
 * @author GP4cK
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const maxParams = require("./rules/better-max-params");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------


// import all rules in lib/rules
module.exports = {
  rules: {
    "better-max-params": maxParams
  }
};



