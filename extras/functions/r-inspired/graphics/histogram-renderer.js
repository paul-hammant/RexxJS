/**
 * Canvas-based R Graphics renderer that generates PNG files
 * Supports: Histogram, Boxplot, Barplot, Pie, Scatter, Q-Q Plot, Density Plot
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

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { rGraphicsFunctions } = require('../../extras/functions/r-inspired/graphics/r-graphics-functions');

// Simple linear scale function to replace D3
function createLinearScale(domain, range) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  const scale = (rangeMax - rangeMin) / (domainMax - domainMin);
  
  return function(value) {
    return rangeMin + (value - domainMin) * scale;
  };
}

/**
 * Renders a histogram to PNG using D3.js and canvas
 * @param {Object} histogramData - The histogram data from R_HIST function
 * @param {string} outputPath - Path where PNG should be saved
 * @param {Object} options - Rendering options
 * @returns {string} Path to generated PNG file
 */
function renderHistogramToPNG(histogramData, outputPath, options = {}) {
  // Set up canvas dimensions
  const width = options.width || 800;
  const height = options.height || 600;
  const margin = options.margin || { top: 50, right: 50, bottom: 70, left: 70 };
  
  // Create canvas
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  // Set white background
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  // Calculate plot area
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Extract data from histogram
  const { bins, options: histOptions } = histogramData;
  
  // Handle edge cases
  if (!bins || bins.length === 0) {
    throw new Error('No histogram bins to render');
  }
  
  const xMin = bins[0].start;
  const xMax = bins[bins.length - 1].end;
  const yMax = Math.max(...bins.map(bin => bin.count));
  
  // Create scales
  const xScale = createLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createLinearScale([0, yMax], [plotHeight, 0]);
  
  // Draw histogram bars
  bins.forEach(bin => {
    const barX = margin.left + xScale(bin.start);
    const barY = margin.top + yScale(bin.count);
    const barWidth = xScale(bin.end) - xScale(bin.start) - 1; // -1 for border
    const barHeight = plotHeight - yScale(bin.count);
    
    // Fill bar
    context.fillStyle = histOptions.col || 'lightgray';
    context.fillRect(barX, barY, barWidth, barHeight);
    
    // Border
    context.strokeStyle = histOptions.border || 'black';
    context.lineWidth = 1;
    context.strokeRect(barX, barY, barWidth, barHeight);
  });
  
  // Draw axes
  context.strokeStyle = 'black';
  context.lineWidth = 2;
  
  // X-axis
  context.beginPath();
  context.moveTo(margin.left, margin.top + plotHeight);
  context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
  context.stroke();
  
  // Y-axis
  context.beginPath();
  context.moveTo(margin.left, margin.top);
  context.lineTo(margin.left, margin.top + plotHeight);
  context.stroke();
  
  // X-axis ticks and labels
  const xTicks = 8;
  const xTickStep = (xMax - xMin) / xTicks;
  context.font = '12px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'center';
  
  for (let i = 0; i <= xTicks; i++) {
    const tickValue = xMin + i * xTickStep;
    const tickX = margin.left + xScale(tickValue);
    
    // Tick mark
    context.beginPath();
    context.moveTo(tickX, margin.top + plotHeight);
    context.lineTo(tickX, margin.top + plotHeight + 5);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(1), tickX, margin.top + plotHeight + 20);
  }
  
  // Y-axis ticks and labels
  const yTicks = 6;
  const yTickStep = yMax / yTicks;
  context.textAlign = 'right';
  
  for (let i = 0; i <= yTicks; i++) {
    const tickValue = i * yTickStep;
    const tickY = margin.top + yScale(tickValue);
    
    // Tick mark
    context.beginPath();
    context.moveTo(margin.left - 5, tickY);
    context.lineTo(margin.left, tickY);
    context.stroke();
    
    // Label
    context.fillText(Math.round(tickValue), margin.left - 10, tickY + 4);
  }
  
  // Title
  context.font = 'bold 16px Arial';
  context.textAlign = 'center';
  context.fillText(histOptions.main || 'Histogram', width / 2, 30);
  
  // X-axis label
  context.font = '14px Arial';
  if (histOptions.xlab) {
    context.fillText(histOptions.xlab, width / 2, height - 20);
  }
  
  // Y-axis label (rotated)
  if (histOptions.ylab) {
    context.save();
    context.translate(20, height / 2);
    context.rotate(-Math.PI / 2);
    context.textAlign = 'center';
    context.fillText(histOptions.ylab, 0, 0);
    context.restore();
  }
  
  // Save PNG file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  return outputPath;
}

/**
 * Renders any R Graphics Function output to PNG
 * @param {Object} plotData - The plot data from any R Graphics function
 * @param {string} outputPath - Path where PNG should be saved  
 * @param {Object} options - Rendering options
 * @returns {string} Path to generated PNG file
 */
