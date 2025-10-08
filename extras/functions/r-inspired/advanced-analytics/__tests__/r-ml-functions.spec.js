/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rMlFunctions } = require('./r-ml-functions');

describe('R Machine Learning and Classification Functions', () => {
  describe('KMEANS', () => {
    test('should perform k-means clustering on 2D data', () => {
      const data = [
        [1, 2], [1, 4], [1, 0],
        [10, 2], [10, 4], [10, 0]
      ];
      
      const result = rMlFunctions.KMEANS(data, 2, 50);
      
      expect(result.type).toBe('kmeans');
      expect(result.cluster).toHaveLength(6);
      expect(result.centers).toHaveLength(2);
      expect(result.centers[0]).toHaveLength(2);
      expect(result.size.reduce((a, b) => a + b, 0)).toBe(6);
      expect(result.converged).toBeDefined();
    });

    test('should handle single cluster', () => {
      const data = [[1, 2], [3, 4], [5, 6]];
      const result = rMlFunctions.KMEANS(data, 1);
      
      expect(result.cluster).toEqual([1, 1, 1]);
      expect(result.centers).toHaveLength(1);
      expect(result.size[0]).toBe(3);
    });

    test('should handle data frame format', () => {
      const dataFrame = {
        type: 'data.frame',
        columns: {
          x: [1, 2, 3, 10, 11, 12],
          y: [1, 2, 3, 10, 11, 12]
        }
      };
      
      const result = rMlFunctions.KMEANS(dataFrame, 2);
      expect(result.type).toBe('kmeans');
      expect(result.cluster).toHaveLength(6);
    });

    test('should handle invalid data', () => {
      const result = rMlFunctions.KMEANS(null, 2);
      expect(result.error).toBeDefined();
    });
  });

  describe('KNN', () => {
    test('should classify using k-nearest neighbors', () => {
      const trainData = [
        [1, 2], [2, 3], [3, 4],
        [10, 11], [11, 12], [12, 13]
      ];
      const trainLabels = ['A', 'A', 'A', 'B', 'B', 'B'];
      const testData = [[2, 2], [11, 11]];
      
      const predictions = rMlFunctions.KNN(trainData, trainLabels, testData, 3);
      
      expect(predictions).toHaveLength(2);
      expect(predictions[0]).toBe('A');
      expect(predictions[1]).toBe('B');
    });

    test('should handle 1D data', () => {
      const trainData = [1, 2, 3, 10, 11, 12];
      const trainLabels = ['A', 'A', 'A', 'B', 'B', 'B'];
      const testData = [2, 11];
      
      const predictions = rMlFunctions.KNN(trainData, trainLabels, testData, 1);
      
      expect(predictions).toHaveLength(2);
      expect(typeof predictions[0]).toBe('string');
    });

    test('should handle k=1', () => {
      const trainData = [[1, 1], [5, 5]];
      const trainLabels = ['A', 'B'];
      const testData = [[2, 2]];
      
      const predictions = rMlFunctions.KNN(trainData, trainLabels, testData, 1);
      
      expect(predictions).toEqual(['A']);
    });

    test('should handle empty test data', () => {
      const predictions = rMlFunctions.KNN([[1, 1]], ['A'], [], 1);
      expect(predictions).toEqual([]);
    });
  });

  describe('NAIVE_BAYES', () => {
    test('should classify using Naive Bayes', () => {
      const trainData = [
        [1, 2], [2, 3], [1, 3],
        [5, 6], [6, 7], [5, 7]
      ];
      const trainLabels = ['A', 'A', 'A', 'B', 'B', 'B'];
      const testData = [[1.5, 2.5], [5.5, 6.5]];
      
      const predictions = rMlFunctions.NAIVE_BAYES(trainData, trainLabels, testData);
      
      expect(predictions).toHaveLength(2);
      expect(predictions[0].prediction).toBe('A');
      expect(predictions[1].prediction).toBe('B');
      expect(predictions[0].probabilities).toBeDefined();
      expect(predictions[0].probabilities.A).toBeDefined();
      expect(predictions[0].probabilities.B).toBeDefined();
    });

    test('should handle single feature', () => {
      const trainData = [1, 2, 3, 8, 9, 10];
      const trainLabels = ['A', 'A', 'A', 'B', 'B', 'B'];
      const testData = [2, 9];
      
      const predictions = rMlFunctions.NAIVE_BAYES(trainData, trainLabels, testData);
      
      expect(predictions).toHaveLength(2);
      expect(predictions[0].prediction).toBe('A');
      expect(predictions[1].prediction).toBe('B');
    });

    test('should normalize probabilities', () => {
      const trainData = [[1, 1], [2, 2]];
      const trainLabels = ['A', 'B'];
      const testData = [[1.5, 1.5]];
      
      const predictions = rMlFunctions.NAIVE_BAYES(trainData, trainLabels, testData);
      
      const probSum = Object.values(predictions[0].probabilities).reduce((a, b) => a + b, 0);
      expect(probSum).toBeCloseTo(1.0, 5);
    });
  });

  describe('HCLUST', () => {
    test('should perform hierarchical clustering', () => {
      const data = [
        [1, 2], [2, 3], [1, 3],
        [8, 9], [9, 10], [8, 10]
      ];
      
      const result = rMlFunctions.HCLUST(data, 'complete');
      
      expect(result.type).toBe('hclust');
      expect(result.merge).toHaveLength(5); // n-1 merges for n points
      expect(result.height).toHaveLength(5);
      expect(result.method).toBe('complete');
      expect(result.labels).toHaveLength(6);
      
      // Heights should be increasing (or at least non-decreasing)
      for (let i = 1; i < result.height.length; i++) {
        expect(result.height[i]).toBeGreaterThanOrEqual(result.height[i-1]);
      }
    });

    test('should handle single linkage', () => {
      const data = [[1, 1], [2, 2], [10, 10]];
      const result = rMlFunctions.HCLUST(data, 'single');
      
      expect(result.method).toBe('single');
      expect(result.merge).toHaveLength(2);
    });

    test('should handle average linkage', () => {
      const data = [[1, 1], [3, 3], [5, 5]];
      const result = rMlFunctions.HCLUST(data, 'average');
      
      expect(result.method).toBe('average');
      expect(result.height).toHaveLength(2);
    });

    test('should handle 1D data', () => {
      const data = [1, 5, 10];
      const result = rMlFunctions.HCLUST(data);
      
      expect(result.type).toBe('hclust');
      expect(result.merge).toHaveLength(2);
    });
  });

  describe('CUTREE', () => {
    test('should cut hierarchical clustering tree', () => {
      const data = [[1, 1], [2, 2], [10, 10], [11, 11]];
      const hclust = rMlFunctions.HCLUST(data);
      
      const clusters = rMlFunctions.CUTREE(hclust, 2);
      
      expect(clusters).toHaveLength(4);
      expect(Math.min(...clusters)).toBe(1);
      
      // Should produce some clustering (not all in one cluster when k=2)
      const uniqueClusters = [...new Set(clusters)];
      expect(uniqueClusters.length).toBeGreaterThan(1);
      expect(uniqueClusters.length).toBeLessThanOrEqual(4);
    });

    test('should handle k=1', () => {
      const hclust = { merge: [[1, 2], [3, 4]], height: [1, 2] };
      const clusters = rMlFunctions.CUTREE(hclust, 1);
      
      expect(clusters.every(c => c === 1)).toBe(true);
    });

    test('should handle k >= n', () => {
      const hclust = { merge: [[1, 2]], height: [1] };
      const clusters = rMlFunctions.CUTREE(hclust, 5);
      
      expect(clusters).toEqual([1, 2]);
    });

    test('should handle invalid hclust', () => {
      const clusters = rMlFunctions.CUTREE(null, 2);
      expect(clusters).toEqual([1]);
    });
  });

  describe('CV (Cross-Validation)', () => {
    test('should perform cross-validation', () => {
      const data = [
        [1, 1], [2, 2], [3, 3], [4, 4], [5, 5],
        [10, 10], [11, 11], [12, 12], [13, 13], [14, 14]
      ];
      const labels = ['A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B'];
      
      const knnModel = (trainData, trainLabels, testData) => {
        return rMlFunctions.KNN(trainData, trainLabels, testData, 1);
      };
      
      const cvResult = rMlFunctions.CV(data, labels, knnModel, 5);
      
      expect(cvResult.type).toBe('cv');
      expect(cvResult.k).toBe(5);
      expect(cvResult.accuracies).toHaveLength(5);
      expect(cvResult.errors).toHaveLength(5);
      expect(cvResult.mean_accuracy).toBeDefined();
      expect(cvResult.mean_error).toBeDefined();
      expect(cvResult.sd_accuracy).toBeDefined();
      expect(cvResult.sd_error).toBeDefined();
      
      expect(cvResult.mean_accuracy).toBeGreaterThan(0);
      expect(cvResult.mean_accuracy).toBeLessThanOrEqual(1);
      expect(cvResult.mean_error).toBeCloseTo(1 - cvResult.mean_accuracy, 5);
    });

    test('should handle k=2', () => {
      const data = [[1, 1], [2, 2], [3, 3], [4, 4]];
      const labels = ['A', 'A', 'B', 'B'];
      
      const mockModel = (trainData, trainLabels, testData) => {
        return testData.map(() => 'A');
      };
      
      const cvResult = rMlFunctions.CV(data, labels, mockModel, 2);
      
      expect(cvResult.k).toBe(2);
      expect(cvResult.accuracies).toHaveLength(2);
    });

    test('should handle model errors gracefully', () => {
      const data = [[1], [2]];
      const labels = ['A', 'B'];
      
      const errorModel = () => {
        throw new Error('Model error');
      };
      
      const cvResult = rMlFunctions.CV(data, labels, errorModel, 2);
      
      expect(cvResult.mean_accuracy).toBe(0);
      expect(cvResult.mean_error).toBe(1);
    });
  });

  describe('CONFUSION_MATRIX', () => {
    test('should create confusion matrix', () => {
      const actual = ['A', 'A', 'B', 'B', 'C', 'C'];
      const predicted = ['A', 'B', 'B', 'B', 'C', 'A'];
      
      const result = rMlFunctions.CONFUSION_MATRIX(actual, predicted);
      
      expect(result.type).toBe('confusion_matrix');
      expect(result.classes).toEqual(['A', 'B', 'C']);
      expect(result.matrix).toBeDefined();
      expect(result.accuracy).toBeDefined();
      expect(result.precision).toBeDefined();
      expect(result.recall).toBeDefined();
      expect(result.f1_score).toBeDefined();
      expect(result.class_metrics).toBeDefined();
      expect(result.total_samples).toBe(6);
      
      // Check specific confusion matrix values
      expect(result.matrix.A.A).toBe(1); // True positives for A
      expect(result.matrix.A.B).toBe(1); // False positives for B (A predicted as B)
      expect(result.matrix.B.B).toBe(2); // True positives for B
    });

    test('should handle perfect classification', () => {
      const actual = ['A', 'B', 'C'];
      const predicted = ['A', 'B', 'C'];
      
      const result = rMlFunctions.CONFUSION_MATRIX(actual, predicted);
      
      expect(result.accuracy).toBe(1.0);
      expect(result.precision).toBe(1.0);
      expect(result.recall).toBe(1.0);
      expect(result.f1_score).toBe(1.0);
    });

    test('should handle binary classification', () => {
      const actual = ['A', 'A', 'B', 'B'];
      const predicted = ['A', 'B', 'A', 'B'];
      
      const result = rMlFunctions.CONFUSION_MATRIX(actual, predicted);
      
      expect(result.classes).toEqual(['A', 'B']);
      expect(result.accuracy).toBe(0.5);
      expect(result.matrix.A.A).toBe(1);
      expect(result.matrix.A.B).toBe(1);
      expect(result.matrix.B.A).toBe(1);
      expect(result.matrix.B.B).toBe(1);
    });

    test('should handle empty arrays', () => {
      const result = rMlFunctions.CONFUSION_MATRIX([], []);
      expect(result.total_samples).toBe(0);
    });
  });

  describe('SELECT_FEATURES', () => {
    test('should select features based on correlation', () => {
      const data = [
        [1, 10, 100, 0.1], [2, 20, 200, 0.2], [3, 30, 300, 0.3],
        [4, 40, 400, 0.4], [5, 50, 500, 0.5]
      ];
      const target = [1, 2, 3, 4, 5];
      
      const result = rMlFunctions.SELECT_FEATURES(data, target, 2);
      
      expect(result.type).toBe('feature_selection');
      expect(result.selected_features).toHaveLength(2);
      expect(result.correlations).toHaveLength(2);
      expect(result.method).toBe('correlation');
      
      // Features 0, 1, 2 should have high correlation, feature 3 should have lower
      expect(result.selected_features).toContain(0);
      expect(result.correlations[0]).toBeCloseTo(1, 1);
    });

    test('should handle k > number of features', () => {
      const data = [[1, 2], [3, 4]];
      const target = [1, 2];
      
      const result = rMlFunctions.SELECT_FEATURES(data, target, 5);
      
      expect(result.selected_features).toHaveLength(2);
    });

    test('should handle 1D data', () => {
      const data = [1, 2, 3, 4, 5];
      const target = [2, 4, 6, 8, 10];
      
      const result = rMlFunctions.SELECT_FEATURES(data, target, 1);
      
      expect(result.selected_features).toEqual([0]);
      expect(result.correlations[0]).toBeCloseTo(1, 1);
    });
  });

  describe('PCA', () => {
    test('should perform principal component analysis', () => {
      const data = [
        [1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]
      ];
      
      const result = rMlFunctions.PCA(data, 2);
      
      expect(result.type).toBe('pca');
      expect(result.scores).toHaveLength(2);
      expect(result.scores[0]).toHaveLength(4); // Same as number of samples
      expect(result.loadings).toHaveLength(2);
      expect(result.loadings[0]).toHaveLength(3); // Same as number of features
      expect(result.explained_variance).toHaveLength(2);
      expect(result.cumulative_variance).toHaveLength(2);
      expect(result.center).toHaveLength(3);
      
      // Check that explained variance is between 0 and 1
      result.explained_variance.forEach(ev => {
        expect(ev).toBeGreaterThanOrEqual(0);
        expect(ev).toBeLessThanOrEqual(1);
      });
      
      // Cumulative variance should be increasing
      for (let i = 1; i < result.cumulative_variance.length; i++) {
        expect(result.cumulative_variance[i]).toBeGreaterThanOrEqual(result.cumulative_variance[i-1]);
      }
    });

    test('should handle ncomps > number of features', () => {
      const data = [[1, 2], [3, 4]];
      const result = rMlFunctions.PCA(data, 5);
      
      expect(result.scores).toHaveLength(2); // Limited by number of features
      expect(result.loadings).toHaveLength(2);
    });

    test('should center the data', () => {
      const data = [[10, 20], [30, 40], [50, 60]];
      const result = rMlFunctions.PCA(data, 1);
      
      expect(result.center).toEqual([30, 40]); // Means of each column
    });

    test('should handle 1D data', () => {
      const data = [1, 2, 3, 4, 5];
      const result = rMlFunctions.PCA(data, 1);
      
      expect(result.type).toBe('pca');
      expect(result.scores).toHaveLength(1);
    });
  });

  // Helper function tests
  describe('Helper Functions', () => {
    describe('euclideanDistance', () => {
      test('should calculate Euclidean distance', () => {
        const dist = rMlFunctions.euclideanDistance([0, 0], [3, 4]);
        expect(dist).toBe(5);
      });

      test('should handle same points', () => {
        const dist = rMlFunctions.euclideanDistance([1, 2], [1, 2]);
        expect(dist).toBe(0);
      });

      test('should handle different dimensions', () => {
        const dist = rMlFunctions.euclideanDistance([1, 2], [1, 2, 3]);
        expect(dist).toBe(0); // Should handle gracefully
      });
    });

    describe('calculateAccuracy', () => {
      test('should calculate accuracy correctly', () => {
        const actual = ['A', 'B', 'C', 'A'];
        const predicted = ['A', 'B', 'A', 'A'];
        const accuracy = rMlFunctions.calculateAccuracy(actual, predicted);
        expect(accuracy).toBe(0.75); // 3 out of 4 correct
      });

      test('should handle prediction objects', () => {
        const actual = ['A', 'B'];
        const predicted = [{ prediction: 'A' }, { prediction: 'C' }];
        const accuracy = rMlFunctions.calculateAccuracy(actual, predicted);
        expect(accuracy).toBe(0.5);
      });

      test('should handle perfect accuracy', () => {
        const actual = ['A', 'B', 'C'];
        const predicted = ['A', 'B', 'C'];
        const accuracy = rMlFunctions.calculateAccuracy(actual, predicted);
        expect(accuracy).toBe(1.0);
      });

      test('should handle zero accuracy', () => {
        const actual = ['A', 'B', 'C'];
        const predicted = ['X', 'Y', 'Z'];
        const accuracy = rMlFunctions.calculateAccuracy(actual, predicted);
        expect(accuracy).toBe(0.0);
      });
    });

    describe('pearsonCorrelation', () => {
      test('should calculate perfect positive correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [2, 4, 6, 8, 10];
        const corr = rMlFunctions.pearsonCorrelation(x, y);
        expect(corr).toBeCloseTo(1.0, 5);
      });

      test('should calculate perfect negative correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [5, 4, 3, 2, 1];
        const corr = rMlFunctions.pearsonCorrelation(x, y);
        expect(corr).toBeCloseTo(-1.0, 5);
      });

      test('should calculate no correlation', () => {
        const x = [1, 2, 3, 4, 5];
        const y = [1, 1, 1, 1, 1];
        const corr = rMlFunctions.pearsonCorrelation(x, y);
        expect(corr).toBe(0);
      });

      test('should handle empty arrays', () => {
        const corr = rMlFunctions.pearsonCorrelation([], []);
        expect(corr).toBe(0);
      });

      test('should handle different length arrays', () => {
        const corr = rMlFunctions.pearsonCorrelation([1, 2], [1, 2, 3]);
        expect(corr).toBe(0);
      });
    });

    describe('standardDeviation', () => {
      test('should calculate standard deviation', () => {
        const values = [2, 4, 4, 4, 5, 5, 7, 9];
        const std = rMlFunctions.standardDeviation(values);
        expect(std).toBeCloseTo(2, 0);
      });

      test('should handle constant values', () => {
        const values = [5, 5, 5, 5];
        const std = rMlFunctions.standardDeviation(values);
        expect(std).toBe(0);
      });

      test('should handle single value', () => {
        const std = rMlFunctions.standardDeviation([42]);
        expect(std).toBe(0);
      });
    });

    describe('normalPdf', () => {
      test('should calculate normal PDF at mean', () => {
        const pdf = rMlFunctions.normalPdf(0, 0, 1);
        expect(pdf).toBeCloseTo(0.3989, 4); // 1/sqrt(2π)
      });

      test('should handle different parameters', () => {
        const pdf = rMlFunctions.normalPdf(5, 5, 2);
        expect(pdf).toBeCloseTo(0.1995, 4); // 1/sqrt(2π*4)
      });

      test('should be symmetric around mean', () => {
        const pdf1 = rMlFunctions.normalPdf(2, 5, 1);
        const pdf2 = rMlFunctions.normalPdf(8, 5, 1);
        expect(pdf1).toBeCloseTo(pdf2, 10);
      });
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    test('should work together in ML pipeline', () => {
      // Generate sample data
      const data = [];
      const labels = [];
      
      // Class A: points around (2, 2)
      for (let i = 0; i < 10; i++) {
        data.push([2 + Math.random() * 2, 2 + Math.random() * 2]);
        labels.push('A');
      }
      
      // Class B: points around (8, 8)
      for (let i = 0; i < 10; i++) {
        data.push([8 + Math.random() * 2, 8 + Math.random() * 2]);
        labels.push('B');
      }
      
      // Test data
      const testData = [[3, 3], [9, 9]];
      
      // 1. K-means clustering
      const clusters = rMlFunctions.KMEANS(data, 2);
      expect(clusters.type).toBe('kmeans');
      expect(clusters.cluster).toHaveLength(20);
      
      // 2. KNN classification
      const knnPredictions = rMlFunctions.KNN(data, labels, testData, 3);
      expect(knnPredictions[0]).toBe('A');
      expect(knnPredictions[1]).toBe('B');
      
      // 3. Feature selection
      const features = rMlFunctions.SELECT_FEATURES(data, labels.map(l => l === 'A' ? 0 : 1), 2);
      expect(features.selected_features).toHaveLength(2);
      
      // 4. Confusion matrix
      const confMatrix = rMlFunctions.CONFUSION_MATRIX(labels.slice(0, 4), ['A', 'A', 'B', 'B']);
      expect(confMatrix.type).toBe('confusion_matrix');
    });

    test('should handle clustering and tree cutting workflow', () => {
      const data = [
        [1, 1], [1.5, 1.5], [2, 2],
        [8, 8], [8.5, 8.5], [9, 9]
      ];
      
      // 1. Hierarchical clustering
      const hclust = rMlFunctions.HCLUST(data, 'complete');
      expect(hclust.type).toBe('hclust');
      
      // 2. Cut tree
      const clusters = rMlFunctions.CUTREE(hclust, 2);
      expect(clusters).toHaveLength(6);
      expect(Math.min(...clusters)).toBe(1);
      
      // Should produce some clustering (function works)
      const uniqueClusters = [...new Set(clusters)];
      expect(uniqueClusters.length).toBeGreaterThan(1);
      expect(uniqueClusters.length).toBeLessThanOrEqual(6);
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    test('should handle null inputs gracefully', () => {
      expect(() => rMlFunctions.KMEANS(null)).not.toThrow();
      expect(() => rMlFunctions.KNN(null, null, null)).not.toThrow();
      expect(() => rMlFunctions.NAIVE_BAYES(null, null, null)).not.toThrow();
      expect(() => rMlFunctions.HCLUST(null)).not.toThrow();
      expect(() => rMlFunctions.PCA(null)).not.toThrow();
    });

    test('should return error objects for invalid inputs', () => {
      const kmeans = rMlFunctions.KMEANS('invalid');
      expect(kmeans.error).toBeDefined();
      
      const hclust = rMlFunctions.HCLUST('invalid');
      expect(hclust.error).toBeDefined();
      
      const pca = rMlFunctions.PCA('invalid');
      expect(pca.error).toBeDefined();
    });

    test('should handle empty data arrays', () => {
      const empty = [];
      
      expect(() => rMlFunctions.KNN(empty, empty, empty)).not.toThrow();
      expect(() => rMlFunctions.NAIVE_BAYES(empty, empty, empty)).not.toThrow();
      expect(() => rMlFunctions.SELECT_FEATURES(empty, empty)).not.toThrow();
    });
  });
});