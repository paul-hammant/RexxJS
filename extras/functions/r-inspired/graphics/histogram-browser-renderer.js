/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

/**
 * Browser-compatible histogram renderer
 * Adapted from the Node.js version for canvas HTML5 API
 */

// Simple linear scale function
function createLinearScale(domain, range) {
  const [domainMin, domainMax] = domain;
  const [rangeMin, rangeMax] = range;
  const scale = (rangeMax - rangeMin) / (domainMax - domainMin);
  
  return function(value) {
    return rangeMin + (value - domainMin) * scale;
  };
}

// Statistical helper functions
function calculateSD(data) {
  const n = data.length;
  if (n === 0) return 0;
  
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  return Math.sqrt(variance);
}

// Histogram generation function (browser version of R_HIST)
function generateHistogram(x, options = {}) {
  try {
    const data = Array.isArray(x) ? x : [x];
    const numericData = data.filter(val => !isNaN(parseFloat(val))).map(val => parseFloat(val));
    
    if (numericData.length === 0) {
      return { type: 'hist', error: 'No numeric data provided' };
    }

    // Calculate breaks
    let breaks = options.breaks || 'Sturges';
    let nBins;
    
    if (typeof breaks === 'string') {
      switch (breaks.toLowerCase()) {
        case 'sturges':
          nBins = Math.ceil(Math.log2(numericData.length)) + 1;
          break;
        case 'scott':
          const sd = calculateSD(numericData);
          const h = 3.5 * sd * Math.pow(numericData.length, -1/3);
          nBins = Math.ceil((Math.max(...numericData) - Math.min(...numericData)) / h);
          break;
        default:
          nBins = 10;
      }
    } else if (typeof breaks === 'number') {
      nBins = breaks;
    } else {
      nBins = 10;
    }

    // Create histogram bins
    const min = Math.min(...numericData);
    const max = Math.max(...numericData);
    
    // Handle constant values (all data points are the same)
    let binWidth = (max - min) / nBins;
    if (binWidth === 0) {
      // For constant values, create a single bin centered around the value
      nBins = 1;
      binWidth = 1; // arbitrary width for display
      const bins = [{
        start: min - 0.5,
        end: min + 0.5,
        count: numericData.length,
        density: numericData.length
      }];
      
      return {
        type: 'hist',
        data: numericData,
        bins: bins,
        breaks: [min - 0.5, min + 0.5],
        counts: [numericData.length],
        density: [numericData.length],
        mids: [min],
        options: {
          main: options.main || 'Histogram',
          xlab: options.xlab || '',
          ylab: options.ylab || 'Frequency',
          col: options.col || 'lightgray',
          border: options.border || 'black',
          freq: options.freq !== false,
          probability: options.probability === true,
          density: options.density || null,
          angle: options.angle || 45,
          xlim: options.xlim || [min - 1, min + 1],
          ylim: options.ylim || null
        },
        timestamp: new Date().toISOString()
      };
    }
    
    const bins = Array.from({length: nBins}, (_, i) => ({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0,
      density: 0
    }));

    // Fill bins
    for (const value of numericData) {
      let binIndex = Math.floor((value - min) / binWidth);
      if (binIndex >= nBins) binIndex = nBins - 1;
      if (binIndex < 0) binIndex = 0;
      bins[binIndex].count++;
    }

    // Calculate density
    const totalArea = binWidth * numericData.length;
    bins.forEach(bin => {
      bin.density = bin.count / totalArea;
    });

    return {
      type: 'hist',
      data: numericData,
      bins: bins,
      breaks: bins.map(bin => bin.start).concat([bins[bins.length - 1].end]),
      counts: bins.map(bin => bin.count),
      density: bins.map(bin => bin.density),
      mids: bins.map(bin => (bin.start + bin.end) / 2),
      options: {
        main: options.main || 'Histogram',
        xlab: options.xlab || '',
        ylab: options.ylab || 'Frequency',
        col: options.col || 'lightgray',
        border: options.border || 'black',
        freq: options.freq !== false,
        probability: options.probability === true,
        density: options.density || null,
        angle: options.angle || 45,
        xlim: options.xlim || [min, max],
        ylim: options.ylim || null
      },
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { type: 'hist', error: e.message };
  }
}

// Browser histogram renderer
function renderHistogramToCanvas(histogramData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas with id '${canvasId}' not found`);
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Set up rendering options
  const margin = renderOptions.margin || { top: 40, right: 40, bottom: 60, left: 60 };
  
  // Clear canvas with white background
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  // Calculate plot area
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Extract data from histogram
  const { bins, options: histOptions } = histogramData;
  
  // Handle edge cases
  if (!bins || bins.length === 0) {
    context.fillStyle = 'red';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText('No data to display', width / 2, height / 2);
    return;
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
  
  // Y-axis ticks and labels
  const yTicks = 5;
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
    context.fillText(Math.round(tickValue), margin.left - 8, tickY + 3);
  }
  
  // Title
  context.font = 'bold 14px Arial';
  context.textAlign = 'center';
  context.fillText(histOptions.main || 'Histogram', width / 2, 20);
  
  // X-axis label
  context.font = '12px Arial';
  if (histOptions.xlab) {
    context.fillText(histOptions.xlab, width / 2, height - 10);
  }
  
  // Y-axis label (rotated)
  if (histOptions.ylab) {
    context.save();
    context.translate(15, height / 2);
    context.rotate(-Math.PI / 2);
    context.textAlign = 'center';
    context.fillText(histOptions.ylab, 0, 0);
    context.restore();
  }
}

/**
 * Renders any R Graphics Function output to browser canvas
 * @param {Object} plotData - The plot data from any R Graphics function
 * @param {string} canvasId - ID of canvas element
 * @param {Object} options - Rendering options
 */
function renderPlotToCanvas(plotData, canvasId, options = {}) {
  switch (plotData.type) {
    case 'hist':
      return renderHistogramToCanvas(plotData, canvasId, options);
    case 'boxplot':
      return renderBoxplotToCanvas(plotData, canvasId, options);
    case 'scatter':
      return renderScatterToCanvas(plotData, canvasId, options);
    case 'barplot':
      return renderBarplotToCanvas(plotData, canvasId, options);
    case 'pie':
      return renderPieToCanvas(plotData, canvasId, options);
    case 'qqplot':
      return renderQQPlotToCanvas(plotData, canvasId, options);
    case 'qqnorm':
      return renderQQPlotToCanvas(plotData, canvasId, options); // Reuse Q-Q plot renderer
    case 'density':
      return renderDensityToCanvas(plotData, canvasId, options);
    case 'lines':
      return renderLinesToCanvas(plotData, canvasId, options);
    case 'qqline':
      return renderLinesToCanvas(plotData, canvasId, options); // Reuse line renderer
    case 'contour':
      return renderContourToCanvas(plotData, canvasId, options);
    case 'heatmap':
      return renderHeatmapToCanvas(plotData, canvasId, options);
    default:
      throw new Error(`Unsupported plot type: ${plotData.type}`);
  }
}

/**
 * Renders a boxplot to browser canvas
 */
function renderBoxplotToCanvas(boxplotData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas with id '${canvasId}' not found`);
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const margin = renderOptions.margin || { top: 40, right: 40, bottom: 60, left: 60 };
  
  // Clear canvas
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
  if (outliers && outliers.length > 0) {
    context.fillStyle = 'red';
    outliers.forEach(outlier => {
      context.beginPath();
      context.arc(boxCenterX, margin.top + yScale(outlier), 3, 0, 2 * Math.PI);
      context.fill();
    });
  }
  
  // Draw title and labels
  drawBrowserAxes(context, width, height, margin, boxOptions.main || 'Box Plot', '', boxOptions.ylab || 'Value');
}

