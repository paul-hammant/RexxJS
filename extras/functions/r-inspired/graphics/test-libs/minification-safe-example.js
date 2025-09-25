/*!
 * minification-safe-lib v1.0.0 | (c) 2024 Alice Developer | MIT License
 * @rexxjs-meta=MINIFICATION_SAFE_LIB_META
 */
/**
 * Minification-Safe RexxJS Library Example
 * 
 * This library demonstrates BOTH approaches for preserving dependencies:
 * 1. Preserved comments (/*! */) - survive minification
 * 2. Runtime metadata - backup method
 * 
 * Repository: https://github.com/alice/minification-safe-lib
 * Module: github.com/alice/minification-safe-lib
 * Published to: npm as "minification-safe-lib"
 * 
 * Available from multiple sources:
 * - GitHub Raw: https://raw.githubusercontent.com/alice/minification-safe-lib/main/dist/minification-safe-lib.js
 * - npm/unpkg: https://unpkg.com/minification-safe-lib@latest/dist/minification-safe-lib.js
 * - jsDelivr: https://cdn.jsdelivr.net/npm/minification-safe-lib@latest/dist/minification-safe-lib.js
 * - GitHub Release: https://github.com/alice/minification-safe-lib/releases/download/v1.0.0/minification-safe-lib.js
 */

const minificationSafeLib = {
  // METADATA FUNCTION with embedded dependencies
  'MINIFICATION_SAFE_LIB_META': () => {
    return {
      type: 'library_info',
      module: 'github.com/alice/minification-safe-lib',
      name: 'Minification Safe Library',
      version: '1.0.0',
      author: 'Alice Developer',
      description: 'Example library that works with minified code',
      
      // ✅ DEPENDENCIES SURVIVE MINIFICATION (in runtime metadata)
      dependencies: {
        'github.com/shared/common-utils': 'v2.0.0',
        'github.com/math/advanced-math': 'latest',
        'lodash': '4.17.21'  // npm package example
      },
      
      // Optional: Additional dependency metadata
      peerDependencies: {
        'react': '^17.0.0'  // If this is a React component library
      },
      
      optionalDependencies: {
        'chart.js': '^3.0.0'  // Optional visualization support
      },
      
      functions: Object.keys(minificationSafeLib).filter(key => typeof minificationSafeLib[key] === 'function'),
      loaded: true,
      timestamp: new Date().toISOString(),
      
      // Build metadata (helpful for debugging)
      build: {
        minified: process.env.NODE_ENV === 'production',
        buildTime: '2024-01-15T10:30:00Z',
        webpack: '5.89.0'
      }
    };
  },

  // Example function that uses dependencies
  'PROCESS_DATA': (data, options = {}) => {
    try {
      // Access dependency through global namespace
      const commonUtils = minificationSafeLib.getDependency('github.com/shared/common-utils@v2.0.0');
      const mathLib = minificationSafeLib.getDependency('github.com/math/advanced-math@latest');
      
      if (!commonUtils || !mathLib) {
        throw new Error('Required dependencies not loaded');
      }
      
      // Use dependency functions
      const cleanedData = commonUtils.CLEAN_ARRAY(data);
      const processedData = mathLib.TRANSFORM_DATA(cleanedData, options.transform || 'normalize');
      
      return {
        type: 'processed_data',
        original_length: data.length,
        processed_length: processedData.length,
        data: processedData,
        options: options
      };
      
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  'VALIDATE_INPUT': (input, schema = {}) => {
    try {
      const commonUtils = minificationSafeLib.getDependency('github.com/shared/common-utils@v2.0.0');
      
      if (!commonUtils) {
        // Graceful degradation - basic validation without dependency
        return {
          type: 'validation_result',
          valid: input != null,
          errors: input == null ? ['Input is null or undefined'] : [],
          warnings: ['Advanced validation unavailable - missing dependency']
        };
      }
      
      // Use dependency for advanced validation
      const result = commonUtils.VALIDATE_OBJECT(input, schema);
      
      return {
        type: 'validation_result',
        valid: result.valid,
        errors: result.errors || [],
        warnings: result.warnings || []
      };
      
    } catch (error) {
      return { 
        type: 'validation_result',
        valid: false,
        errors: [error.message],
        warnings: []
      };
    }
  },

  // Helper method to access loaded dependencies
  getDependency: function(moduleName) {
    // Convert module name to namespace
    let namespaceName;
    
    if (moduleName.startsWith('github.com/')) {
      // GitHub module: "github.com/alice/lib@v1.0.0" -> "lib"
      namespaceName = moduleName.split('/').pop().split('@')[0];
    } else {
      // npm package: "lodash@4.17.21" -> "lodash"
      namespaceName = moduleName.split('@')[0];
    }
    
    // Try different global locations
    const locations = [
      typeof window !== 'undefined' ? window[namespaceName] : null,
      typeof global !== 'undefined' ? global[namespaceName] : null,
      typeof window !== 'undefined' ? window[moduleName] : null,
      typeof global !== 'undefined' ? global[moduleName] : null
    ];
    
    return locations.find(loc => loc && typeof loc === 'object');
  }
};

// MINIFICATION-SAFE EXPORT
// Use bracket notation to prevent minification from breaking the export
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { 'minification-safe-lib': minificationSafeLib };
  
  if (typeof global !== 'undefined') {
    global['minification-safe-lib'] = minificationSafeLib;
  }
} else if (typeof window !== 'undefined') {
  // Browser environment
  window['minification-safe-lib'] = minificationSafeLib;
  
  // Auto-register notification
  if (typeof window.Interpreter !== 'undefined' || typeof window.RexxInterpreter !== 'undefined') {
    console.log('✓ minification-safe-lib loaded and ready for REQUIRE (minification-safe)');
  }
}

/*
WEBPACK CONFIGURATION for minification-safe builds:

module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // Preserve function names for RexxJS detection
          keep_fnames: /.*_META$/,
          mangle: {
            // Don't mangle critical property names
            reserved: [
              'dependencies', 'peerDependencies', 'optionalDependencies',
              'type', 'module', 'name', 'version', 'loaded'
            ]
          },
          compress: {
            // Preserve function calls that return metadata
            pure_funcs: []
          },
          format: {
            // ✅ CRITICAL: Preserve /*! */ comments (jQuery-style)
            comments: /^\*!|@preserve|@license|@cc_on|@rexxjs-meta/i
          }
        }
      })
    ]
  }
};