function renderPlotToPNG(plotData, outputPath, options = {}) {
  switch (plotData.type) {
    case 'hist':
      return renderHistogramToPNG(plotData, outputPath, options);
    case 'boxplot':
      return renderBoxplotToPNG(plotData, outputPath, options);
    case 'barplot':
      return renderBarplotToPNG(plotData, outputPath, options);
    case 'pie':
      return renderPieToPNG(plotData, outputPath, options);
    case 'scatter':
      return renderScatterToPNG(plotData, outputPath, options);
    case 'qqplot':
      return renderQQPlotToPNG(plotData, outputPath, options);
    case 'qqnorm':
      return renderQQPlotToPNG(plotData, outputPath, options); // Reuse Q-Q plot renderer
    case 'density':
      return renderDensityToPNG(plotData, outputPath, options);
    case 'lines':
      return renderLinesToPNG(plotData, outputPath, options);
    case 'qqline':
      return renderLinesToPNG(plotData, outputPath, options); // Reuse line renderer
    case 'contour':
      return renderContourToPNG(plotData, outputPath, options);
    case 'heatmap':
      return renderHeatmapToPNG(plotData, outputPath, options);
    case 'pairs':
      return renderPairsToPNG(plotData, outputPath, options);
    case 'abline':
      return renderAblineToPNG(plotData, outputPath, options);
    default:
      throw new Error(`Unsupported plot type: ${plotData.type}`);
  }
}

/**
 * Renders a boxplot to PNG
 */
function renderBoxplotToPNG(boxplotData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const margin = renderOptions.margin || { top: 50, right: 50, bottom: 70, left: 70 };
  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  // White background
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { stats, options: boxOptions } = boxplotData;
  const { min, max, q1, q3, median, lowerWhisker, upperWhisker, outliers } = stats;
  
  // Create scale for y-axis (data values)
  const yScale = createLinearScale([min - (max - min) * 0.1, max + (max - min) * 0.1], [plotHeight, 0]);
  
  // Box center X position
  const boxCenterX = margin.left + plotWidth / 2;
  const boxWidth = 60;
  const boxLeft = boxCenterX - boxWidth / 2;
  const boxRight = boxCenterX + boxWidth / 2;
  
  // Draw whiskers
  context.strokeStyle = 'black';
  context.lineWidth = 2;
  
  // Lower whisker
  context.beginPath();
  context.moveTo(boxCenterX, margin.top + yScale(lowerWhisker));
  context.lineTo(boxCenterX, margin.top + yScale(q1));
  context.stroke();
  
  // Upper whisker  
  context.beginPath();
  context.moveTo(boxCenterX, margin.top + yScale(q3));
  context.lineTo(boxCenterX, margin.top + yScale(upperWhisker));
  context.stroke();
  
  // Whisker caps
  context.beginPath();
  context.moveTo(boxLeft, margin.top + yScale(lowerWhisker));
  context.lineTo(boxRight, margin.top + yScale(lowerWhisker));
  context.moveTo(boxLeft, margin.top + yScale(upperWhisker));
  context.lineTo(boxRight, margin.top + yScale(upperWhisker));
  context.stroke();
  
  // Draw box
  const boxY = margin.top + yScale(q3);
  const boxHeight = yScale(q1) - yScale(q3);
  
  context.fillStyle = boxOptions.col || 'lightblue';
  context.fillRect(boxLeft, boxY, boxWidth, boxHeight);
  
  context.strokeStyle = boxOptions.border || 'black';
  context.strokeRect(boxLeft, boxY, boxWidth, boxHeight);
  
  // Draw median line
  context.strokeStyle = 'black';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(boxLeft, margin.top + yScale(median));
  context.lineTo(boxRight, margin.top + yScale(median));
  context.stroke();
  
  // Draw outliers
  if (outliers.length > 0) {
    context.fillStyle = 'red';
    outliers.forEach(outlier => {
      context.beginPath();
      context.arc(boxCenterX, margin.top + yScale(outlier), 3, 0, 2 * Math.PI);
      context.fill();
    });
  }
  
  // Draw basic axes and labels
  drawBasicAxes(context, width, height, margin, boxOptions.main || 'Box Plot', '', boxOptions.ylab || 'Value');
  
  // Save file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

/**
 * Renders a scatter plot to PNG
 */
function renderScatterToPNG(scatterData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const margin = renderOptions.margin || { top: 50, right: 50, bottom: 70, left: 70 };
  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { x, y, options: scatterOptions } = scatterData;
  
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);
  
  const xScale = createLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createLinearScale([yMin, yMax], [plotHeight, 0]);
  
  // Draw points
  context.fillStyle = scatterOptions.col || 'blue';
  for (let i = 0; i < x.length; i++) {
    const px = margin.left + xScale(x[i]);
    const py = margin.top + yScale(y[i]);
    
    context.beginPath();
    context.arc(px, py, scatterOptions.pch === 16 ? 4 : 3, 0, 2 * Math.PI);
    context.fill();
  }
  
  // Draw axes with ticks
  drawScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax,
    scatterOptions.main || 'Scatter Plot', scatterOptions.xlab || 'X', scatterOptions.ylab || 'Y');
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

