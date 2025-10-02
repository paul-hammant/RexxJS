'use strict';

/**
 * @fileoverview Node.js console output handler for SAY statements
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

class NodeOutputHandler {
  write(content) {
    process.stdout.write(content);
  }
  
  writeLine(content) {
    console.log(content);
  }
  
  writeError(content) {
    console.error(content);
  }
}

module.exports = { NodeOutputHandler };