BUILD SCRIPT EXAMPLE:

{
  "scripts": {
    "build": "webpack --mode=development",
    "build:prod": "NODE_ENV=production webpack --mode=production",
    "release": "npm run build && npm run build:prod",
    "publish:npm": "npm publish",
    "publish:github": "gh release create v$npm_package_version dist/minification-safe-lib.js dist/minification-safe-lib.min.js"
  }
}

PUBLISHING STRATEGY:

1. npm registry (for teams using npm):
   npm publish

2. GitHub releases (for RexxJS users):
   gh release create v1.0.0 dist/minification-safe-lib.js dist/minification-safe-lib.min.js

3. CDN availability (automatic):
   - unpkg.com/minification-safe-lib@1.0.0/dist/minification-safe-lib.js
   - cdn.jsdelivr.net/npm/minification-safe-lib@1.0.0/dist/minification-safe-lib.js

USAGE IN REXX:

```rexx
-- Load library (tries multiple sources automatically)
REQUIRE "github.com/alice/minification-safe-lib@v1.0.0"

-- Dependencies are automatically loaded first:
-- - github.com/shared/common-utils@v2.0.0
-- - github.com/math/advanced-math@latest  
-- - lodash@4.17.21

-- Use library functions
LET data = JSON_PARSE text="[1,2,3,null,5,'invalid',7]"
LET processed = PROCESS_DATA data=data

LET validation = VALIDATE_INPUT input=data schema="{\"type\":\"array\"}"
SAY validation.valid
```

BENEFITS:

✅ Works with minified code (dependencies in runtime metadata)
✅ Available from multiple sources (npm, GitHub, CDNs)
✅ Graceful degradation if dependencies unavailable
✅ Security scanner compatible (metadata preserved)  
✅ Standard build tooling compatible
✅ Both development and production builds supported

This approach solves both problems:
1. Teams can use standard npm publishing workflows
2. Dependencies survive minification via runtime metadata
*/