/**
 * Helper function to draw basic axes and labels
 */
function drawBasicAxes(context, width, height, margin, title, xlab, ylab) {
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Draw axes lines
  context.strokeStyle = 'black';
  context.lineWidth = 2;
  
  // X-axis
  context.beginPath();
  context.moveTo(margin.left, margin.top + plotHeight);
  context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
  context.stroke();
  
  // Y-axis
  context.beginPath();
  context.moveTo(margin.left, margin.top);
  context.lineTo(margin.left, margin.top + plotHeight);
  context.stroke();
  
  // Title
  context.font = 'bold 16px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'center';
  context.fillText(title, width / 2, 30);
  
  // Axis labels
  context.font = '14px Arial';
  if (xlab) {
    context.fillText(xlab, width / 2, height - 20);
  }
  
  if (ylab) {
    context.save();
    context.translate(20, height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(ylab, 0, 0);
    context.restore();
  }
}

/**
 * Helper function to draw scatter plot axes with ticks
 */
function drawScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax, title, xlab, ylab) {
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Draw basic axes
  drawBasicAxes(context, width, height, margin, title, xlab, ylab);
  
  // Add tick marks and labels
  const xScale = createLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createLinearScale([yMin, yMax], [plotHeight, 0]);
  
  // X-axis ticks
  const xTicks = 6;
  const xTickStep = (xMax - xMin) / xTicks;
  context.font = '10px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'center';
  
  for (let i = 0; i <= xTicks; i++) {
    const tickValue = xMin + i * xTickStep;
    const tickX = margin.left + xScale(tickValue);
    
    // Tick mark
    context.beginPath();
    context.moveTo(tickX, margin.top + plotHeight);
    context.lineTo(tickX, margin.top + plotHeight + 5);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(1), tickX, margin.top + plotHeight + 18);
  }
  
  // Y-axis ticks
  const yTicks = 6;
  const yTickStep = (yMax - yMin) / yTicks;
  context.textAlign = 'right';
  
  for (let i = 0; i <= yTicks; i++) {
    const tickValue = yMin + i * yTickStep;
    const tickY = margin.top + yScale(tickValue);
    
    // Tick mark
    context.beginPath();
    context.moveTo(margin.left - 5, tickY);
    context.lineTo(margin.left, tickY);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(1), margin.left - 8, tickY + 3);
  }
}

/**
 * Helper function to draw barplot axes with category labels
 */
function drawBarplotAxes(context, width, height, margin, yMin, yMax, names, title, xlab, ylab) {
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Draw basic axes
  drawBasicAxes(context, width, height, margin, title, xlab, ylab);
  
  // Y-axis ticks and labels
  const yTicks = 5;
  const yTickStep = (yMax - yMin) / yTicks;
  context.font = '10px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'right';
  
  for (let i = 0; i <= yTicks; i++) {
    const tickValue = yMin + i * yTickStep;
    const yScale = createLinearScale([yMin, yMax * 1.1], [plotHeight, 0]);
    const tickY = margin.top + yScale(tickValue);
    
    // Tick mark
    context.beginPath();
    context.moveTo(margin.left - 5, tickY);
    context.lineTo(margin.left, tickY);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(1), margin.left - 8, tickY + 3);
  }
  
  // Category labels are handled in the main barplot function
}

/**
 * Renders a barplot to PNG
 */