/**
 * Renders a scatter plot to browser canvas
 */
function renderScatterToCanvas(scatterData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas with id '${canvasId}' not found`);
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const margin = renderOptions.margin || { top: 40, right: 40, bottom: 60, left: 60 };
  
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
  drawBrowserScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax,
    scatterOptions.main || 'Scatter Plot', scatterOptions.xlab || 'X', scatterOptions.ylab || 'Y');
}

/**
 * Helper function to draw basic axes and labels for browser
 */
function drawBrowserAxes(context, width, height, margin, title, xlab, ylab) {
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
  context.font = 'bold 14px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'center';
  context.fillText(title, width / 2, 20);
  
  // Axis labels
  context.font = '12px Arial';
  if (xlab) {
    context.fillText(xlab, width / 2, height - 10);
  }
  
  if (ylab) {
    context.save();
    context.translate(15, height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(ylab, 0, 0);
    context.restore();
  }
}

/**
 * Helper function to draw scatter plot axes with ticks for browser
 */
function drawBrowserScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax, title, xlab, ylab) {
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Draw basic axes
  drawBrowserAxes(context, width, height, margin, title, xlab, ylab);
  
  // Add tick marks and labels
  const xScale = createLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createLinearScale([yMin, yMax], [plotHeight, 0]);
  
  // X-axis ticks
  const xTicks = 5;
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
  const yTicks = 5;
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
 * Helper function to draw barplot axes for browser
 */
function drawBrowserBarplotAxes(context, width, height, margin, yMin, yMax, title, xlab, ylab) {
  // Draw basic axes
  drawBrowserAxes(context, width, height, margin, title, xlab, ylab);
  
  // Y-axis ticks and labels
  const plotHeight = height - margin.top - margin.bottom;
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
}

/**
 * Renders a barplot to browser canvas
 */
function renderBarplotToCanvas(barplotData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas with id '${canvasId}' not found`);
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const margin = renderOptions.margin || { top: 40, right: 40, bottom: 80, left: 60 };
  
  // Clear canvas
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { heights, names, options: barOptions } = barplotData;
  const maxHeight = Math.max(...heights);
  const minHeight = Math.min(...heights.filter(h => h >= 0));
  const actualMin = Math.min(0, minHeight);
  
  // Create scales
  const yScale = createLinearScale([actualMin, maxHeight * 1.1], [plotHeight, 0]);
  const barWidth = plotWidth / heights.length * 0.8;
  const barSpacing = plotWidth / heights.length * 0.2;
  
  // Draw bars
  heights.forEach((barHeight, index) => {
    const barX = margin.left + index * (plotWidth / heights.length) + barSpacing / 2;
    const barY = margin.top + yScale(Math.max(0, barHeight));
    const actualBarHeight = Math.abs(yScale(barHeight) - yScale(0));
    
    // Choose color
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
    
    // Value labels on bars
    if (barOptions.labels !== false) {
      context.fillStyle = 'black';
      context.font = '10px Arial';
      context.textAlign = 'center';
      const labelY = barHeight >= 0 ? barY - 5 : barY + actualBarHeight + 15;
      context.fillText(barHeight.toFixed(1), barX + barWidth / 2, labelY);
    }
  });
  
  // Draw axes and labels
  drawBrowserBarplotAxes(context, width, height, margin, actualMin, maxHeight,
    barOptions.main || 'Bar Plot', barOptions.xlab || '', barOptions.ylab || 'Height');
}

