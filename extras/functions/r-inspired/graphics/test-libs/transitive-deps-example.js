/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Transitive Dependencies Example for RexxJS Libraries
 * 
 * This library demonstrates how to declare dependencies that will be
 * automatically resolved by the REQUIRE system.
 * 
 * Repository: https://github.com/alice/data-analysis
 * Module: github.com/alice/data-analysis
 * 
 * STANDARD DEPENDENCY DECLARATIONS (for security scanning tools):
 * @rexxjs-meta-start
 * {
 *   "dependencies": {
 *     "github.com/alice/math-utils": "latest",
 *     "github.com/bob/chart-lib": "^1.2.0", 
 *     "github.com/carol/statistics": "v2.1.0"
 *   },
 *   "devDependencies": {},
 *   "peerDependencies": {},
 *   "optionalDependencies": {}
 * }
 * @rexxjs-meta-end
 * 
 * Legacy format (still supported):
 * @dependencies github.com/alice/math-utils github.com/bob/chart-lib
 * @require github.com/carol/statistics@v2.1.0
 */

const dataAnalysis = {
  // PRIMARY DETECTION FUNCTION
  'DATA_ANALYSIS_MAIN': () => {
    return {
      type: 'library_info',
      module: 'github.com/alice/data-analysis',
      name: 'Data Analysis Library',
      version: '1.5.0',
      author: 'Alice Data Science',
      description: 'Advanced data analysis with charts and statistics',
      
      // Alternative way to declare dependencies (runtime metadata)
      dependencies: [
        'github.com/alice/math-utils',
        'github.com/bob/chart-lib', 
        'github.com/carol/statistics@v2.1.0'
      ],
      
      functions: Object.keys(dataAnalysis).filter(key => typeof dataAnalysis[key] === 'function'),
      loaded: true,
      timestamp: new Date().toISOString()
    };
  },

  // Functions that use dependencies
  'ANALYZE_DATASET': (dataset, options = {}) => {
    try {
      if (!Array.isArray(dataset) || dataset.length === 0) {
        throw new Error('ANALYZE_DATASET: dataset must be a non-empty array');
      }
      
      // Use math-utils dependency (assuming it's loaded)
      const mathUtils = dataAnalysis.getDependency('github.com/alice/math-utils');
      if (!mathUtils || !mathUtils.CALCULATE_STATISTICS) {
        throw new Error('Required dependency math-utils not available');
      }
      
      // Use statistics dependency
      const statsLib = dataAnalysis.getDependency('github.com/carol/statistics@v2.1.0');
      if (!statsLib || !statsLib.ADVANCED_STATISTICS) {
        throw new Error('Required dependency statistics not available');
      }
      
      // Perform analysis using dependencies
      const basicStats = mathUtils.CALCULATE_STATISTICS(dataset);
      const advancedStats = statsLib.ADVANCED_STATISTICS(dataset, {
        confidence_level: options.confidence_level || 0.95,
        test_type: options.test_type || 'two_tailed'
      });
      
      return {
        type: 'dataset_analysis',
        dataset_size: dataset.length,
        basic_statistics: basicStats,
        advanced_statistics: advancedStats,
        recommendations: dataAnalysis.generateRecommendations(basicStats, advancedStats),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  'CREATE_CHART': (data, chartType = 'line', options = {}) => {
    try {
      // Use chart-lib dependency
      const chartLib = dataAnalysis.getDependency('github.com/bob/chart-lib');
      if (!chartLib) {
        throw new Error('Required dependency chart-lib not available');
      }
      
      let chart;
      switch (chartType) {
        case 'line':
          chart = chartLib.CREATE_LINE_CHART(data, options);
          break;
        case 'bar':
          chart = chartLib.CREATE_BAR_CHART(data, options);
          break;
        case 'scatter':
          chart = chartLib.CREATE_SCATTEPLOT(data, options);
          break;
        case 'histogram':
          chart = chartLib.CREATE_HISTOGRAM(data, options);
          break;
        default:
          throw new Error(`Unsupported chart type: ${chartType}`);
      }
      
      return {
        type: 'chart_created',
        chart_type: chartType,
        data_points: Array.isArray(data) ? data.length : 0,
        chart: chart,
        options: options
      };
      
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  'CORRELATION_ANALYSIS': (datasetX, datasetY, method = 'pearson') => {
    try {
      const mathUtils = dataAnalysis.getDependency('github.com/alice/math-utils');
      const statsLib = dataAnalysis.getDependency('github.com/carol/statistics@v2.1.0');
      
      if (!mathUtils || !statsLib) {
        throw new Error('Required dependencies not available for correlation analysis');
      }
      
      const correlation = statsLib.CALCULATE_CORRELATION(datasetX, datasetY, method);
      const significance = statsLib.TEST_SIGNIFICANCE(correlation, datasetX.length);
      
      return {
        type: 'correlation_analysis',
        method: method,
        correlation_coefficient: correlation,
        significance: significance,
        sample_size: datasetX.length,
        interpretation: dataAnalysis.interpretCorrelation(correlation, significance)
      };
      
    } catch (error) {
      return { type: 'error', error: error.message };
    }
  },

  // Helper methods
  getDependency: function(moduleName) {
    // Helper to access loaded dependencies
    // In a real implementation, this would use the interpreter's registry
    const namespaceName = moduleName.split('/').pop().split('@')[0];
    
    if (typeof window !== 'undefined' && window[namespaceName]) {
      return window[namespaceName];
    } else if (typeof global !== 'undefined' && global[namespaceName]) {
      return global[namespaceName];
    }
    
    return null;
  },

  generateRecommendations: function(basicStats, advancedStats) {
    const recommendations = [];
    
    if (basicStats.sample_size < 30) {
      recommendations.push('Small sample size - consider collecting more data');
    }
    
    if (Math.abs(advancedStats.skewness) > 1) {
      recommendations.push('Data is highly skewed - consider transformation');
    }
    
    if (advancedStats.p_value > 0.05) {
      recommendations.push('Results not statistically significant at α=0.05');
    }
    
    return recommendations;
  },

  interpretCorrelation: function(correlation, significance) {
    let strength = 'none';
    const abs_r = Math.abs(correlation);
    
    if (abs_r > 0.9) strength = 'very strong';
    else if (abs_r > 0.7) strength = 'strong';
    else if (abs_r > 0.5) strength = 'moderate';
    else if (abs_r > 0.3) strength = 'weak';
    
    const direction = correlation > 0 ? 'positive' : 'negative';
    const significant = significance.p_value < 0.05 ? 'significant' : 'not significant';
    
    return `${strength} ${direction} correlation (${significant})`;
  }
};

// Export with dependency metadata
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 'data-analysis': dataAnalysis };
  if (typeof global !== 'undefined') {
    global['data-analysis'] = dataAnalysis;
  }
} else if (typeof window !== 'undefined') {
  window['data-analysis'] = dataAnalysis;
  
  if (typeof window.Interpreter !== 'undefined' || typeof window.RexxInterpreter !== 'undefined') {
    console.log('✓ github.com/alice/data-analysis loaded (with transitive dependencies)');
  }
}

/*
DEPENDENCY DECLARATION METHODS:

1. Comment-based declarations (parsed from source code):
   * @dependencies github.com/alice/math-utils github.com/bob/chart-lib
   * @require github.com/carol/statistics@v2.1.0

2. Runtime metadata (returned from detection function):
   dependencies: [
     'github.com/alice/math-utils',
     'github.com/bob/chart-lib',
     'github.com/carol/statistics@v2.1.0'
   ]

LOADING SEQUENCE:

When you call: REQUIRE "github.com/alice/data-analysis"

The system will:
1. Load github.com/alice/data-analysis
2. Parse its dependencies 
3. Recursively load each dependency:
   - github.com/alice/math-utils
   - github.com/bob/chart-lib  
   - github.com/carol/statistics@v2.1.0
4. Register all functions from all libraries
5. Verify no circular dependencies exist

USAGE IN REXX:

```rexx
-- Load main library (automatically loads all dependencies)
REQUIRE "github.com/alice/data-analysis"

-- Use functions that depend on other libraries
LET dataset = JSON_PARSE text="[1,2,3,4,5,6,7,8,9,10]"
LET analysis = ANALYZE_DATASET dataset=dataset

-- Create charts using the chart dependency
LET chart = CREATE_CHART data=dataset chartType="histogram"

-- Correlation analysis using statistics dependency  
LET datasetX = JSON_PARSE text="[1,2,3,4,5]"
LET datasetY = JSON_PARSE text="[2,4,6,8,10]"
LET correlation = CORRELATION_ANALYSIS datasetX=datasetX datasetY=datasetY method="pearson"
```

DEPENDENCY GRAPH INSPECTION:

```rexx
-- Get dependency information
LET depInfo = interpreter.getDependencyInfo()
LET loadOrder = interpreter.getLoadOrder()

-- Validate no circular dependencies
LET isValid = interpreter.validateNoCycles()
```

BENEFITS:
- Automatic dependency resolution
- Circular dependency detection  
- Proper load order (topological sort)
- Dependency caching across libraries
- Clear dependency visualization
- Version-specific dependencies (@v2.1.0)
*/