function renderBarplotToPNG(barplotData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const margin = renderOptions.margin || { top: 50, right: 50, bottom: 80, left: 70 };
  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  // White background
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { heights, names, options: barOptions } = barplotData;
  const maxHeight = Math.max(...heights);
  const minHeight = Math.min(...heights.filter(h => h >= 0)); // Handle negative values
  const actualMin = Math.min(0, minHeight); // Include 0 in scale
  
  // Create scales
  const yScale = createLinearScale([actualMin, maxHeight * 1.1], [plotHeight, 0]);
  const barWidth = plotWidth / heights.length * 0.8; // 80% width, 20% spacing
  const barSpacing = plotWidth / heights.length * 0.2;
  
  // Draw bars
  heights.forEach((barHeight, index) => {
    const barX = margin.left + index * (plotWidth / heights.length) + barSpacing / 2;
    const barY = margin.top + yScale(Math.max(0, barHeight));
    const actualBarHeight = Math.abs(yScale(barHeight) - yScale(0));
    
    // Choose color - can be array of colors or single color
    let barColor = barOptions.col || 'gray';
    if (Array.isArray(barColor)) {
      barColor = barColor[index % barColor.length];
    }
    
    // Fill bar
    context.fillStyle = barColor;
    context.fillRect(barX, barY, barWidth, actualBarHeight);
    
    // Border
    context.strokeStyle = barOptions.border || 'black';
    context.lineWidth = 1;
    context.strokeRect(barX, barY, barWidth, actualBarHeight);
    
    // Bar labels (names)
    if (names && names[index]) {
      context.fillStyle = 'black';
      context.font = '11px Arial';
      context.textAlign = 'center';
      context.fillText(names[index], barX + barWidth / 2, margin.top + plotHeight + 20);
    }
    
    // Value labels on top of bars (optional)
    if (barOptions.labels !== false) {
      context.fillStyle = 'black';
      context.font = '10px Arial';
      context.textAlign = 'center';
      const labelY = barHeight >= 0 ? barY - 5 : barY + actualBarHeight + 15;
      context.fillText(barHeight.toFixed(1), barX + barWidth / 2, labelY);
    }
  });
  
  // Draw axes and labels
  drawBarplotAxes(context, width, height, margin, actualMin, maxHeight, names,
    barOptions.main || 'Bar Plot', barOptions.xlab || '', barOptions.ylab || 'Height');
  
  // Save file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

/**
 * Renders a pie chart to PNG
 */
function renderPieToPNG(pieData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const margin = renderOptions.margin || { top: 50, right: 50, bottom: 50, left: 50 };
  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  // White background
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const { values, percentages, angles, labels, options: pieOptions } = pieData;
  
  // Calculate center and radius
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2 * 0.8;
  
  // Default colors for pie slices
  const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  let colors = pieOptions.col || defaultColors;
  if (!Array.isArray(colors)) {
    colors = [colors];
  }
  
  // Draw pie slices
  let currentAngle = -Math.PI / 2; // Start at top (12 o'clock)
  
  values.forEach((value, index) => {
    const sliceAngle = (angles[index] / 180) * Math.PI; // Convert degrees to radians
    const color = colors[index % colors.length];
    
    // Draw slice
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    context.closePath();
    
    context.fillStyle = color;
    context.fill();
    
    context.strokeStyle = pieOptions.border || 'white';
    context.lineWidth = 2;
    context.stroke();
    
    // Draw label
    if (labels && labels[index]) {
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      context.fillStyle = 'black';
      context.font = 'bold 12px Arial';
      context.textAlign = 'center';
      context.fillText(labels[index], labelX, labelY);
      
      // Draw percentage
      const percentageY = labelY + 15;
      context.font = '10px Arial';
      context.fillText(`${percentages[index].toFixed(1)}%`, labelX, percentageY);
    }
    
    currentAngle += sliceAngle;
  });
  
  // Draw title
  context.font = 'bold 16px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'center';
  context.fillText(pieOptions.main || 'Pie Chart', centerX, 30);
  
  // Save file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function renderQQPlotToPNG(qqData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const margin = renderOptions.margin || { top: 50, right: 50, bottom: 80, left: 70 };
  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  // White background
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { x, y, options: qqOptions } = qqData;
  
  if (!x || !y || x.length === 0 || y.length === 0) {
    throw new Error('Invalid Q-Q plot data: missing x or y coordinates');
  }
  
  // Create scales
  const xMin = Math.min(...x) * 1.1;
  const xMax = Math.max(...x) * 1.1;
  const yMin = Math.min(...y) * 1.1;
  const yMax = Math.max(...y) * 1.1;
  
  const xScale = createLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createLinearScale([yMin, yMax], [plotHeight, 0]);
  
  // Draw axes
  drawQQAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, qqOptions);
  
  // Draw Q-Q line (reference line y = x)
  context.strokeStyle = 'red';
  context.lineWidth = 1;
  context.setLineDash([5, 5]);
  context.beginPath();
  const lineMin = Math.max(xMin, yMin);
  const lineMax = Math.min(xMax, yMax);
  const startX = margin.left + xScale(lineMin);
  const startY = margin.top + yScale(lineMin);
  const endX = margin.left + xScale(lineMax);
  const endY = margin.top + yScale(lineMax);
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
  context.setLineDash([]); // Reset line dash
  
  // Draw data points
  const pointColor = qqOptions.col || 'blue';
  const pointSize = qqOptions.cex || 1;
  const pointRadius = 3 * pointSize;
  
  context.fillStyle = pointColor;
  context.strokeStyle = pointColor;
  context.lineWidth = 1;
  
  for (let i = 0; i < x.length; i++) {
    const canvasX = margin.left + xScale(x[i]);
    const canvasY = margin.top + yScale(y[i]);
    
    context.beginPath();
    context.arc(canvasX, canvasY, pointRadius, 0, 2 * Math.PI);
    context.fill();
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  return outputPath;
}

function drawQQAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, options) {
  context.strokeStyle = 'black';
  context.lineWidth = 1;
  context.font = '12px Arial';
  context.fillStyle = 'black';
  
  // Draw axes lines
  context.beginPath();
  context.moveTo(margin.left, margin.top);
  context.lineTo(margin.left, margin.top + plotHeight);
  context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
  context.stroke();
  
  // Title
  if (options.main) {
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(options.main, margin.left + plotWidth / 2, margin.top - 20);
    context.font = '12px Arial';
  }
  
  // Y-axis label
  const yLabel = options.ylab || 'Sample Quantiles';
  context.save();
  context.translate(margin.left - 40, margin.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.fillText(yLabel, 0, 0);
  context.restore();
  
  // X-axis label
  const xLabel = options.xlab || 'Theoretical Quantiles';
  context.textAlign = 'center';
  context.fillText(xLabel, margin.left + plotWidth / 2, margin.top + plotHeight + 60);
  
  // X-axis ticks
  const xTicks = 6;
  const xTickStep = (xMax - xMin) / xTicks;
  context.textAlign = 'center';
  
  for (let i = 0; i <= xTicks; i++) {
    const tickValue = xMin + i * xTickStep;
    const tickX = margin.left + (i / xTicks) * plotWidth;
    
    // Tick mark
    context.beginPath();
    context.moveTo(tickX, margin.top + plotHeight);
    context.lineTo(tickX, margin.top + plotHeight + 5);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(1), tickX, margin.top + plotHeight + 18);
  }
  
  // Y-axis ticks
  const yTicks = 6;
  const yTickStep = (yMax - yMin) / yTicks;
  context.textAlign = 'right';
  
  for (let i = 0; i <= yTicks; i++) {
    const tickValue = yMin + i * yTickStep;
    const tickY = margin.top + (1 - i / yTicks) * plotHeight;
    
    // Tick mark
    context.beginPath();
    context.moveTo(margin.left - 5, tickY);
    context.lineTo(margin.left, tickY);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(1), margin.left - 8, tickY + 4);
  }
}

