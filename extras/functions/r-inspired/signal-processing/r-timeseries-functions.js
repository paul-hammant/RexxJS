/**
 * R-style Time Series Analysis and Forecasting Functions for REXX
 * 
 * Implements comprehensive time series analysis capabilities including:
 * - Time series creation and manipulation
 * - Decomposition and trend analysis
 * - Moving averages and smoothing
 * - Autocorrelation and cross-correlation
 * - Basic forecasting methods
 * - Seasonal analysis and adjustment
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

const rTimeseriesFunctions = {
  /**
   * Create a time series object
   * @param {Array|number} data - Time series data or single value
   * @param {number} start - Starting time (default 1)
   * @param {number} frequency - Frequency of observations (default 1)
   * @returns {object} Time series object
   */
  'TS': (data, start = 1, frequency = 1) => {
    try {
      const values = Array.isArray(data) ? data : [data];
      const numericValues = values.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      return {
        type: 'ts',
        data: numericValues,
        start: parseFloat(start),
        frequency: parseFloat(frequency),
        end: parseFloat(start) + (numericValues.length - 1) / parseFloat(frequency),
        length: numericValues.length,
        tsp: [parseFloat(start), parseFloat(start) + (numericValues.length - 1) / parseFloat(frequency), parseFloat(frequency)]
      };
    } catch (error) {
      return { type: 'error', message: `TS error: ${error.message}` };
    }
  },

  /**
   * Extract time series data
   * @param {object} ts - Time series object
   * @returns {Array} Time series values
   */
  'AS_NUMERIC_TS': (ts) => {
    try {
      if (ts && ts.type === 'ts' && Array.isArray(ts.data)) {
        return ts.data;
      }
      return Array.isArray(ts) ? ts : [ts];
    } catch (error) {
      return [0];
    }
  },

  /**
   * Get time series attributes
   * @param {object} ts - Time series object
   * @returns {Array} [start, end, frequency]
   */
  'TSP': (ts) => {
    try {
      if (ts && ts.type === 'ts' && ts.tsp) {
        return ts.tsp;
      }
      return [1, 1, 1];
    } catch (error) {
      return [1, 1, 1];
    }
  },

  /**
   * Simple moving average
   * @param {Array|object} x - Data or time series
   * @param {number} n - Window size
   * @returns {Array} Moving averages
   */
  'SMA': (x, n = 3) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const window = Math.max(1, Math.floor(n));
      
      const result = [];
      for (let i = 0; i < numericData.length; i++) {
        if (i < window - 1) {
          result.push(null);
        } else {
          const sum = numericData.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
          result.push(sum / window);
        }
      }
      return result;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Exponential moving average
   * @param {Array|object} x - Data or time series
   * @param {number} alpha - Smoothing parameter (0-1)
   * @returns {Array} Exponential moving averages
   */
  'EMA': (x, alpha = 0.3) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const smoothing = Math.max(0, Math.min(1, parseFloat(alpha)));
      
      if (numericData.length === 0) return [0];
      
      const result = [numericData[0]];
      for (let i = 1; i < numericData.length; i++) {
        result.push(smoothing * numericData[i] + (1 - smoothing) * result[i - 1]);
      }
      return result;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Calculate differences (lag-k differences)
   * @param {Array|object} x - Data or time series
   * @param {number} lag - Lag for differences (default 1)
   * @param {number} differences - Number of differences (default 1)
   * @returns {Array} Differenced series
   */
  'DIFF': (x, lag = 1, differences = 1) => {
    try {
      let data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      data = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      const lagValue = Math.max(1, Math.floor(lag));
      const diffCount = Math.max(1, Math.floor(differences));
      
      let result = [...data];
      
      for (let d = 0; d < diffCount; d++) {
        const newResult = [];
        for (let i = lagValue; i < result.length; i++) {
          newResult.push(result[i] - result[i - lagValue]);
        }
        result = newResult;
      }
      
      return result;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Lag a time series
   * @param {Array|object} x - Data or time series
   * @param {number} k - Number of lags (default 1)
   * @returns {Array} Lagged series
   */
  'LAG': (x, k = 1) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const lags = Math.floor(k);
      
      if (lags >= 0) {
        return Array(lags).fill(null).concat(numericData.slice(0, -lags || undefined));
      } else {
        return numericData.slice(-lags).concat(Array(-lags).fill(null));
      }
    } catch (error) {
      return [0];
    }
  },

  /**
   * Auto-correlation function
   * @param {Array|object} x - Data or time series
   * @param {number} lag_max - Maximum lag (default 10)
   * @returns {Array} Auto-correlations
   */
  'ACF': (x, lag_max = 10) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      if (numericData.length === 0) {
        return [1, 0];
      }
      
      const maxLag = Math.min(Math.floor(lag_max), numericData.length - 1);
      
      // Calculate mean
      const mean = numericData.reduce((sum, val) => sum + val, 0) / numericData.length;
      
      // Calculate auto-covariances
      const autoCorr = [];
      for (let lag = 0; lag <= maxLag; lag++) {
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < numericData.length - lag; i++) {
          sum += (numericData[i] - mean) * (numericData[i + lag] - mean);
          count++;
        }
        
        const covariance = count > 0 ? sum / count : 0;
        autoCorr.push(lag === 0 ? 1 : (covariance / (sum / (numericData.length - 1) || 1)));
      }
      
      return autoCorr;
    } catch (error) {
      return [1, 0];
    }
  },

  /**
   * Partial auto-correlation function
   * @param {Array|object} x - Data or time series
   * @param {number} lag_max - Maximum lag (default 10)
   * @returns {Array} Partial auto-correlations
   */
  'PACF': (x, lag_max = 10) => {
    try {
      const acf = rTimeseriesFunctions.ACF(x, lag_max);
      const maxLag = Math.min(Math.floor(lag_max), acf.length - 1);
      
      const pacf = [1]; // PACF at lag 0 is always 1
      
      if (acf.length < 2) return pacf;
      
      // Simple approximation for PACF using Yule-Walker equations
      for (let k = 1; k <= maxLag; k++) {
        if (k === 1) {
          pacf.push(acf[1]);
        } else {
          // Simplified calculation - in practice would use Levinson-Durbin
          let numerator = acf[k];
          let denominator = 1;
          
          for (let j = 1; j < k; j++) {
            numerator -= pacf[j] * acf[k - j];
            denominator -= pacf[j] * acf[j];
          }
          
          pacf.push(denominator !== 0 ? numerator / denominator : 0);
        }
      }
      
      return pacf;
    } catch (error) {
      return [1, 0];
    }
  },

  /**
   * Cross-correlation function
   * @param {Array|object} x - First time series
   * @param {Array|object} y - Second time series
   * @param {number} lag_max - Maximum lag (default 10)
   * @returns {Array} Cross-correlations
   */
  'CCF': (x, y, lag_max = 10) => {
    try {
      const dataX = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const dataY = (y && y.type === 'ts') ? y.data : (Array.isArray(y) ? y : [y]);
      
      const numericX = dataX.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const numericY = dataY.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      const minLength = Math.min(numericX.length, numericY.length);
      const maxLag = Math.min(Math.floor(lag_max), minLength - 1);
      
      // Calculate means
      const meanX = numericX.slice(0, minLength).reduce((sum, val) => sum + val, 0) / minLength;
      const meanY = numericY.slice(0, minLength).reduce((sum, val) => sum + val, 0) / minLength;
      
      const ccf = [];
      
      for (let lag = -maxLag; lag <= maxLag; lag++) {
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < minLength; i++) {
          const xIndex = i;
          const yIndex = i + lag;
          
          if (yIndex >= 0 && yIndex < minLength) {
            sum += (numericX[xIndex] - meanX) * (numericY[yIndex] - meanY);
            count++;
          }
        }
        
        ccf.push(count > 0 ? sum / count : 0);
      }
      
      return ccf;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Seasonal decomposition (additive)
   * @param {Array|object} x - Time series data
   * @param {number} frequency - Seasonal frequency (default 12)
   * @returns {object} Decomposition components
   */
  'DECOMPOSE': (x, frequency = 12) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const freq = Math.max(2, Math.floor(frequency));
      
      if (numericData.length < freq * 2) {
        return {
          observed: numericData,
          trend: numericData,
          seasonal: Array(numericData.length).fill(0),
          remainder: Array(numericData.length).fill(0)
        };
      }
      
      // Calculate trend using centered moving average
      const trend = [];
      const halfWindow = Math.floor(freq / 2);
      
      for (let i = 0; i < numericData.length; i++) {
        if (i < halfWindow || i >= numericData.length - halfWindow) {
          trend.push(null);
        } else {
          const sum = numericData.slice(i - halfWindow, i + halfWindow + 1).reduce((a, b) => a + b, 0);
          trend.push(sum / (2 * halfWindow + 1));
        }
      }
      
      // Calculate seasonal component
      const seasonalAvg = Array(freq).fill(0);
      const seasonalCount = Array(freq).fill(0);
      
      for (let i = 0; i < numericData.length; i++) {
        if (trend[i] !== null) {
          const seasonIndex = i % freq;
          seasonalAvg[seasonIndex] += numericData[i] - trend[i];
          seasonalCount[seasonIndex]++;
        }
      }
      
      for (let i = 0; i < freq; i++) {
        seasonalAvg[i] = seasonalCount[i] > 0 ? seasonalAvg[i] / seasonalCount[i] : 0;
      }
      
      // Ensure seasonal components sum to zero
      const seasonalSum = seasonalAvg.reduce((a, b) => a + b, 0);
      const seasonalAdjustment = seasonalSum / freq;
      for (let i = 0; i < freq; i++) {
        seasonalAvg[i] -= seasonalAdjustment;
      }
      
      // Create full seasonal series
      const seasonal = numericData.map((_, i) => seasonalAvg[i % freq]);
      
      // Calculate remainder
      const remainder = numericData.map((val, i) => {
        return trend[i] !== null ? val - trend[i] - seasonal[i] : 0;
      });
      
      return {
        observed: numericData,
        trend: trend,
        seasonal: seasonal,
        remainder: remainder,
        type: 'additive'
      };
    } catch (error) {
      return {
        observed: [0],
        trend: [0],
        seasonal: [0],
        remainder: [0],
        type: 'error'
      };
    }
  },

  /**
   * Seasonal adjustment (remove seasonal component)
   * @param {Array|object} x - Time series data
   * @param {number} frequency - Seasonal frequency (default 12)
   * @returns {Array} Seasonally adjusted series
   */
  'SEASADJ': (x, frequency = 12) => {
    try {
      const decomp = rTimeseriesFunctions.DECOMPOSE(x, frequency);
      return decomp.observed.map((val, i) => val - decomp.seasonal[i]);
    } catch (error) {
      return [0];
    }
  },

  /**
   * Simple exponential smoothing forecast
   * @param {Array|object} x - Time series data
   * @param {number} alpha - Smoothing parameter (default 0.3)
   * @param {number} h - Forecast horizon (default 1)
   * @returns {Array} Forecasted values
   */
  'HW_SIMPLE': (x, alpha = 0.3, h = 1) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const smoothing = Math.max(0, Math.min(1, parseFloat(alpha)));
      const horizon = Math.max(1, Math.floor(h));
      
      if (numericData.length === 0) return Array(horizon).fill(0);
      
      // Simple exponential smoothing
      let level = numericData[0];
      for (let i = 1; i < numericData.length; i++) {
        level = smoothing * numericData[i] + (1 - smoothing) * level;
      }
      
      // Forecast is constant level
      return Array(horizon).fill(level);
    } catch (error) {
      return [0];
    }
  },

  /**
   * Linear trend forecast
   * @param {Array|object} x - Time series data
   * @param {number} h - Forecast horizon (default 1)
   * @returns {Array} Forecasted values
   */
  'TREND_FORECAST': (x, h = 1) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const horizon = Math.max(1, Math.floor(h));
      
      if (numericData.length < 2) return Array(horizon).fill(numericData[0] || 0);
      
      // Simple linear regression to find trend
      const n = numericData.length;
      const xValues = Array.from({length: n}, (_, i) => i + 1);
      
      const sumX = xValues.reduce((a, b) => a + b, 0);
      const sumY = numericData.reduce((a, b) => a + b, 0);
      const sumXY = xValues.reduce((sum, x, i) => sum + x * numericData[i], 0);
      const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Generate forecasts
      const forecasts = [];
      for (let i = 1; i <= horizon; i++) {
        forecasts.push(intercept + slope * (n + i));
      }
      
      return forecasts;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Moving average forecast
   * @param {Array|object} x - Time series data
   * @param {number} n - Window size for moving average (default 3)
   * @param {number} h - Forecast horizon (default 1)
   * @returns {Array} Forecasted values
   */
  'MA_FORECAST': (x, n = 3, h = 1) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const window = Math.max(1, Math.min(numericData.length, Math.floor(n)));
      const horizon = Math.max(1, Math.floor(h));
      
      if (numericData.length < window) {
        const avg = numericData.reduce((a, b) => a + b, 0) / numericData.length;
        return Array(horizon).fill(avg);
      }
      
      // Calculate moving average of last n observations
      const lastValues = numericData.slice(-window);
      const forecast = lastValues.reduce((a, b) => a + b, 0) / window;
      
      return Array(horizon).fill(forecast);
    } catch (error) {
      return [0];
    }
  },

  /**
   * Seasonal naive forecast
   * @param {Array|object} x - Time series data
   * @param {number} frequency - Seasonal frequency (default 12)
   * @param {number} h - Forecast horizon (default 1)
   * @returns {Array} Forecasted values
   */
  'SNAIVE': (x, frequency = 12, h = 1) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const freq = Math.max(1, Math.floor(frequency));
      const horizon = Math.max(1, Math.floor(h));
      
      const forecasts = [];
      for (let i = 0; i < horizon; i++) {
        const seasonalIndex = (numericData.length - freq + (i % freq)) % numericData.length;
        if (seasonalIndex >= 0 && seasonalIndex < numericData.length) {
          forecasts.push(numericData[seasonalIndex]);
        } else {
          forecasts.push(numericData[numericData.length - 1] || 0);
        }
      }
      
      return forecasts;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Calculate time series window
   * @param {Array|object} x - Time series data
   * @param {number} start - Start time
   * @param {number} end - End time
   * @returns {Array} Windowed series
   */
  'WINDOW': (x, start, end) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      const startIndex = Math.max(0, Math.floor(start - 1));
      const endIndex = Math.min(numericData.length, Math.floor(end));
      
      return numericData.slice(startIndex, endIndex);
    } catch (error) {
      return [0];
    }
  },

  /**
   * Time series plot data preparation
   * @param {Array|object} x - Time series data
   * @returns {object} Plot-ready data
   */
  'TS_PLOT': (x) => {
    try {
      const data = (x && x.type === 'ts') ? x.data : (Array.isArray(x) ? x : [x]);
      const ts = (x && x.type === 'ts') ? x : rTimeseriesFunctions.TS(data);
      
      const timePoints = [];
      for (let i = 0; i < ts.data.length; i++) {
        timePoints.push(ts.start + i / ts.frequency);
      }
      
      return {
        type: 'tsplot',
        x: timePoints,
        y: ts.data,
        title: 'Time Series Plot',
        xlab: 'Time',
        ylab: 'Value',
        frequency: ts.frequency,
        start: ts.start,
        end: ts.end
      };
    } catch (error) {
      return { type: 'error', message: 'TS_PLOT failed' };
    }
  }
};

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rTimeseriesFunctions };
} else {
  // Browser environment
  window.rTimeseriesFunctions = rTimeseriesFunctions;
}