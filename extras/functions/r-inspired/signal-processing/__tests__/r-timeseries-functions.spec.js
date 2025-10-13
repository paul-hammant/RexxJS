/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rTimeseriesFunctions } = require('../src/r-timeseries-functions.js');

describe('R Time Series Analysis and Forecasting Functions', () => {
  describe('TS', () => {
    test('should create time series object from array', () => {
      const ts = rTimeseriesFunctions.TS([1, 2, 3, 4, 5]);
      expect(ts.type).toBe('ts');
      expect(ts.data).toEqual([1, 2, 3, 4, 5]);
      expect(ts.start).toBe(1);
      expect(ts.frequency).toBe(1);
      expect(ts.length).toBe(5);
    });

    test('should create time series with custom start and frequency', () => {
      const ts = rTimeseriesFunctions.TS([10, 20, 30], 2000, 12);
      expect(ts.start).toBe(2000);
      expect(ts.frequency).toBe(12);
      expect(ts.end).toBe(2000 + (3-1)/12);
    });

    test('should handle single value', () => {
      const ts = rTimeseriesFunctions.TS(42);
      expect(ts.data).toEqual([42]);
      expect(ts.length).toBe(1);
    });

    test('should filter out non-numeric values', () => {
      const ts = rTimeseriesFunctions.TS([1, 'abc', 3, null, 5]);
      expect(ts.data).toEqual([1, 3, 5]);
    });
  });

  describe('AS_NUMERIC_TS', () => {
    test('should extract data from time series object', () => {
      const ts = rTimeseriesFunctions.TS([1, 2, 3]);
      const data = rTimeseriesFunctions.AS_NUMERIC_TS(ts);
      expect(data).toEqual([1, 2, 3]);
    });

    test('should handle regular array', () => {
      const data = rTimeseriesFunctions.AS_NUMERIC_TS([4, 5, 6]);
      expect(data).toEqual([4, 5, 6]);
    });

    test('should handle single value', () => {
      const data = rTimeseriesFunctions.AS_NUMERIC_TS(7);
      expect(data).toEqual([7]);
    });
  });

  describe('TSP', () => {
    test('should return time series parameters', () => {
      const ts = rTimeseriesFunctions.TS([1, 2, 3, 4], 2020, 4);
      const tsp = rTimeseriesFunctions.TSP(ts);
      expect(tsp).toEqual([2020, 2020 + (4-1)/4, 4]);
    });

    test('should return default for non-ts object', () => {
      const tsp = rTimeseriesFunctions.TSP([1, 2, 3]);
      expect(tsp).toEqual([1, 1, 1]);
    });
  });

  describe('SMA', () => {
    test('should calculate simple moving average', () => {
      const sma = rTimeseriesFunctions.SMA([1, 2, 3, 4, 5], 3);
      expect(sma[0]).toBeNull();
      expect(sma[1]).toBeNull();
      expect(sma[2]).toBe(2); // (1+2+3)/3
      expect(sma[3]).toBe(3); // (2+3+4)/3
      expect(sma[4]).toBe(4); // (3+4+5)/3
    });

    test('should handle time series object', () => {
      const ts = rTimeseriesFunctions.TS([2, 4, 6, 8, 10]);
      const sma = rTimeseriesFunctions.SMA(ts, 2);
      expect(sma[0]).toBeNull();
      expect(sma[1]).toBe(3); // (2+4)/2
      expect(sma[2]).toBe(5); // (4+6)/2
    });

    test('should handle window size of 1', () => {
      const sma = rTimeseriesFunctions.SMA([1, 2, 3], 1);
      expect(sma).toEqual([1, 2, 3]);
    });
  });

  describe('EMA', () => {
    test('should calculate exponential moving average', () => {
      const ema = rTimeseriesFunctions.EMA([2, 4, 6, 8], 0.5);
      expect(ema[0]).toBe(2);
      expect(ema[1]).toBe(3); // 0.5*4 + 0.5*2
      expect(ema[2]).toBe(4.5); // 0.5*6 + 0.5*3
      expect(ema[3]).toBe(6.25); // 0.5*8 + 0.5*4.5
    });

    test('should handle alpha bounds', () => {
      const ema1 = rTimeseriesFunctions.EMA([1, 2, 3], -0.1);
      const ema2 = rTimeseriesFunctions.EMA([1, 2, 3], 1.5);
      expect(ema1).toEqual(rTimeseriesFunctions.EMA([1, 2, 3], 0));
      expect(ema2).toEqual(rTimeseriesFunctions.EMA([1, 2, 3], 1));
    });

    test('should handle empty data', () => {
      const ema = rTimeseriesFunctions.EMA([]);
      expect(ema).toEqual([0]);
    });
  });

  describe('DIFF', () => {
    test('should calculate first differences', () => {
      const diff = rTimeseriesFunctions.DIFF([1, 3, 6, 10, 15]);
      expect(diff).toEqual([2, 3, 4, 5]); // 3-1, 6-3, 10-6, 15-10
    });

    test('should handle custom lag', () => {
      const diff = rTimeseriesFunctions.DIFF([1, 2, 3, 4, 5, 6], 2);
      expect(diff).toEqual([2, 2, 2, 2]); // 3-1, 4-2, 5-3, 6-4
    });

    test('should handle multiple differences', () => {
      const diff = rTimeseriesFunctions.DIFF([1, 4, 9, 16, 25], 1, 2);
      const firstDiff = [3, 5, 7, 9]; // 4-1, 9-4, 16-9, 25-16
      const secondDiff = [2, 2, 2]; // 5-3, 7-5, 9-7
      expect(diff).toEqual(secondDiff);
    });

    test('should handle time series object', () => {
      const ts = rTimeseriesFunctions.TS([10, 12, 15, 19]);
      const diff = rTimeseriesFunctions.DIFF(ts);
      expect(diff).toEqual([2, 3, 4]);
    });
  });

  describe('LAG', () => {
    test('should lag time series forward', () => {
      const lagged = rTimeseriesFunctions.LAG([1, 2, 3, 4, 5], 2);
      expect(lagged).toEqual([null, null, 1, 2, 3]);
    });

    test('should lag time series backward', () => {
      const lagged = rTimeseriesFunctions.LAG([1, 2, 3, 4, 5], -1);
      expect(lagged).toEqual([2, 3, 4, 5, null]);
    });

    test('should handle zero lag', () => {
      const lagged = rTimeseriesFunctions.LAG([1, 2, 3], 0);
      expect(lagged).toEqual([1, 2, 3]);
    });
  });

  describe('ACF', () => {
    test('should calculate auto-correlation', () => {
      const acf = rTimeseriesFunctions.ACF([1, 2, 1, 2, 1, 2], 3);
      expect(acf[0]).toBe(1); // Auto-correlation at lag 0 is always 1
      expect(acf.length).toBe(4); // lag 0 to 3
      expect(Math.abs(acf[1])).toBeGreaterThan(0); // Should have some correlation
    });

    test('should handle constant series', () => {
      const acf = rTimeseriesFunctions.ACF([5, 5, 5, 5, 5], 2);
      expect(acf[0]).toBe(1);
      // Constant series should have undefined correlations, handled gracefully
      expect(acf.length).toBe(3);
    });

    test('should handle short series', () => {
      const acf = rTimeseriesFunctions.ACF([1, 2], 5);
      expect(acf[0]).toBe(1);
      expect(acf.length).toBe(2); // Limited by series length
    });
  });

  describe('PACF', () => {
    test('should calculate partial auto-correlation', () => {
      const pacf = rTimeseriesFunctions.PACF([1, 3, 2, 4, 3, 5], 3);
      expect(pacf[0]).toBe(1); // PACF at lag 0 is always 1
      expect(pacf.length).toBe(4); // lag 0 to 3
      expect(typeof pacf[1]).toBe('number');
    });

    test('should handle small series', () => {
      const pacf = rTimeseriesFunctions.PACF([1, 2], 3);
      expect(pacf[0]).toBe(1);
      expect(pacf.length).toBe(2);
    });
  });

  describe('CCF', () => {
    test('should calculate cross-correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 3, 4, 5, 6];
      const ccf = rTimeseriesFunctions.CCF(x, y, 2);
      expect(ccf.length).toBe(5); // -2 to +2 lags
      expect(typeof ccf[2]).toBe('number'); // Middle value (lag 0)
    });

    test('should handle identical series', () => {
      const series = [1, 2, 3, 4];
      const ccf = rTimeseriesFunctions.CCF(series, series, 1);
      expect(ccf.length).toBe(3); // -1 to +1 lags
    });

    test('should handle different length series', () => {
      const ccf = rTimeseriesFunctions.CCF([1, 2, 3], [4, 5, 6, 7, 8], 1);
      expect(ccf.length).toBe(3);
    });
  });

  describe('DECOMPOSE', () => {
    test('should decompose time series', () => {
      const data = [1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10];
      const decomp = rTimeseriesFunctions.DECOMPOSE(data, 4);
      
      expect(decomp.observed).toEqual(data);
      expect(decomp.trend).toHaveLength(data.length);
      expect(decomp.seasonal).toHaveLength(data.length);
      expect(decomp.remainder).toHaveLength(data.length);
      expect(decomp.type).toBe('additive');
    });

    test('should handle short series', () => {
      const data = [1, 2, 3];
      const decomp = rTimeseriesFunctions.DECOMPOSE(data, 4);
      
      expect(decomp.observed).toEqual(data);
      expect(decomp.trend).toEqual(data); // Too short for decomposition
      expect(decomp.seasonal).toEqual([0, 0, 0]);
    });

    test('should ensure seasonal components sum to zero', () => {
      const data = Array.from({length: 24}, (_, i) => 10 + 2 * Math.sin(2 * Math.PI * i / 12) + Math.random());
      const decomp = rTimeseriesFunctions.DECOMPOSE(data, 12);
      
      // Check that first 12 seasonal values sum to approximately zero
      const seasonalSum = decomp.seasonal.slice(0, 12).reduce((a, b) => a + b, 0);
      expect(Math.abs(seasonalSum)).toBeLessThan(1e-10);
    });
  });

  describe('SEASADJ', () => {
    test('should remove seasonal component', () => {
      const data = [10, 12, 8, 14, 10, 12, 8, 14];
      const adjusted = rTimeseriesFunctions.SEASADJ(data, 4);
      
      expect(adjusted).toHaveLength(data.length);
      expect(typeof adjusted[0]).toBe('number');
    });

    test('should handle single value', () => {
      const adjusted = rTimeseriesFunctions.SEASADJ([5]);
      expect(adjusted).toEqual([5]);
    });
  });

  describe('HW_SIMPLE', () => {
    test('should forecast using simple exponential smoothing', () => {
      const forecast = rTimeseriesFunctions.HW_SIMPLE([2, 4, 6, 8, 10], 0.3, 3);
      expect(forecast).toHaveLength(3);
      expect(typeof forecast[0]).toBe('number');
      expect(forecast[0]).toBeCloseTo(forecast[1]); // Should be constant
    });

    test('should handle time series object', () => {
      const ts = rTimeseriesFunctions.TS([1, 2, 3, 4]);
      const forecast = rTimeseriesFunctions.HW_SIMPLE(ts, 0.5, 2);
      expect(forecast).toHaveLength(2);
    });

    test('should handle empty data', () => {
      const forecast = rTimeseriesFunctions.HW_SIMPLE([], 0.3, 2);
      expect(forecast).toEqual([0, 0]);
    });
  });

  describe('TREND_FORECAST', () => {
    test('should forecast using linear trend', () => {
      const forecast = rTimeseriesFunctions.TREND_FORECAST([1, 2, 3, 4, 5], 3);
      expect(forecast).toHaveLength(3);
      expect(forecast[0]).toBeCloseTo(6, 1); // Should continue trend
      expect(forecast[1]).toBeCloseTo(7, 1);
      expect(forecast[2]).toBeCloseTo(8, 1);
    });

    test('should handle constant series', () => {
      const forecast = rTimeseriesFunctions.TREND_FORECAST([5, 5, 5, 5], 2);
      expect(forecast).toHaveLength(2);
      expect(forecast[0]).toBeCloseTo(5, 1); // No trend
    });

    test('should handle single value', () => {
      const forecast = rTimeseriesFunctions.TREND_FORECAST([10], 2);
      expect(forecast).toEqual([10, 10]);
    });
  });

  describe('MA_FORECAST', () => {
    test('should forecast using moving average', () => {
      const forecast = rTimeseriesFunctions.MA_FORECAST([2, 4, 6, 8, 10], 3, 2);
      const expectedAvg = (6 + 8 + 10) / 3;
      expect(forecast).toHaveLength(2);
      expect(forecast[0]).toBeCloseTo(expectedAvg);
      expect(forecast[1]).toBeCloseTo(expectedAvg);
    });

    test('should handle window larger than data', () => {
      const forecast = rTimeseriesFunctions.MA_FORECAST([1, 2], 5, 1);
      expect(forecast).toEqual([1.5]); // Average of all data
    });

    test('should handle default parameters', () => {
      const forecast = rTimeseriesFunctions.MA_FORECAST([1, 2, 3, 4, 5]);
      expect(forecast).toHaveLength(1);
      expect(forecast[0]).toBe(4); // Average of last 3 values
    });
  });

  describe('SNAIVE', () => {
    test('should forecast using seasonal naive method', () => {
      const data = [10, 20, 15, 25, 12, 22, 17, 27];
      const forecast = rTimeseriesFunctions.SNAIVE(data, 4, 6);
      
      expect(forecast).toHaveLength(6);
      expect(forecast[0]).toBe(12); // Same as 4 periods ago
      expect(forecast[1]).toBe(22); // Same as 4 periods ago
    });

    test('should handle short series', () => {
      const forecast = rTimeseriesFunctions.SNAIVE([1, 2], 3, 2);
      expect(forecast).toHaveLength(2);
      expect(typeof forecast[0]).toBe('number');
    });

    test('should handle frequency of 1', () => {
      const forecast = rTimeseriesFunctions.SNAIVE([1, 2, 3], 1, 2);
      expect(forecast).toEqual([3, 3]); // Last value repeated
    });
  });

  describe('WINDOW', () => {
    test('should extract time series window', () => {
      const windowed = rTimeseriesFunctions.WINDOW([1, 2, 3, 4, 5, 6], 2, 5);
      expect(windowed).toEqual([2, 3, 4, 5]); // Index 1 to 4 (0-based)
    });

    test('should handle bounds', () => {
      const windowed = rTimeseriesFunctions.WINDOW([1, 2, 3], 0, 10);
      expect(windowed).toEqual([1, 2, 3]); // Bounded by data length
    });

    test('should handle time series object', () => {
      const ts = rTimeseriesFunctions.TS([10, 20, 30, 40]);
      const windowed = rTimeseriesFunctions.WINDOW(ts, 2, 3);
      expect(windowed).toEqual([20, 30]);
    });
  });

  describe('TS_PLOT', () => {
    test('should prepare time series plot data', () => {
      const data = [1, 2, 3, 4];
      const plotData = rTimeseriesFunctions.TS_PLOT(data);
      
      expect(plotData.type).toBe('tsplot');
      expect(plotData.x).toHaveLength(4);
      expect(plotData.y).toEqual([1, 2, 3, 4]);
      expect(plotData.title).toBe('Time Series Plot');
      expect(plotData.xlab).toBe('Time');
      expect(plotData.ylab).toBe('Value');
    });

    test('should handle time series object with custom frequency', () => {
      const ts = rTimeseriesFunctions.TS([10, 20, 30], 2020, 4);
      const plotData = rTimeseriesFunctions.TS_PLOT(ts);
      
      expect(plotData.x).toEqual([2020, 2020.25, 2020.5]);
      expect(plotData.frequency).toBe(4);
      expect(plotData.start).toBe(2020);
    });

    test('should handle single value', () => {
      const plotData = rTimeseriesFunctions.TS_PLOT([42]);
      expect(plotData.x).toEqual([1]);
      expect(plotData.y).toEqual([42]);
    });
  });

  // Edge cases and error handling
  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(() => rTimeseriesFunctions.TS(null)).not.toThrow();
      expect(() => rTimeseriesFunctions.SMA(null)).not.toThrow();
      expect(() => rTimeseriesFunctions.ACF(null)).not.toThrow();
      expect(() => rTimeseriesFunctions.DECOMPOSE(null)).not.toThrow();
    });

    test('should return meaningful defaults for edge cases', () => {
      const emptyTS = rTimeseriesFunctions.TS([]);
      expect(emptyTS.data).toEqual([]);
      
      const emptyACF = rTimeseriesFunctions.ACF([]);
      expect(emptyACF).toEqual([1, 0]);
      
      const emptyForecast = rTimeseriesFunctions.HW_SIMPLE([]);
      expect(emptyForecast).toEqual([0]);
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    test('should work together in time series analysis workflow', () => {
      // Create time series
      const rawData = [10, 12, 14, 16, 11, 13, 15, 17, 12, 14, 16, 18];
      const ts = rTimeseriesFunctions.TS(rawData, 2020, 12);
      
      // Decompose
      const decomp = rTimeseriesFunctions.DECOMPOSE(ts, 4);
      expect(decomp.type).toBe('additive');
      
      // Calculate ACF
      const acf = rTimeseriesFunctions.ACF(ts, 5);
      expect(acf[0]).toBe(1);
      
      // Forecast
      const forecast = rTimeseriesFunctions.TREND_FORECAST(ts, 3);
      expect(forecast).toHaveLength(3);
      
      // Moving average
      const sma = rTimeseriesFunctions.SMA(ts, 3);
      expect(sma).toHaveLength(rawData.length);
    });
    
    test('should handle differencing and forecasting workflow', () => {
      const data = [1, 4, 9, 16, 25, 36, 49]; // Quadratic series
      
      // First difference
      const diff1 = rTimeseriesFunctions.DIFF(data);
      expect(diff1).toEqual([3, 5, 7, 9, 11, 13]); // Linear
      
      // Second difference
      const diff2 = rTimeseriesFunctions.DIFF(data, 1, 2);
      expect(diff2).toEqual([2, 2, 2, 2, 2]); // Constant
      
      // Forecast on differenced series
      const forecast = rTimeseriesFunctions.MA_FORECAST(diff2, 3, 2);
      expect(forecast).toEqual([2, 2]); // Should forecast constant
    });
  });
});