function renderDensityToPNG(densityData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const margin = renderOptions.margin || { top: 50, right: 50, bottom: 80, left: 70 };
  
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  // White background
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { x, y, options: densityOptions } = densityData;
  
  if (!x || !y || x.length === 0 || y.length === 0) {
    throw new Error('Invalid density data: missing x or y coordinates');
  }
  
  // Create scales
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = 0; // Density is always non-negative
  const yMax = Math.max(...y) * 1.1; // Add some padding
  
  const xScale = createLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createLinearScale([yMin, yMax], [plotHeight, 0]);
  
  // Draw axes
  drawDensityAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, densityOptions);
  
  // Draw density curve
  context.strokeStyle = densityOptions.col || 'blue';
  context.lineWidth = densityOptions.lwd || 2;
  context.beginPath();
  
  for (let i = 0; i < x.length; i++) {
    const canvasX = margin.left + xScale(x[i]);
    const canvasY = margin.top + yScale(y[i]);
    
    if (i === 0) {
      context.moveTo(canvasX, canvasY);
    } else {
      context.lineTo(canvasX, canvasY);
    }
  }
  context.stroke();
  
  // Optional: Fill area under curve
  if (densityOptions.fill !== false) {
    context.fillStyle = densityOptions.fillCol || 'rgba(0, 0, 255, 0.2)';
    context.beginPath();
    
    // Start from bottom
    const startX = margin.left + xScale(x[0]);
    const bottomY = margin.top + yScale(0);
    context.moveTo(startX, bottomY);
    
    // Draw curve
    for (let i = 0; i < x.length; i++) {
      const canvasX = margin.left + xScale(x[i]);
      const canvasY = margin.top + yScale(y[i]);
      context.lineTo(canvasX, canvasY);
    }
    
    // Close to bottom
    const endX = margin.left + xScale(x[x.length - 1]);
    context.lineTo(endX, bottomY);
    context.closePath();
    context.fill();
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  return outputPath;
}

function drawDensityAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, options) {
  context.strokeStyle = 'black';
  context.lineWidth = 1;
  context.font = '12px Arial';
  context.fillStyle = 'black';
  
  // Draw axes lines
  context.beginPath();
  context.moveTo(margin.left, margin.top);
  context.lineTo(margin.left, margin.top + plotHeight);
  context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
  context.stroke();
  
  // Title
  if (options.main) {
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(options.main, margin.left + plotWidth / 2, margin.top - 20);
    context.font = '12px Arial';
  }
  
  // Y-axis label
  if (options.ylab || true) {
    const yLabel = options.ylab || 'Density';
    context.save();
    context.translate(margin.left - 40, margin.top + plotHeight / 2);
    context.rotate(-Math.PI / 2);
    context.textAlign = 'center';
    context.fillText(yLabel, 0, 0);
    context.restore();
  }
  
  // X-axis label
  if (options.xlab) {
    context.textAlign = 'center';
    context.fillText(options.xlab, margin.left + plotWidth / 2, margin.top + plotHeight + 60);
  }
  
  // X-axis ticks
  const xTicks = 8;
  const xTickStep = (xMax - xMin) / xTicks;
  context.textAlign = 'center';
  
  for (let i = 0; i <= xTicks; i++) {
    const tickValue = xMin + i * xTickStep;
    const tickX = margin.left + (i / xTicks) * plotWidth;
    
    // Tick mark
    context.beginPath();
    context.moveTo(tickX, margin.top + plotHeight);
    context.lineTo(tickX, margin.top + plotHeight + 5);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(2), tickX, margin.top + plotHeight + 18);
  }
  
  // Y-axis ticks
  const yTicks = 6;
  const yTickStep = (yMax - yMin) / yTicks;
  context.textAlign = 'right';
  
  for (let i = 0; i <= yTicks; i++) {
    const tickValue = yMin + i * yTickStep;
    const tickY = margin.top + (1 - i / yTicks) * plotHeight;
    
    // Tick mark
    context.beginPath();
    context.moveTo(margin.left - 5, tickY);
    context.lineTo(margin.left, tickY);
    context.stroke();
    
    // Label
    context.fillText(tickValue.toFixed(3), margin.left - 8, tickY + 4);
  }
}

