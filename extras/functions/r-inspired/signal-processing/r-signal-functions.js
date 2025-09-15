/**
 * R-style Signal Processing and Filtering Functions for REXX
 * 
 * Implements comprehensive signal processing capabilities including:
 * - Fourier transforms (FFT, DFT)
 * - Digital filtering (low-pass, high-pass, band-pass)
 * - Signal generation and windowing
 * - Spectral analysis and power spectral density
 * - Convolution and correlation
 * - Signal smoothing and denoising
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

const rSignalFunctions = {
  /**
   * Fast Fourier Transform (simplified implementation)
   * @param {Array} signal - Input signal
   * @returns {Array} Complex FFT result
   */
  'FFT': (signal) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const n = numericData.length;
      
      if (n === 0) return [];
      
      // For simplicity, implement DFT instead of full FFT
      const result = [];
      
      for (let k = 0; k < n; k++) {
        let realSum = 0;
        let imagSum = 0;
        
        for (let j = 0; j < n; j++) {
          const angle = -2 * Math.PI * k * j / n;
          realSum += numericData[j] * Math.cos(angle);
          imagSum += numericData[j] * Math.sin(angle);
        }
        
        result.push({
          real: realSum,
          imag: imagSum,
          magnitude: Math.sqrt(realSum * realSum + imagSum * imagSum),
          phase: Math.atan2(imagSum, realSum)
        });
      }
      
      return result;
    } catch (error) {
      return [{ error: `FFT error: ${error.message}` }];
    }
  },

  /**
   * Inverse Fast Fourier Transform
   * @param {Array} fftResult - Complex FFT data
   * @returns {Array} Time domain signal
   */
  'IFFT': (fftResult) => {
    try {
      if (!Array.isArray(fftResult) || fftResult.length === 0) {
        return [0];
      }
      
      const n = fftResult.length;
      const result = [];
      
      for (let j = 0; j < n; j++) {
        let sum = 0;
        
        for (let k = 0; k < n; k++) {
          const fftPoint = fftResult[k];
          const real = fftPoint.real || 0;
          const imag = fftPoint.imag || 0;
          const angle = 2 * Math.PI * k * j / n;
          
          sum += real * Math.cos(angle) - imag * Math.sin(angle);
        }
        
        result.push(sum / n);
      }
      
      return result;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Generate sine wave
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds (default 1)
   * @param {number} sampleRate - Sample rate in Hz (default 100)
   * @param {number} amplitude - Amplitude (default 1)
   * @returns {Array} Sine wave samples
   */
  'SINE_WAVE': (frequency, duration = 1, sampleRate = 100, amplitude = 1) => {
    try {
      const freq = parseFloat(frequency) || 0;
      const dur = Math.max(0.1, parseFloat(duration));
      const fs = Math.max(1, parseFloat(sampleRate));
      const amp = parseFloat(amplitude) || 1;
      
      const numSamples = Math.floor(dur * fs);
      const signal = [];
      
      for (let i = 0; i < numSamples; i++) {
        const t = i / fs;
        signal.push(amp * Math.sin(2 * Math.PI * freq * t));
      }
      
      return signal;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Generate cosine wave
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds (default 1)
   * @param {number} sampleRate - Sample rate in Hz (default 100)
   * @param {number} amplitude - Amplitude (default 1)
   * @returns {Array} Cosine wave samples
   */
  'COSINE_WAVE': (frequency, duration = 1, sampleRate = 100, amplitude = 1) => {
    try {
      const freq = parseFloat(frequency) || 0;
      const dur = Math.max(0.1, parseFloat(duration));
      const fs = Math.max(1, parseFloat(sampleRate));
      const amp = parseFloat(amplitude) || 1;
      
      const numSamples = Math.floor(dur * fs);
      const signal = [];
      
      for (let i = 0; i < numSamples; i++) {
        const t = i / fs;
        signal.push(amp * Math.cos(2 * Math.PI * freq * t));
      }
      
      return signal;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Generate white noise
   * @param {number} length - Number of samples
   * @param {number} amplitude - Noise amplitude (default 1)
   * @returns {Array} White noise signal
   */
  'WHITE_NOISE': (length, amplitude = 1) => {
    try {
      const n = Math.max(0, Math.floor(length));
      if (n === 0) return [0];
      const amp = isNaN(parseFloat(amplitude)) ? 1 : parseFloat(amplitude);
      const signal = [];
      
      for (let i = 0; i < n; i++) {
        signal.push(amp === 0 ? 0 : amp * (Math.random() * 2 - 1));
      }
      
      return signal;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Apply Hanning window
   * @param {Array} signal - Input signal
   * @returns {Array} Windowed signal
   */
  'HANNING': (signal) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const n = numericData.length;
      
      if (n === 0) return [0];
      
      const windowed = [];
      
      for (let i = 0; i < n; i++) {
        const windowValue = n === 1 ? 0 : 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
        windowed.push(numericData[i] * windowValue);
      }
      
      return windowed;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Apply Hamming window
   * @param {Array} signal - Input signal
   * @returns {Array} Windowed signal
   */
  'HAMMING': (signal) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const n = numericData.length;
      
      if (n === 0) return [0];
      
      const windowed = [];
      
      for (let i = 0; i < n; i++) {
        const windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
        windowed.push(numericData[i] * windowValue);
      }
      
      return windowed;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Apply Blackman window
   * @param {Array} signal - Input signal
   * @returns {Array} Windowed signal
   */
  'BLACKMAN': (signal) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const n = numericData.length;
      
      if (n === 0) return [0];
      
      const windowed = [];
      
      for (let i = 0; i < n; i++) {
        const a0 = 0.42;
        const a1 = 0.5;
        const a2 = 0.08;
        const windowValue = a0 - a1 * Math.cos(2 * Math.PI * i / (n - 1)) + 
                           a2 * Math.cos(4 * Math.PI * i / (n - 1));
        windowed.push(numericData[i] * windowValue);
      }
      
      return windowed;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Low-pass filter (simple moving average implementation)
   * @param {Array} signal - Input signal
   * @param {number} cutoffFreq - Cutoff frequency (normalized 0-1)
   * @returns {Array} Filtered signal
   */
  'LOW_PASS_FILTER': (signal, cutoffFreq = 0.1) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const fc = Math.max(0.01, Math.min(0.5, parseFloat(cutoffFreq)));
      
      // Simple low-pass filter using exponential smoothing
      const alpha = 2 * Math.PI * fc;
      const filtered = [numericData[0] || 0];
      
      for (let i = 1; i < numericData.length; i++) {
        const smoothed = alpha * numericData[i] + (1 - alpha) * filtered[i - 1];
        filtered.push(smoothed);
      }
      
      return filtered;
    } catch (error) {
      return [0];
    }
  },

  /**
   * High-pass filter
   * @param {Array} signal - Input signal
   * @param {number} cutoffFreq - Cutoff frequency (normalized 0-1)
   * @returns {Array} Filtered signal
   */
  'HIGH_PASS_FILTER': (signal, cutoffFreq = 0.1) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      // High-pass = original - low-pass
      const lowpass = rSignalFunctions.LOW_PASS_FILTER(numericData, cutoffFreq);
      const filtered = [];
      
      for (let i = 0; i < numericData.length; i++) {
        filtered.push(numericData[i] - (lowpass[i] || 0));
      }
      
      return filtered;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Band-pass filter
   * @param {Array} signal - Input signal
   * @param {number} lowCutoff - Low cutoff frequency (normalized 0-1)
   * @param {number} highCutoff - High cutoff frequency (normalized 0-1)
   * @returns {Array} Filtered signal
   */
  'BAND_PASS_FILTER': (signal, lowCutoff = 0.1, highCutoff = 0.4) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      
      // Apply high-pass filter first, then low-pass
      const highpassed = rSignalFunctions.HIGH_PASS_FILTER(data, lowCutoff);
      const bandpassed = rSignalFunctions.LOW_PASS_FILTER(highpassed, highCutoff);
      
      return bandpassed;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Convolution of two signals
   * @param {Array} signal1 - First signal
   * @param {Array} signal2 - Second signal (kernel)
   * @returns {Array} Convolved signal
   */
  'CONVOLVE': (signal1, signal2) => {
    try {
      const x = Array.isArray(signal1) ? signal1.map(v => parseFloat(v)).filter(v => !isNaN(v)) : [parseFloat(signal1)];
      const h = Array.isArray(signal2) ? signal2.map(v => parseFloat(v)).filter(v => !isNaN(v)) : [parseFloat(signal2)];
      
      if (x.length === 0 || h.length === 0) return [0];
      
      const result = [];
      const resultLength = x.length + h.length - 1;
      
      for (let n = 0; n < resultLength; n++) {
        let sum = 0;
        for (let k = 0; k < h.length; k++) {
          const xIndex = n - k;
          if (xIndex >= 0 && xIndex < x.length) {
            sum += x[xIndex] * h[k];
          }
        }
        result.push(sum);
      }
      
      return result;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Cross-correlation of two signals
   * @param {Array} signal1 - First signal
   * @param {Array} signal2 - Second signal
   * @returns {Array} Cross-correlation result
   */
  'XCORR': (signal1, signal2) => {
    try {
      const x = Array.isArray(signal1) ? signal1.map(v => parseFloat(v)).filter(v => !isNaN(v)) : [parseFloat(signal1)];
      const y = Array.isArray(signal2) ? signal2.map(v => parseFloat(v)).filter(v => !isNaN(v)) : [parseFloat(signal2)];
      
      if (x.length === 0 || y.length === 0) return [0];
      
      const result = [];
      const maxLag = Math.max(x.length, y.length) - 1;
      
      for (let lag = -maxLag; lag <= maxLag; lag++) {
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < x.length; i++) {
          const j = i + lag;
          if (j >= 0 && j < y.length) {
            sum += x[i] * y[j];
            count++;
          }
        }
        
        result.push(count > 0 ? sum : 0);
      }
      
      return result;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Power Spectral Density
   * @param {Array} signal - Input signal
   * @param {number} sampleRate - Sample rate (default 1)
   * @returns {object} PSD result with frequencies and power
   */
  'PSD': (signal, sampleRate = 1) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const fs = Math.max(0.1, parseFloat(sampleRate));
      
      if (numericData.length === 0) {
        return { frequencies: [0], power: [0] };
      }
      
      // Apply window and compute FFT
      const windowed = rSignalFunctions.HANNING(numericData);
      const fftResult = rSignalFunctions.FFT(windowed);
      
      const n = fftResult.length;
      const frequencies = [];
      const power = [];
      
      // Only use first half of FFT (positive frequencies)
      const halfN = Math.floor(n / 2);
      
      for (let i = 0; i <= halfN; i++) {
        frequencies.push(i * fs / n);
        const magnitude = fftResult[i].magnitude || 0;
        power.push(magnitude * magnitude / n);
      }
      
      return {
        type: 'psd',
        frequencies: frequencies,
        power: power,
        sampleRate: fs
      };
    } catch (error) {
      return { frequencies: [0], power: [0], error: `PSD error: ${error.message}` };
    }
  },

  /**
   * Spectrogram (simplified)
   * @param {Array} signal - Input signal
   * @param {number} windowSize - Window size (default 64)
   * @param {number} overlap - Overlap ratio (default 0.5)
   * @returns {object} Spectrogram data
   */
  'SPECTROGRAM': (signal, windowSize = 64, overlap = 0.5) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const winSize = Math.min(Math.max(8, Math.floor(windowSize)), numericData.length);
      const overlapRatio = Math.max(0, Math.min(0.9, parseFloat(overlap)));
      
      const hopSize = Math.floor(winSize * (1 - overlapRatio));
      const spectrogram = [];
      const timeSteps = [];
      
      for (let start = 0; start + winSize <= numericData.length; start += hopSize) {
        const window = numericData.slice(start, start + winSize);
        const windowed = rSignalFunctions.HANNING(window);
        const fft = rSignalFunctions.FFT(windowed);
        
        const spectrum = fft.slice(0, Math.floor(winSize / 2)).map(f => f.magnitude || 0);
        spectrogram.push(spectrum);
        timeSteps.push(start / numericData.length);
      }
      
      // Generate frequency bins
      const freqBins = [];
      for (let i = 0; i < Math.floor(winSize / 2); i++) {
        freqBins.push(i / winSize);
      }
      
      return {
        type: 'spectrogram',
        data: spectrogram,
        timeSteps: timeSteps,
        frequencyBins: freqBins,
        windowSize: winSize
      };
    } catch (error) {
      return { 
        data: [[0]], 
        timeSteps: [0], 
        frequencyBins: [0], 
        error: `SPECTROGRAM error: ${error.message}` 
      };
    }
  },

  /**
   * Signal envelope detection
   * @param {Array} signal - Input signal
   * @returns {Array} Signal envelope
   */
  'ENVELOPE': (signal) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      if (numericData.length === 0) return [0];
      
      // Simple envelope detection using absolute value and low-pass filtering
      const absSignal = numericData.map(val => Math.abs(val));
      const envelope = rSignalFunctions.LOW_PASS_FILTER(absSignal, 0.1);
      
      return envelope;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Zero-crossing detection
   * @param {Array} signal - Input signal
   * @returns {Array} Zero-crossing indices
   */
  'ZERO_CROSSINGS': (signal) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      
      if (numericData.length < 2) return [];
      
      const crossings = [];
      
      for (let i = 1; i < numericData.length; i++) {
        if ((numericData[i-1] >= 0 && numericData[i] < 0) || 
            (numericData[i-1] < 0 && numericData[i] >= 0)) {
          crossings.push(i);
        }
      }
      
      return crossings;
    } catch (error) {
      return [];
    }
  },

  /**
   * Signal detrending (remove linear trend)
   * @param {Array} signal - Input signal
   * @returns {Array} Detrended signal
   */
  'DETREND': (signal) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const n = numericData.length;
      
      if (n < 2) return numericData;
      
      // Calculate linear trend using least squares
      const xSum = n * (n - 1) / 2;
      const ySum = numericData.reduce((sum, val) => sum + val, 0);
      const xySum = numericData.reduce((sum, val, i) => sum + i * val, 0);
      const xxSum = n * (n - 1) * (2 * n - 1) / 6;
      
      const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
      const intercept = (ySum - slope * xSum) / n;
      
      // Remove trend
      const detrended = numericData.map((val, i) => val - (intercept + slope * i));
      
      return detrended;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Signal resampling (simple linear interpolation)
   * @param {Array} signal - Input signal
   * @param {number} newLength - New signal length
   * @returns {Array} Resampled signal
   */
  'RESAMPLE': (signal, newLength) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const targetLength = Math.max(1, Math.floor(newLength));
      
      if (numericData.length === 0) return Array(targetLength).fill(0);
      if (numericData.length === 1) return Array(targetLength).fill(numericData[0]);
      
      const resampled = [];
      const ratio = (numericData.length - 1) / (targetLength - 1);
      
      for (let i = 0; i < targetLength; i++) {
        const exactIndex = i * ratio;
        const lowerIndex = Math.floor(exactIndex);
        const upperIndex = Math.min(lowerIndex + 1, numericData.length - 1);
        const fraction = exactIndex - lowerIndex;
        
        const interpolated = numericData[lowerIndex] * (1 - fraction) + 
                           numericData[upperIndex] * fraction;
        resampled.push(interpolated);
      }
      
      return resampled;
    } catch (error) {
      return [0];
    }
  },

  /**
   * Find signal peaks
   * @param {Array} signal - Input signal
   * @param {number} threshold - Minimum peak height (default 0.1)
   * @returns {Array} Peak indices and values
   */
  'FIND_PEAKS': (signal, threshold = 0.1) => {
    try {
      const data = Array.isArray(signal) ? signal : [signal];
      const numericData = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
      const minHeight = parseFloat(threshold) || 0;
      
      if (numericData.length < 3) return [];
      
      const peaks = [];
      
      for (let i = 1; i < numericData.length - 1; i++) {
        if (numericData[i] > numericData[i-1] && 
            numericData[i] > numericData[i+1] && 
            numericData[i] >= minHeight) {
          peaks.push({
            index: i,
            value: numericData[i]
          });
        }
      }
      
      return peaks;
    } catch (error) {
      return [];
    }
  }
};

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rSignalFunctions };
} else {
  // Browser environment
  window.rSignalFunctions = rSignalFunctions;
}