/**
 * Renders a pie chart to browser canvas
 */
function renderPieToCanvas(pieData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas with id '${canvasId}' not found`);
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const { values, percentages, angles, labels, options: pieOptions } = pieData;
  
  // Calculate center and radius
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 * 0.6;
  
  // Default colors
  const defaultColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  let colors = pieOptions.col || defaultColors;
  if (!Array.isArray(colors)) {
    colors = [colors];
  }
  
  // Draw pie slices
  let currentAngle = -Math.PI / 2; // Start at top
  
  values.forEach((value, index) => {
    const sliceAngle = (angles[index] / 180) * Math.PI;
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
      context.font = 'bold 11px Arial';
      context.textAlign = 'center';
      context.fillText(labels[index], labelX, labelY);
      
      // Draw percentage
      context.font = '9px Arial';
      context.fillText(`${percentages[index].toFixed(1)}%`, labelX, labelY + 12);
    }
    
    currentAngle += sliceAngle;
  });
  
  // Draw title
  context.font = 'bold 14px Arial';
  context.fillStyle = 'black';
  context.textAlign = 'center';
  context.fillText(pieOptions.main || 'Pie Chart', centerX, 20);
}

function renderQQPlotToCanvas(qqData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas with id '${canvasId}' not found`);
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const margin = renderOptions.margin || { top: 40, right: 40, bottom: 80, left: 60 };
  
  // Clear canvas
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { x, y, options: qqOptions } = qqData;
  
  if (!x || !y || x.length === 0 || y.length === 0) {
    context.fillStyle = 'red';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText('Invalid Q-Q plot data', width / 2, height / 2);
    return;
  }
  
  // Create scales
  const xMin = Math.min(...x) * 1.1;
  const xMax = Math.max(...x) * 1.1;
  const yMin = Math.min(...y) * 1.1;
  const yMax = Math.max(...y) * 1.1;
  
  const xScale = createBrowserLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createBrowserLinearScale([yMin, yMax], [plotHeight, 0]);
  
  // Draw axes
  drawBrowserQQAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, qqOptions);
  
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
}

function renderDensityToCanvas(densityData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    throw new Error(`Canvas with id '${canvasId}' not found`);
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const margin = renderOptions.margin || { top: 40, right: 40, bottom: 80, left: 60 };
  
  // Clear canvas
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const { x, y, options: densityOptions } = densityData;
  
  if (!x || !y || x.length === 0 || y.length === 0) {
    context.fillStyle = 'red';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText('Invalid density data', width / 2, height / 2);
    return;
  }
  
  // Create scales
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMin = 0; // Density is always non-negative
  const yMax = Math.max(...y) * 1.1; // Add some padding
  
  const xScale = createBrowserLinearScale([xMin, xMax], [0, plotWidth]);
  const yScale = createBrowserLinearScale([yMin, yMax], [plotHeight, 0]);
  
  // Draw axes
  drawBrowserDensityAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, densityOptions);
  
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
}

function drawBrowserQQAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, options) {
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
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText(options.main, margin.left + plotWidth / 2, margin.top - 15);
    context.font = '12px Arial';
  }
  
  // Y-axis label
  const yLabel = options.ylab || 'Sample Quantiles';
  context.save();
  context.translate(margin.left - 35, margin.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.fillText(yLabel, 0, 0);
  context.restore();
  
  // X-axis label
  const xLabel = options.xlab || 'Theoretical Quantiles';
  context.textAlign = 'center';
  context.fillText(xLabel, margin.left + plotWidth / 2, margin.top + plotHeight + 50);
  
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

function drawBrowserDensityAxes(context, margin, plotWidth, plotHeight, xMin, xMax, yMin, yMax, options) {
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
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText(options.main, margin.left + plotWidth / 2, margin.top - 15);
    context.font = '12px Arial';
  }
  
  // Y-axis label
  const yLabel = options.ylab || 'Density';
  context.save();
  context.translate(margin.left - 35, margin.top + plotHeight / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = 'center';
  context.fillText(yLabel, 0, 0);
  context.restore();
  
  // X-axis label
  if (options.xlab) {
    context.textAlign = 'center';
    context.fillText(options.xlab, margin.left + plotWidth / 2, margin.top + plotHeight + 50);
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

function renderLinesToCanvas(linesData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas ${canvasId} not found`);
    return;
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
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
    return margin.top + (1 - (value - yMin) / yRange) * plotHeight;
  }

  drawBrowserScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax);
  
  drawBrowserTitle(context, linesData.options.main || 'Line Plot', width / 2, margin.top / 2);
  drawBrowserXLabel(context, linesData.options.xlab || 'X', width / 2, height - margin.bottom / 3);
  drawBrowserYLabel(context, linesData.options.ylab || 'Y', margin.left / 3, height / 2);

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
}

function renderContourToCanvas(contourData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas ${canvasId} not found`);
    return;
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
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
    return;
  }

  const xGrid = contourData.x || [];
  const yGrid = contourData.y || [];
  const contours = contourData.contours || [];
  
  if (xGrid.length === 0 || yGrid.length === 0 || contours.length === 0) {
    context.fillStyle = 'red';
    context.font = '16px Arial';
    context.textAlign = 'center';
    context.fillText('No contour data to display', width / 2, height / 2);
    return;
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
    return margin.top + (1 - (value - yMin) / yRange) * plotHeight;
  }

  drawBrowserScatterAxes(context, width, height, margin, xMin, xMax, yMin, yMax);
  
  drawBrowserTitle(context, contourData.options.main || 'Contour Plot', width / 2, margin.top / 2);
  drawBrowserXLabel(context, contourData.options.xlab || 'X', width / 2, height - margin.bottom / 3);
  drawBrowserYLabel(context, contourData.options.ylab || 'Y', margin.left / 3, height / 2);

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
}

function renderHeatmapToCanvas(heatmapData, canvasId, renderOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas ${canvasId} not found`);
    return;
  }
  
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
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
    return;
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
    return;
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

  // Draw color legend (simplified for browser)
  const legendWidth = 20;
  const legendHeight = Math.min(200, heatmapHeight);
  const legendX = width - margin.right / 2 - legendWidth / 2;
  const legendY = startY + (heatmapHeight - legendHeight) / 2;
  
  // Create gradient for legend
  const gradient = context.createLinearGradient(0, legendY, 0, legendY + legendHeight);
  gradient.addColorStop(0, rGraphicsFunctions.getHeatmapColor(1, options.colorscheme));
  gradient.addColorStop(1, rGraphicsFunctions.getHeatmapColor(0, options.colorscheme));
  
  context.fillStyle = gradient;
  context.fillRect(legendX, legendY, legendWidth, legendHeight);
  
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
}

// Export functions for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    generateHistogram, 
    renderHistogramToCanvas,
    renderPlotToCanvas,
    renderBoxplotToCanvas,
    renderScatterToCanvas,
    renderBarplotToCanvas,
    renderPieToCanvas,
    renderQQPlotToCanvas,
    renderDensityToCanvas,
    renderLinesToCanvas,
    renderContourToCanvas,
    renderHeatmapToCanvas
  };
}