function renderContourToPNG(contourData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  const margin = { top: 60, right: 40, bottom: 80, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  if (contourData.error) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(`Error: ${contourData.error}`, width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  const xGrid = contourData.x || [];
  const yGrid = contourData.y || [];
  const contours = contourData.contours || [];
  
  if (xGrid.length === 0 || yGrid.length === 0 || contours.length === 0) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText('No contour data to display', width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  const xMin = Math.min(...xGrid);
  const xMax = Math.max(...xGrid);
  const yMin = Math.min(...yGrid);
  const yMax = Math.max(...yGrid);

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  function xScale(value) {
    return margin.left + (value - xMin) * plotWidth / xRange;
  }

  function yScale(value) {
    return height - margin.bottom - (value - yMin) * plotHeight / yRange;
  }

  drawScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax, 
    contourData.options.main || 'Contour Plot',
    contourData.options.xlab || 'X',
    contourData.options.ylab || 'Y');

  // Draw contour lines
  context.lineWidth = 2;
  
  for (const contour of contours) {
    context.strokeStyle = contour.color || 'blue';
    
    for (const path of contour.paths) {
      if (path.length >= 2) {
        context.beginPath();
        for (let i = 0; i < path.length; i++) {
          const x = xScale(path[i].x);
          const y = yScale(path[i].y);
          
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
      }
    }
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function renderHeatmapToPNG(heatmapData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  const margin = { top: 80, right: 120, bottom: 120, left: 120 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  if (heatmapData.error) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(`Error: ${heatmapData.error}`, width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  const colorMatrix = heatmapData.colorMatrix || [];
  const nRows = heatmapData.nRows || 0;
  const nCols = heatmapData.nCols || 0;
  const options = heatmapData.options || {};
  
  if (nRows === 0 || nCols === 0) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText('No heatmap data to display', width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  // Calculate cell dimensions
  const cellWidth = Math.min(plotWidth / nCols, options.cellWidth || 30);
  const cellHeight = Math.min(plotHeight / nRows, options.cellHeight || 30);
  
  // Center the heatmap in the plot area
  const heatmapWidth = cellWidth * nCols;
  const heatmapHeight = cellHeight * nRows;
  const startX = margin.left + (plotWidth - heatmapWidth) / 2;
  const startY = margin.top + (plotHeight - heatmapHeight) / 2;

  // Draw title
  context.fillStyle = 'black';
  context.font = 'bold 16px Arial';
  context.textAlign = 'center';
  context.fillText(options.main || 'Heatmap', width / 2, margin.top / 2);

  // Draw heatmap cells
  for (let i = 0; i < nRows; i++) {
    for (let j = 0; j < nCols; j++) {
      const cell = colorMatrix[i] && colorMatrix[i][j];
      if (!cell) continue;
      
      const x = startX + j * cellWidth;
      const y = startY + i * cellHeight;
      
      // Fill cell with color
      context.fillStyle = cell.color;
      context.fillRect(x, y, cellWidth, cellHeight);
      
      // Draw cell border
      context.strokeStyle = '#888';
      context.lineWidth = 0.5;
      context.strokeRect(x, y, cellWidth, cellHeight);
      
      // Draw value text if enabled
      if (options.showValues && cellWidth > 20 && cellHeight > 15) {
        context.fillStyle = 'black';
        context.font = `${Math.min(cellWidth / 4, cellHeight / 3, 12)}px Arial`;
        context.textAlign = 'center';
        context.fillText(
          cell.value.toFixed(1), 
          x + cellWidth / 2, 
          y + cellHeight / 2 + 4
        );
      }
    }
  }

  // Draw row labels
  if (heatmapData.rowLabels) {
    context.fillStyle = 'black';
    context.font = '12px Arial';
    context.textAlign = 'right';
    for (let i = 0; i < nRows; i++) {
      const y = startY + i * cellHeight + cellHeight / 2;
      context.fillText(heatmapData.rowLabels[i], startX - 10, y + 4);
    }
  }

  // Draw column labels
  if (heatmapData.colLabels) {
    context.fillStyle = 'black';
    context.font = '12px Arial';
    context.textAlign = 'center';
    for (let j = 0; j < nCols; j++) {
      const x = startX + j * cellWidth + cellWidth / 2;
      context.fillText(heatmapData.colLabels[j], x, startY - 10);
    }
  }

  // Draw color legend
  const legendWidth = 20;
  const legendHeight = Math.min(200, heatmapHeight);
  const legendX = width - margin.right / 2 - legendWidth / 2;
  const legendY = startY + (heatmapHeight - legendHeight) / 2;
  
  // Create gradient for legend
  for (let i = 0; i < legendHeight; i++) {
    const normalized = i / (legendHeight - 1);
    const color = rGraphicsFunctions.getHeatmapColor(1 - normalized, options.colorscheme);
    context.fillStyle = color;
    context.fillRect(legendX, legendY + i, legendWidth, 1);
  }
  
  // Legend border
  context.strokeStyle = 'black';
  context.lineWidth = 1;
  context.strokeRect(legendX, legendY, legendWidth, legendHeight);
  
  // Legend labels
  context.fillStyle = 'black';
  context.font = '10px Arial';
  context.textAlign = 'left';
  context.fillText(heatmapData.maxValue.toFixed(2), legendX + legendWidth + 5, legendY + 4);
  context.fillText(heatmapData.minValue.toFixed(2), legendX + legendWidth + 5, legendY + legendHeight);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function renderPairsToPNG(pairsData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 1000;
  const height = renderOptions.height || 1000;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  const margin = { top: 80, right: 40, bottom: 80, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  if (pairsData.error) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(`Error: ${pairsData.error}`, width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  const panels = pairsData.panels || [];
  const nVars = pairsData.nVars || 0;
  
  if (nVars === 0 || panels.length === 0) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText('No pairs data to display', width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  // Draw title
  context.fillStyle = 'black';
  context.font = 'bold 16px Arial';
  context.textAlign = 'center';
  context.fillText(pairsData.options.main || 'Pairs Plot', width / 2, margin.top / 2);

  // Calculate panel dimensions
  const panelSize = Math.min(plotWidth / nVars, plotHeight / nVars);
  const totalGridSize = panelSize * nVars;
  const startX = margin.left + (plotWidth - totalGridSize) / 2;
  const startY = margin.top + (plotHeight - totalGridSize) / 2;

  // Draw each panel
  for (const panel of panels) {
    const panelX = startX + panel.col * panelSize;
    const panelY = startY + panel.row * panelSize;
    const panelMargin = 10;
    const innerWidth = panelSize - 2 * panelMargin;
    const innerHeight = panelSize - 2 * panelMargin;
    
    // Create a smaller canvas for this panel
    const panelCanvas = createCanvas(innerWidth, innerHeight);
    const panelContext = panelCanvas.getContext('2d');
    
    panelContext.fillStyle = 'white';
    panelContext.fillRect(0, 0, innerWidth, innerHeight);
    
    // Render panel content based on type
    if (panel.type === 'histogram' && panel.data.bins) {
      renderHistogramPanel(panelContext, panel.data, innerWidth, innerHeight);
    } else if (panel.type === 'scatter' && panel.data.x) {
      renderScatterPanel(panelContext, panel.data, innerWidth, innerHeight);
    }
    
    // Draw the panel onto main canvas
    context.drawImage(panelCanvas, panelX + panelMargin, panelY + panelMargin);
    
    // Draw panel border
    context.strokeStyle = '#ccc';
    context.lineWidth = 1;
    context.strokeRect(panelX, panelY, panelSize, panelSize);
    
    // Add variable labels on edges
    if (panel.row === 0) {
      // Top row - column labels
      context.fillStyle = 'black';
      context.font = '12px Arial';
      context.textAlign = 'center';
      context.fillText(panel.xVar, panelX + panelSize / 2, startY - 5);
    }
    if (panel.col === 0) {
      // Left column - row labels  
      context.save();
      context.translate(startX - 5, panelY + panelSize / 2);
      context.rotate(-Math.PI / 2);
      context.fillStyle = 'black';
      context.font = '12px Arial';
      context.textAlign = 'center';
      context.fillText(panel.yVar, 0, 0);
      context.restore();
    }
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function renderHistogramPanel(context, histData, width, height) {
  const bins = histData.bins || [];
  if (bins.length === 0) return;
  
  const margin = 5;
  const plotWidth = width - 2 * margin;
  const plotHeight = height - 2 * margin;
  
  const maxCount = Math.max(...bins.map(bin => bin.count));
  const xMin = Math.min(...bins.map(bin => bin.start));
  const xMax = Math.max(...bins.map(bin => bin.end));
  
  context.fillStyle = histData.options.col || 'lightblue';
  context.strokeStyle = 'black';
  context.lineWidth = 0.5;
  
  bins.forEach(bin => {
    const x = margin + (bin.start - xMin) / (xMax - xMin) * plotWidth;
    const w = (bin.end - bin.start) / (xMax - xMin) * plotWidth;
    const h = (bin.count / maxCount) * plotHeight;
    const y = height - margin - h;
    
    context.fillRect(x, y, w, h);
    context.strokeRect(x, y, w, h);
  });
}

function renderScatterPanel(context, scatterData, width, height) {
  const x = scatterData.x || [];
  const y = scatterData.y || [];
  if (x.length === 0 || y.length === 0) return;
  
  const margin = 5;
  const plotWidth = width - 2 * margin;
  const plotHeight = height - 2 * margin;
  
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = Math.min(...y);
  const yMax = Math.max(...y);
  
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  
  context.fillStyle = scatterData.options.col || 'blue';
  const radius = (scatterData.options.cex || 0.8) * 2;
  
  for (let i = 0; i < Math.min(x.length, y.length); i++) {
    const px = margin + (x[i] - xMin) / xRange * plotWidth;
    const py = height - margin - (y[i] - yMin) / yRange * plotHeight;
    
    context.beginPath();
    context.arc(px, py, radius, 0, 2 * Math.PI);
    context.fill();
  }
}

function renderAblineToPNG(ablineData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  const margin = { top: 60, right: 40, bottom: 80, left: 80 };

  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  if (ablineData.error) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText(`Error: ${ablineData.error}`, width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  // For abline, we need to render it as a line plot
  const lineData = {
    type: 'lines',
    x: ablineData.points.map(p => p.x),
    y: ablineData.points.map(p => p.y),
    options: ablineData.options
  };

  // Reuse the line renderer
  return renderLinesToPNG(lineData, outputPath, renderOptions);
}

function renderLinesToPNG(linesData, outputPath, renderOptions = {}) {
  const width = renderOptions.width || 800;
  const height = renderOptions.height || 600;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  
  const margin = { top: 60, right: 40, bottom: 80, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);

  const xValues = linesData.x || [];
  const yValues = linesData.y || [];
  
  if (xValues.length === 0 || yValues.length === 0 || xValues.length !== yValues.length) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText('Invalid line data', width / 2, height / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    return;
  }

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  function xScale(value) {
    return margin.left + (value - xMin) * plotWidth / xRange;
  }

  function yScale(value) {
    return height - margin.bottom - (value - yMin) * plotHeight / yRange;
  }

  drawScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax, 
    linesData.options.main || 'Line Plot',
    linesData.options.xlab || 'X',
    linesData.options.ylab || 'Y');

  context.strokeStyle = linesData.options.col || 'blue';
  context.lineWidth = linesData.options.lwd || 2;
  
  if (linesData.options.lty === 2 || linesData.options.lty === 'dashed') {
    context.setLineDash([5, 5]);
  } else if (linesData.options.lty === 3 || linesData.options.lty === 'dotted') {
    context.setLineDash([2, 3]);
  } else {
    context.setLineDash([]);
  }

  context.beginPath();
  for (let i = 0; i < xValues.length; i++) {
    const x = xScale(xValues[i]);
    const y = yScale(yValues[i]);
    
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.stroke();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

module.exports = { 
  renderHistogramToPNG, 
  renderPlotToPNG,
  renderBoxplotToPNG,
  renderScatterToPNG,
  renderBarplotToPNG,
  renderPieToPNG,
  renderQQPlotToPNG,
  renderDensityToPNG,
  renderLinesToPNG,
  renderContourToPNG,
  renderHeatmapToPNG,
  renderPairsToPNG,
  renderAblineToPNG
};