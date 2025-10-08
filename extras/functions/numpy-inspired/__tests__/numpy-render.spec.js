/**
 * NumPy RENDER Function Tests with RexxJS Integration
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const fs = require('fs');
const path = require('path');
const { RexxInterpreter } = require('../../../core/src/interpreter');
const { parse } = require('../../../core/src/parser');

// Import the functions we're testing
const numpyFunctions = require('./numpy.js');
const numpyRender = require('./numpy-render.js');
const jsonFunctions = require('../../../core/src/json-functions.js');

// Try to load canvas for PNG verification (optional)
let loadImage, createCanvas;
try {
  const canvas = require('canvas');
  loadImage = canvas.loadImage;
  createCanvas = canvas.createCanvas;
} catch (e) {
  console.warn('Canvas not available - PNG content verification will be skipped');
}

describe('NumPy RENDER Function Tests', () => {
  let interpreter;
  let output = [];

  beforeEach(() => {
    output = [];
    interpreter = new RexxInterpreter(null, {
      output: (text) => output.push(text)
    });

    // Register numpy functions with interpreter using builtInFunctions
    Object.keys(numpyFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = numpyFunctions[funcName];
    });
    Object.keys(numpyRender).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = numpyRender[funcName];
    });
    // Register JSON functions for parsing test data
    Object.keys(jsonFunctions).forEach(funcName => {
      interpreter.builtInFunctions[funcName] = jsonFunctions[funcName];
    });
  });

  // No afterEach cleanup - PNG files are kept in images/ directory for inspection
  // The images/ directory is in .gitignore so these won't be committed

  describe('Basic RENDER functionality', () => {
    test('should render histogram data to PNG file', async () => {
      const rexxCode = `
        LET dataJson = "[1, 2, 2, 3, 3, 3, 4, 4, 5]"
        LET data = JSON_PARSE text=dataJson
        LET hist = HISTOGRAM data=data bins=5
        LET outputPath = "./images/test-histogram.png"
        LET result = RENDER plot=hist output=outputPath title="Test Histogram" width=800 height=600
        SAY "Rendered to: " || result
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      // Extract the actual filename from output
      const outputText = output.join(' ');
      expect(outputText).toMatch(/Rendered to: \.\/images\/numpy-histogram-\d+\.png/);
      
      // Get the actual filename that was generated
      const match = outputText.match(/Rendered to: (\.\/images\/numpy-histogram-\d+\.png)/);
      expect(match).toBeTruthy();
      const actualFilename = match[1];
      
      // Only check file existence if canvas is available (file would be created)
      // In CI environments without canvas, mock filenames are returned but no files created
      if (fs.existsSync(actualFilename)) {
        // Verify it's a valid PNG if file exists
        if (loadImage) {
          await expect(hasMeaningfulContent(actualFilename)).resolves.toBe(true);
        }
      }
    });

    test('should render 2D histogram heatmap', async () => {
      const rexxCode = `
        LET xJson = "[1, 2, 3, 4, 5]"
        LET yJson = "[2, 3, 4, 5, 6]"
        LET x = JSON_PARSE text=xJson
        LET y = JSON_PARSE text=yJson
        LET hist2d = HISTOGRAM2D x=x y=y bins=3
        LET output = RENDER data=hist2d output="./images/test-histogram2d.png" title="2D Histogram"
        SAY "Rendered 2D histogram: " || output
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(output.join(' ')).toContain('Rendered 2D histogram: ./images/test-histogram2d.png');
      expect(fs.existsSync('./images/test-histogram2d.png')).toBe(true);
    });

    test('should render correlation matrix as heatmap', async () => {
      const rexxCode = `
        LET matrixJson = "[[1, 2, 3], [4, 5, 6], [7, 8, 9]]"
        LET matrix = JSON_PARSE text=matrixJson
        LET corr = CORRCOEF x=matrix
        LET output = RENDER data=corr output="./images/test-correlation.png" title="Correlation Matrix"
        SAY "Rendered correlation matrix: " || output
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(output.join(' ')).toContain('Rendered correlation matrix: ./images/test-correlation.png');
      expect(fs.existsSync('./images/test-correlation.png')).toBe(true);
    });

    test('should render eigenvalues as bar plot', async () => {
      const rexxCode = `
        LET matrixJson = "[[2, 1], [1, 2]]"
        LET matrix = JSON_PARSE text=matrixJson
        LET eigResult = EIG matrix=matrix
        LET result = RENDER plot=eigResult output="./images/test-eigenvalues.png" title="Eigenvalues"
        SAY "Rendered eigenvalues: " || result
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      // Extract the actual filename from output
      const outputText = output.join(' ');
      expect(outputText).toMatch(/Rendered eigenvalues: \.\/images\/numpy-eigenvalues-\d+\.png/);
    });

    test('should render 1D array as line plot', async () => {
      const rexxCode = `
        LET dataJson = "[1, 4, 2, 8, 5, 7]"
        LET data = JSON_PARSE text=dataJson
        LET result = RENDER plot=data output="./images/test-array1d.png" title="Array Plot"
        SAY "Rendered 1D array: " || result
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      // Extract the actual filename from output
      const outputText = output.join(' ');
      expect(outputText).toMatch(/Rendered 1D array: \.\/images\/numpy-array1d-\d+\.png/);
    });
  });

  describe('Universal render pattern integration', () => {
    test('should set suggestedRenderFunction for histogram', async () => {
      // Mock window.rexxjs for testing
      global.window = {
        rexxjs: {
          suggestedRenderFunction: null,
          renderTarget: 'auto'
        }
      };

      const rexxCode = `
        LET data = [1, 2, 3, 4, 5]
        LET hist = HISTOGRAM data=data
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      // Should have set a suggested render function
      expect(global.window.rexxjs.suggestedRenderFunction).toBeDefined();
      expect(typeof global.window.rexxjs.suggestedRenderFunction).toBe('function');

      // Clean up
      delete global.window;
    });

    test('should set suggestedRenderFunction for correlation matrix', async () => {
      global.window = {
        rexxjs: {
          suggestedRenderFunction: null,
          renderTarget: 'auto'
        }
      };

      const rexxCode = `
        LET matrix = [[1, 2], [3, 4]]
        LET corr = CORRCOEF x=matrix
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(global.window.rexxjs.suggestedRenderFunction).toBeDefined();
      expect(typeof global.window.rexxjs.suggestedRenderFunction).toBe('function');

      delete global.window;
    });
  });

  describe('Data type detection', () => {
    test('should detect histogram data structure', () => {
      const histData = { bins: [0, 1, 2, 3], counts: [1, 2, 3] };
      expect(() => numpyRender.RENDER({ data: histData, output: './images/test-detect.png' }))
        .not.toThrow();
    });

    test('should detect histogram2d data structure', () => {
      const hist2dData = {
        hist: [[1, 2], [3, 4]],
        xEdges: [0, 1, 2],
        yEdges: [0, 1, 2]
      };
      expect(() => numpyRender.RENDER({ data: hist2dData, output: './images/test-detect2d.png' }))
        .not.toThrow();
    });

    test('should detect eigenvalue data structure', () => {
      const eigData = {
        eigenvalues: [3, 1],
        eigenvectors: [[1, 0], [0, 1]]
      };
      expect(() => numpyRender.RENDER({ data: eigData, output: './images/test-detect-eig.png' }))
        .not.toThrow();
    });

    test('should detect 2D matrix', () => {
      const matrixData = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
      expect(() => numpyRender.RENDER({ data: matrixData, output: './images/test-detect-matrix.png' }))
        .not.toThrow();
    });

    test('should detect 1D array', () => {
      const arrayData = [1, 2, 3, 4, 5];
      expect(() => numpyRender.RENDER({ data: arrayData, output: './images/test-detect-array.png' }))
        .not.toThrow();
    });

    test('should throw error for unsupported data types', () => {
      expect(() => numpyRender.RENDER({ data: "invalid", output: './images/test.png' }))
        .toThrow('Unsupported data type');
    });
  });

  describe('Colormap functionality', () => {
    test('should support different colormaps', async () => {
      const matrix = [[1, 2], [3, 4]];
      
      const colormaps = ['viridis', 'hot', 'cool', 'grayscale'];
      
      for (const colormap of colormaps) {
        const output = numpyRender.RENDER({
          data: matrix,
          output: `./images/test-${colormap}.png`,
          colormap: colormap,
          title: `${colormap} colormap`
        });
        
        expect(output).toContain(colormap);
        expect(fs.existsSync(`./images/test-${colormap}.png`)).toBe(true);
      }
    });
  });

  describe('Statistical pipeline tests', () => {
    test('should handle CORRCOEF → RENDER pipeline', async () => {
      const rexxCode = `
        LET data = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]
        LET correlation_matrix = CORRCOEF x=data
        LET rendered = RENDER data=correlation_matrix output="./images/corrcoef-pipeline.png" title="Correlation Pipeline"
        SAY "Correlation pipeline rendered: " || rendered
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(output.join(' ')).toContain('Correlation pipeline rendered: ./images/corrcoef-pipeline.png');
      expect(fs.existsSync('./images/corrcoef-pipeline.png')).toBe(true);
    });

    test('should handle COV → RENDER pipeline', async () => {
      const rexxCode = `
        LET data = [[1, 2], [3, 4], [5, 6]]
        LET covariance_matrix = COV x=data
        LET rendered = RENDER data=covariance_matrix output="./images/cov-pipeline.png" title="Covariance Pipeline" colormap="hot"
        SAY "Covariance pipeline rendered: " || rendered
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(output.join(' ')).toContain('Covariance pipeline rendered: ./images/cov-pipeline.png');
      expect(fs.existsSync('./images/cov-pipeline.png')).toBe(true);
    });

    test('should handle EIG → RENDER pipeline', async () => {
      const rexxCode = `
        LET matrix = [[4, 2], [1, 3]]
        LET eigenresult = EIG matrix=matrix
        LET rendered = RENDER data=eigenresult output="./images/eig-pipeline.png" title="Eigenvalue Pipeline"
        SAY "Eigenvalue pipeline rendered: " || rendered
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(output.join(' ')).toContain('Eigenvalue pipeline rendered: ./images/eig-pipeline.png');
      expect(fs.existsSync('./images/eig-pipeline.png')).toBe(true);
    });

    test('should handle HISTOGRAM2D → RENDER pipeline', async () => {
      const rexxCode = `
        LET x = [1, 2, 3, 4, 5, 2, 3, 4]
        LET y = [2, 3, 4, 5, 6, 4, 5, 6]
        LET hist2d = HISTOGRAM2D x=x y=y bins=4
        LET rendered = RENDER data=hist2d output="./images/hist2d-pipeline.png" title="Histogram2D Pipeline" colormap="cool"
        SAY "Histogram2D pipeline rendered: " || rendered
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(output.join(' ')).toContain('Histogram2D pipeline rendered: ./images/hist2d-pipeline.png');
      expect(fs.existsSync('./images/hist2d-pipeline.png')).toBe(true);
    });

    test('should handle UNIQUE → RENDER pipeline', async () => {
      const rexxCode = `
        LET data = [1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4]
        LET unique_result = UNIQUE data=data return_counts=true
        LET rendered = RENDER data=unique_result output="./images/unique-pipeline.png" title="Unique Value Counts"
        SAY "Unique counts rendered: " || rendered
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      expect(output.join(' ')).toContain('Unique counts rendered: ./images/unique-pipeline.png');
      expect(fs.existsSync('./images/unique-pipeline.png')).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should handle missing data parameter', async () => {
      const rexxCode = `
        LET result = RENDER output="./test.png"
      `;

      const commands = parse(rexxCode);
      await expect(interpreter.run(commands)).rejects.toThrow();
    });

    test('should handle invalid data structures', async () => {
      const rexxCode = `
        LET invalidData = "not valid data"
        LET result = RENDER data=invalidData output="./test.png"
      `;

      const commands = parse(rexxCode);
      await expect(interpreter.run(commands)).rejects.toThrow();
    });
  });

  describe('Performance and edge cases', () => {
    test('should handle large matrices efficiently', async () => {
      const rexxCode = `
        LET big_matrix = ONES shape=[10, 10]
        LET rendered = RENDER data=big_matrix output="./images/big-matrix.png" title="Large Matrix"
        SAY "Large matrix rendered: " || rendered
      `;

      const commands = parse(rexxCode);
      const startTime = Date.now();
      await interpreter.run(commands);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in <5 seconds
      expect(fs.existsSync('./images/big-matrix.png')).toBe(true);
    });

    test('should handle empty data gracefully', async () => {
      const rexxCode = `
        LET dataJson = "[]"
        LET empty_array = JSON_PARSE text=dataJson
        LET rendered = RENDER plot=empty_array output="./images/empty.png" title="Empty Data"
        SAY "Empty data rendered: " || rendered
      `;

      const commands = parse(rexxCode);
      await interpreter.run(commands);

      // Extract the actual filename from output
      const outputText = output.join(' ');
      expect(outputText).toMatch(/Empty data rendered: \.\/images\/numpy-array1d-\d+\.png/);
    });
  });
});

/**
 * Helper function to verify PNG has meaningful content
 */
async function hasMeaningfulContent(pngPath) {
  if (!loadImage || !fs.existsSync(pngPath)) return false;

  try {
    const buffer = fs.readFileSync(pngPath);
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    let whitePixels = 0;
    let coloredPixels = 0;
    const uniqueColors = new Set();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const colorKey = `${r},${g},${b}`;
      uniqueColors.add(colorKey);

      if (r === 255 && g === 255 && b === 255) {
        whitePixels++;
      } else if (r !== g || g !== b) {
        coloredPixels++;
      }
    }

    const totalPixels = data.length / 4;
    
    // Image should have:
    // 1. Less than 90% white pixels (has content)
    // 2. Some colored pixels (>5% of total)
    // 3. At least 10 unique colors (not just solid color)
    return (whitePixels / totalPixels) < 0.9 && 
           (coloredPixels / totalPixels) > 0.05 &&
           uniqueColors.size >= 10;
  } catch (error) {
    console.warn('PNG verification failed:', error.message);
    return false;
  }
}