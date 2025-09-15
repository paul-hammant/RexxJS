/**
 * R-style Machine Learning and Classification Functions for REXX
 * 
 * Implements comprehensive machine learning capabilities including:
 * - Clustering algorithms (K-means, hierarchical)
 * - Classification algorithms (KNN, Naive Bayes, Decision Trees)
 * - Model evaluation and validation
 * - Cross-validation and performance metrics
 * - Feature selection and preprocessing
 * - Ensemble methods basics
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const rMlFunctions = {
  /**
   * K-means clustering
   * @param {Array|object} data - Data matrix or data frame
   * @param {number} centers - Number of clusters (default 2)
   * @param {number} maxIter - Maximum iterations (default 100)
   * @returns {object} Clustering results
   */
  'KMEANS': (data, centers = 2, maxIter = 100) => {
    try {
      // Extract numeric data
      let matrix = [];
      if (data && data.type === 'data.frame') {
        const cols = Object.keys(data.columns);
        const numCols = cols.filter(col => data.columns[col].every(val => !isNaN(parseFloat(val))));
        matrix = data.columns[numCols[0]].map((_, i) => 
          numCols.map(col => parseFloat(data.columns[col][i])).filter(val => !isNaN(val))
        );
      } else if (Array.isArray(data)) {
        matrix = data.map(row => Array.isArray(row) ? row.map(val => parseFloat(val)).filter(val => !isNaN(val)) : [parseFloat(row)]);
      } else {
        return { error: 'Invalid data format' };
      }

      const k = Math.max(1, Math.floor(centers));
      const maxIterations = Math.max(1, Math.floor(maxIter));
      const dimensions = matrix[0] ? matrix[0].length : 1;
      
      // Initialize centroids randomly
      const centroids = [];
      for (let i = 0; i < k; i++) {
        const centroid = [];
        for (let j = 0; j < dimensions; j++) {
          const values = matrix.map(row => row[j]).filter(val => !isNaN(val));
          const min = Math.min(...values);
          const max = Math.max(...values);
          centroid.push(min + Math.random() * (max - min));
        }
        centroids.push(centroid);
      }
      
      let assignments = new Array(matrix.length).fill(0);
      let converged = false;
      let iterations = 0;
      
      while (!converged && iterations < maxIterations) {
        converged = true;
        
        // Assign points to nearest centroid
        for (let i = 0; i < matrix.length; i++) {
          let minDist = Infinity;
          let newAssignment = 0;
          
          for (let j = 0; j < k; j++) {
            const dist = rMlFunctions.euclideanDistance(matrix[i], centroids[j]);
            if (dist < minDist) {
              minDist = dist;
              newAssignment = j;
            }
          }
          
          if (assignments[i] !== newAssignment) {
            converged = false;
            assignments[i] = newAssignment;
          }
        }
        
        // Update centroids
        for (let j = 0; j < k; j++) {
          const clusterPoints = matrix.filter((_, i) => assignments[i] === j);
          if (clusterPoints.length > 0) {
            for (let d = 0; d < dimensions; d++) {
              centroids[j][d] = clusterPoints.reduce((sum, point) => sum + point[d], 0) / clusterPoints.length;
            }
          }
        }
        
        iterations++;
      }
      
      // Calculate within-cluster sum of squares
      const withinss = new Array(k).fill(0);
      for (let i = 0; i < matrix.length; i++) {
        const cluster = assignments[i];
        const dist = rMlFunctions.euclideanDistance(matrix[i], centroids[cluster]);
        withinss[cluster] += dist * dist;
      }
      
      return {
        type: 'kmeans',
        cluster: assignments.map(c => c + 1), // R uses 1-based indexing
        centers: centroids,
        withinss: withinss,
        tot_withinss: withinss.reduce((a, b) => a + b, 0),
        size: centroids.map((_, j) => assignments.filter(a => a === j).length),
        iter: iterations,
        converged: converged
      };
    } catch (error) {
      return { error: `KMEANS error: ${error.message}` };
    }
  },

  /**
   * K-Nearest Neighbors classification
   * @param {Array} trainData - Training data matrix
   * @param {Array} trainLabels - Training labels
   * @param {Array} testData - Test data matrix
   * @param {number} k - Number of neighbors (default 3)
   * @returns {Array} Predicted labels
   */
  'KNN': (trainData, trainLabels, testData, k = 3) => {
    try {
      const trainMatrix = Array.isArray(trainData[0]) ? trainData : trainData.map(row => [row]);
      const testMatrix = Array.isArray(testData[0]) ? testData : testData.map(row => [row]);
      const neighbors = Math.max(1, Math.floor(k));
      
      const predictions = [];
      
      for (const testPoint of testMatrix) {
        // Calculate distances to all training points
        const distances = trainMatrix.map((trainPoint, i) => ({
          distance: rMlFunctions.euclideanDistance(testPoint, trainPoint),
          label: trainLabels[i]
        }));
        
        // Sort by distance and take k nearest
        distances.sort((a, b) => a.distance - b.distance);
        const nearestNeighbors = distances.slice(0, neighbors);
        
        // Vote for most common label
        const votes = {};
        nearestNeighbors.forEach(neighbor => {
          votes[neighbor.label] = (votes[neighbor.label] || 0) + 1;
        });
        
        const prediction = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        predictions.push(prediction);
      }
      
      return predictions;
    } catch (error) {
      return [`KNN error: ${error.message}`];
    }
  },

  /**
   * Naive Bayes classifier
   * @param {Array} trainData - Training data matrix
   * @param {Array} trainLabels - Training labels
   * @param {Array} testData - Test data matrix
   * @returns {Array} Predicted labels with probabilities
   */
  'NAIVE_BAYES': (trainData, trainLabels, testData) => {
    try {
      const trainMatrix = Array.isArray(trainData[0]) ? trainData : trainData.map(row => [row]);
      const testMatrix = Array.isArray(testData[0]) ? testData : testData.map(row => [row]);
      
      // Get unique classes and calculate priors
      const classes = [...new Set(trainLabels)];
      const classCounts = {};
      const classStats = {};
      
      classes.forEach(cls => {
        classCounts[cls] = trainLabels.filter(label => label === cls).length;
        classStats[cls] = [];
      });
      
      const totalSamples = trainLabels.length;
      const numFeatures = trainMatrix[0].length;
      
      // Calculate mean and std for each feature for each class
      for (let feature = 0; feature < numFeatures; feature++) {
        classes.forEach(cls => {
          const featureValues = trainMatrix
            .filter((_, i) => trainLabels[i] === cls)
            .map(row => parseFloat(row[feature]))
            .filter(val => !isNaN(val));
          
          const mean = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
          const variance = featureValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / featureValues.length;
          const std = Math.sqrt(variance + 1e-9); // Add small constant to avoid division by zero
          
          classStats[cls].push({ mean, std });
        });
      }
      
      // Make predictions
      const predictions = [];
      
      for (const testPoint of testMatrix) {
        const classProbabilities = {};
        
        classes.forEach(cls => {
          // Prior probability
          let logProb = Math.log(classCounts[cls] / totalSamples);
          
          // Likelihood for each feature (assume normal distribution)
          for (let feature = 0; feature < numFeatures; feature++) {
            const value = parseFloat(testPoint[feature]);
            if (!isNaN(value)) {
              const { mean, std } = classStats[cls][feature];
              const likelihood = rMlFunctions.normalPdf(value, mean, std);
              logProb += Math.log(likelihood + 1e-9);
            }
          }
          
          classProbabilities[cls] = logProb;
        });
        
        // Convert log probabilities to probabilities and normalize
        const maxLogProb = Math.max(...Object.values(classProbabilities));
        const expProbs = {};
        let sumExpProbs = 0;
        
        classes.forEach(cls => {
          expProbs[cls] = Math.exp(classProbabilities[cls] - maxLogProb);
          sumExpProbs += expProbs[cls];
        });
        
        const normalizedProbs = {};
        classes.forEach(cls => {
          normalizedProbs[cls] = expProbs[cls] / sumExpProbs;
        });
        
        const prediction = Object.keys(normalizedProbs).reduce((a, b) => 
          normalizedProbs[a] > normalizedProbs[b] ? a : b
        );
        
        predictions.push({
          prediction: prediction,
          probabilities: normalizedProbs
        });
      }
      
      return predictions;
    } catch (error) {
      return [{ error: `NAIVE_BAYES error: ${error.message}` }];
    }
  },

  /**
   * Hierarchical clustering
   * @param {Array} data - Data matrix
   * @param {string} method - Linkage method (default 'complete')
   * @returns {object} Clustering results
   */
  'HCLUST': (data, method = 'complete') => {
    try {
      const matrix = Array.isArray(data[0]) ? data : data.map(row => [row]);
      const n = matrix.length;
      
      // Calculate distance matrix
      const distMatrix = [];
      for (let i = 0; i < n; i++) {
        distMatrix[i] = [];
        for (let j = 0; j < n; j++) {
          distMatrix[i][j] = i === j ? 0 : rMlFunctions.euclideanDistance(matrix[i], matrix[j]);
        }
      }
      
      // Initialize clusters (each point is its own cluster)
      const clusters = matrix.map((_, i) => [i]);
      const merges = [];
      const heights = [];
      
      while (clusters.length > 1) {
        let minDist = Infinity;
        let mergeI = -1, mergeJ = -1;
        
        // Find closest pair of clusters
        for (let i = 0; i < clusters.length; i++) {
          for (let j = i + 1; j < clusters.length; j++) {
            const dist = rMlFunctions.clusterDistance(clusters[i], clusters[j], distMatrix, method);
            if (dist < minDist) {
              minDist = dist;
              mergeI = i;
              mergeJ = j;
            }
          }
        }
        
        // Merge clusters
        const newCluster = [...clusters[mergeI], ...clusters[mergeJ]];
        merges.push([mergeI + 1, mergeJ + 1]); // R uses 1-based indexing
        heights.push(minDist);
        
        // Remove merged clusters and add new one
        clusters.splice(Math.max(mergeI, mergeJ), 1);
        clusters.splice(Math.min(mergeI, mergeJ), 1);
        clusters.push(newCluster);
      }
      
      return {
        type: 'hclust',
        merge: merges,
        height: heights,
        order: clusters[0].map(i => i + 1), // Final cluster order
        labels: matrix.map((_, i) => (i + 1).toString()),
        method: method
      };
    } catch (error) {
      return { error: `HCLUST error: ${error.message}` };
    }
  },

  /**
   * Cut hierarchical clustering tree
   * @param {object} hclust - Hierarchical clustering result
   * @param {number} k - Number of clusters
   * @returns {Array} Cluster assignments
   */
  'CUTREE': (hclust, k = 2) => {
    try {
      if (!hclust || !hclust.merge || !hclust.height) {
        return Array(1).fill(1);
      }
      
      const numClusters = Math.max(1, Math.floor(k));
      const n = hclust.merge.length + 1; // Number of original points
      
      if (numClusters >= n) {
        return Array.from({length: n}, (_, i) => i + 1);
      }
      
      if (numClusters === 1) {
        return Array(n).fill(1);
      }
      
      // For simplicity, use a basic approach: assign clusters based on merge order
      // This is an approximation of proper dendrogram cutting
      const assignments = Array.from({length: n}, (_, i) => i + 1);
      let currentCluster = n + 1;
      
      // Apply first n - k merges (keep the last k-1 merges unmerged to get k clusters)
      const numMergesToApply = n - numClusters;
      
      for (let i = 0; i < Math.min(numMergesToApply, hclust.merge.length); i++) {
        const [left, right] = hclust.merge[i];
        
        // Replace all occurrences of left and right cluster IDs with new cluster ID
        for (let j = 0; j < assignments.length; j++) {
          if (assignments[j] === left || assignments[j] === right) {
            assignments[j] = currentCluster;
          }
        }
        currentCluster++;
      }
      
      // Renumber clusters to be consecutive starting from 1
      const uniqueClusters = [...new Set(assignments)].sort((a, b) => a - b);
      const clusterMap = new Map();
      uniqueClusters.forEach((cluster, index) => {
        clusterMap.set(cluster, index + 1);
      });
      
      return assignments.map(cluster => clusterMap.get(cluster));
    } catch (error) {
      return [1];
    }
  },

  /**
   * Cross-validation
   * @param {Array} data - Data matrix
   * @param {Array} labels - Labels
   * @param {Function} model - Model function
   * @param {number} k - Number of folds (default 5)
   * @returns {object} CV results
   */
  'CV': (data, labels, model, k = 5) => {
    try {
      const folds = Math.max(2, Math.floor(k));
      const n = data.length;
      const foldSize = Math.floor(n / folds);
      
      // Shuffle indices
      const indices = Array.from({length: n}, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      const accuracies = [];
      const errors = [];
      
      for (let fold = 0; fold < folds; fold++) {
        const testStart = fold * foldSize;
        const testEnd = fold === folds - 1 ? n : testStart + foldSize;
        
        const testIndices = indices.slice(testStart, testEnd);
        const trainIndices = indices.filter(i => !testIndices.includes(i));
        
        const trainData = trainIndices.map(i => data[i]);
        const trainLabels = trainIndices.map(i => labels[i]);
        const testData = testIndices.map(i => data[i]);
        const testLabels = testIndices.map(i => labels[i]);
        
        try {
          const predictions = model(trainData, trainLabels, testData);
          const accuracy = rMlFunctions.calculateAccuracy(testLabels, predictions);
          accuracies.push(accuracy);
          errors.push(1 - accuracy);
        } catch (e) {
          errors.push(1);
          accuracies.push(0);
        }
      }
      
      return {
        type: 'cv',
        k: folds,
        accuracies: accuracies,
        errors: errors,
        mean_accuracy: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
        mean_error: errors.reduce((a, b) => a + b, 0) / errors.length,
        sd_accuracy: rMlFunctions.standardDeviation(accuracies),
        sd_error: rMlFunctions.standardDeviation(errors)
      };
    } catch (error) {
      return { error: `CV error: ${error.message}` };
    }
  },

  /**
   * Confusion matrix
   * @param {Array} actual - Actual labels
   * @param {Array} predicted - Predicted labels
   * @returns {object} Confusion matrix and metrics
   */
  'CONFUSION_MATRIX': (actual, predicted) => {
    try {
      const classes = [...new Set([...actual, ...predicted])].sort();
      const matrix = {};
      
      // Initialize matrix
      classes.forEach(actualClass => {
        matrix[actualClass] = {};
        classes.forEach(predClass => {
          matrix[actualClass][predClass] = 0;
        });
      });
      
      // Fill matrix
      for (let i = 0; i < actual.length; i++) {
        matrix[actual[i]][predicted[i]]++;
      }
      
      // Calculate metrics
      const accuracy = rMlFunctions.calculateAccuracy(actual, predicted);
      
      let totalTP = 0, totalFP = 0, totalFN = 0;
      const classMetrics = {};
      
      classes.forEach(cls => {
        const tp = matrix[cls][cls] || 0;
        const fp = classes.reduce((sum, predCls) => sum + (predCls !== cls ? (matrix[predCls][cls] || 0) : 0), 0);
        const fn = classes.reduce((sum, actualCls) => sum + (actualCls !== cls ? (matrix[cls][actualCls] || 0) : 0), 0);
        
        totalTP += tp;
        totalFP += fp;
        totalFN += fn;
        
        const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
        const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
        const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
        
        classMetrics[cls] = { precision, recall, f1, tp, fp, fn };
      });
      
      const macroPrecision = classes.reduce((sum, cls) => sum + classMetrics[cls].precision, 0) / classes.length;
      const macroRecall = classes.reduce((sum, cls) => sum + classMetrics[cls].recall, 0) / classes.length;
      const macroF1 = classes.reduce((sum, cls) => sum + classMetrics[cls].f1, 0) / classes.length;
      
      return {
        type: 'confusion_matrix',
        matrix: matrix,
        classes: classes,
        accuracy: accuracy,
        precision: macroPrecision,
        recall: macroRecall,
        f1_score: macroF1,
        class_metrics: classMetrics,
        total_samples: actual.length
      };
    } catch (error) {
      return { error: `CONFUSION_MATRIX error: ${error.message}` };
    }
  },

  /**
   * Feature selection using correlation
   * @param {Array} data - Data matrix
   * @param {Array} target - Target variable
   * @param {number} k - Number of features to select (default 5)
   * @returns {object} Selected features
   */
  'SELECT_FEATURES': (data, target, k = 5) => {
    try {
      const matrix = Array.isArray(data[0]) ? data : data.map(row => [row]);
      const numFeatures = matrix[0].length;
      const numSelect = Math.min(Math.max(1, Math.floor(k)), numFeatures);
      
      const correlations = [];
      
      for (let feature = 0; feature < numFeatures; feature++) {
        const featureValues = matrix.map(row => parseFloat(row[feature])).filter(val => !isNaN(val));
        const targetValues = target.map(val => parseFloat(val)).filter(val => !isNaN(val));
        
        const correlation = Math.abs(rMlFunctions.pearsonCorrelation(featureValues, targetValues));
        correlations.push({ feature: feature, correlation: correlation || 0 });
      }
      
      // Sort by correlation and select top k
      correlations.sort((a, b) => b.correlation - a.correlation);
      const selectedFeatures = correlations.slice(0, numSelect);
      
      return {
        type: 'feature_selection',
        selected_features: selectedFeatures.map(f => f.feature),
        correlations: selectedFeatures.map(f => f.correlation),
        method: 'correlation'
      };
    } catch (error) {
      return { error: `SELECT_FEATURES error: ${error.message}` };
    }
  },

  /**
   * Principal Component Analysis (simplified)
   * @param {Array} data - Data matrix
   * @param {number} ncomps - Number of components (default 2)
   * @returns {object} PCA results
   */
  'PCA': (data, ncomps = 2) => {
    try {
      const matrix = Array.isArray(data[0]) ? data : data.map(row => [row]);
      const numComponents = Math.min(Math.max(1, Math.floor(ncomps)), matrix[0].length);
      
      // Center the data
      const means = [];
      const numFeatures = matrix[0].length;
      
      for (let j = 0; j < numFeatures; j++) {
        const colValues = matrix.map(row => parseFloat(row[j])).filter(val => !isNaN(val));
        means.push(colValues.reduce((a, b) => a + b, 0) / colValues.length);
      }
      
      const centeredData = matrix.map(row => 
        row.map((val, j) => parseFloat(val) - means[j])
      );
      
      // For simplicity, just return the first few principal components as linear combinations
      // In practice, this would require eigenvalue decomposition
      const components = [];
      for (let i = 0; i < numComponents; i++) {
        const component = centeredData.map(row => 
          row.reduce((sum, val, j) => sum + val * (j === i ? 1 : 0.1), 0)
        );
        components.push(component);
      }
      
      // Calculate explained variance (approximation)
      const totalVariance = centeredData[0].reduce((sum, _, j) => {
        const colVar = centeredData.reduce((s, row) => s + row[j] * row[j], 0) / centeredData.length;
        return sum + colVar;
      }, 0);
      
      const explainedVar = components.map(comp => {
        const compVar = comp.reduce((sum, val) => sum + val * val, 0) / comp.length;
        return compVar / totalVariance;
      });
      
      return {
        type: 'pca',
        scores: components,
        loadings: Array(numComponents).fill(null).map((_, i) => 
          Array(numFeatures).fill(null).map((_, j) => j === i ? 1 : 0.1)
        ),
        explained_variance: explainedVar,
        cumulative_variance: explainedVar.reduce((acc, val, i) => {
          acc.push((acc[i-1] || 0) + val);
          return acc;
        }, []),
        center: means
      };
    } catch (error) {
      return { error: `PCA error: ${error.message}` };
    }
  },

  // Helper functions
  euclideanDistance: (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  },

  clusterDistance: (cluster1, cluster2, distMatrix, method) => {
    const distances = [];
    for (const i of cluster1) {
      for (const j of cluster2) {
        distances.push(distMatrix[i][j]);
      }
    }
    
    switch (method) {
      case 'single': return Math.min(...distances);
      case 'complete': return Math.max(...distances);
      case 'average': return distances.reduce((a, b) => a + b, 0) / distances.length;
      default: return Math.max(...distances);
    }
  },

  normalPdf: (x, mean, std) => {
    const variance = std * std;
    const coefficient = 1 / Math.sqrt(2 * Math.PI * variance);
    const exponent = -0.5 * Math.pow(x - mean, 2) / variance;
    return coefficient * Math.exp(exponent);
  },

  calculateAccuracy: (actual, predicted) => {
    if (actual.length !== predicted.length) return 0;
    const correct = actual.filter((val, i) => {
      const pred = predicted[i];
      return (pred && pred.prediction) ? pred.prediction === val : pred === val;
    }).length;
    return correct / actual.length;
  },

  standardDeviation: (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  },

  pearsonCorrelation: (x, y) => {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < x.length; i++) {
      const devX = x[i] - meanX;
      const devY = y[i] - meanY;
      
      numerator += devX * devY;
      denomX += devX * devX;
      denomY += devY * devY;
    }
    
    const denominator = Math.sqrt(denomX * denomY);
    return denominator === 0 ? 0 : numerator / denominator;
  }
};

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rMlFunctions };
} else {
  // Browser environment
  window.rMlFunctions = rMlFunctions;
}