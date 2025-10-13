/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rSignalFunctions } = require('../r-signal-functions.js');

describe('R Signal Processing and Filtering Functions', () => {
  describe('FFT', () => {
    test('should compute FFT of simple signal', () => {
      const signal = [1, 0, -1, 0];
      const result = rSignalFunctions.FFT(signal);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toHaveProperty('real');
      expect(result[0]).toHaveProperty('imag');
      expect(result[0]).toHaveProperty('magnitude');
      expect(result[0]).toHaveProperty('phase');
      
      // DC component should be 0 (sum of [1,0,-1,0] = 0)
      expect(result[0].real).toBeCloseTo(0, 1);
    });

    test('should handle constant signal', () => {
      const signal = [5, 5, 5, 5];
      const result = rSignalFunctions.FFT(signal);
      
      expect(result).toHaveLength(4);
      expect(result[0].real).toBeCloseTo(20, 1); // DC component = 4 * 5
      expect(result[1].magnitude).toBeCloseTo(0, 1); // No AC components
    });

    test('should handle single value', () => {
      const result = rSignalFunctions.FFT([42]);
      expect(result).toHaveLength(1);
      expect(result[0].real).toBe(42);
      expect(result[0].imag).toBe(0);
    });

    test('should handle empty signal', () => {
      const result = rSignalFunctions.FFT([]);
      expect(result).toEqual([]);
    });
  });

  describe('IFFT', () => {
    test('should invert FFT result', () => {
      const original = [1, 2, 3, 4];
      const fftResult = rSignalFunctions.FFT(original);
      const reconstructed = rSignalFunctions.IFFT(fftResult);
      
      expect(reconstructed).toHaveLength(4);
      for (let i = 0; i < 4; i++) {
        expect(reconstructed[i]).toBeCloseTo(original[i], 1);
      }
    });

    test('should handle empty FFT result', () => {
      const result = rSignalFunctions.IFFT([]);
      expect(result).toEqual([0]);
    });

    test('should handle malformed FFT data', () => {
      const result = rSignalFunctions.IFFT([{}, { real: 1 }, { imag: 2 }]);
      expect(result).toHaveLength(3);
      expect(typeof result[0]).toBe('number');
    });
  });

  describe('SINE_WAVE', () => {
    test('should generate sine wave with correct frequency', () => {
      const wave = rSignalFunctions.SINE_WAVE(1, 1, 8, 1);
      
      expect(wave).toHaveLength(8);
      expect(wave[0]).toBeCloseTo(0, 1); // sin(0) = 0
      expect(wave[2]).toBeCloseTo(1, 1); // sin(π/2) ≈ 1
      expect(wave[4]).toBeCloseTo(0, 1); // sin(π) = 0
      expect(wave[6]).toBeCloseTo(-1, 1); // sin(3π/2) ≈ -1
    });

    test('should handle different amplitude', () => {
      const wave = rSignalFunctions.SINE_WAVE(1, 1, 4, 2);
      
      expect(Math.max(...wave)).toBeCloseTo(2, 1);
      expect(Math.min(...wave)).toBeCloseTo(-2, 1);
    });

    test('should handle default parameters', () => {
      const wave = rSignalFunctions.SINE_WAVE(1);
      expect(wave).toHaveLength(100); // 1 second * 100 Hz
      expect(typeof wave[0]).toBe('number');
    });

    test('should handle zero frequency', () => {
      const wave = rSignalFunctions.SINE_WAVE(0, 1, 10);
      expect(wave.every(val => val === 0)).toBe(true);
    });
  });

  describe('COSINE_WAVE', () => {
    test('should generate cosine wave with correct phase', () => {
      const wave = rSignalFunctions.COSINE_WAVE(1, 1, 8, 1);
      
      expect(wave).toHaveLength(8);
      expect(wave[0]).toBeCloseTo(1, 1); // cos(0) = 1
      expect(wave[2]).toBeCloseTo(0, 1); // cos(π/2) = 0
      expect(wave[4]).toBeCloseTo(-1, 1); // cos(π) = -1
    });

    test('should differ from sine wave by π/2', () => {
      const sine = rSignalFunctions.SINE_WAVE(1, 1, 100, 1);
      const cosine = rSignalFunctions.COSINE_WAVE(1, 1, 100, 1);
      
      // Cosine should be 90 degrees ahead of sine
      const shift = Math.floor(100 / 4); // Quarter period shift
      for (let i = 0; i < sine.length - shift; i++) {
        expect(cosine[i]).toBeCloseTo(sine[i + shift], 1);
      }
    });
  });

  describe('WHITE_NOISE', () => {
    test('should generate noise of correct length', () => {
      const noise = rSignalFunctions.WHITE_NOISE(100, 1);
      expect(noise).toHaveLength(100);
    });

    test('should be within amplitude bounds', () => {
      const amplitude = 2;
      const noise = rSignalFunctions.WHITE_NOISE(1000, amplitude);
      
      const maxVal = Math.max(...noise);
      const minVal = Math.min(...noise);
      
      expect(maxVal).toBeLessThanOrEqual(amplitude);
      expect(minVal).toBeGreaterThanOrEqual(-amplitude);
    });

    test('should be approximately random', () => {
      const noise1 = rSignalFunctions.WHITE_NOISE(100, 1);
      const noise2 = rSignalFunctions.WHITE_NOISE(100, 1);
      
      // Should not be identical (very low probability)
      const identical = noise1.every((val, i) => Math.abs(val - noise2[i]) < 0.001);
      expect(identical).toBe(false);
    });

    test('should handle zero amplitude', () => {
      const noise = rSignalFunctions.WHITE_NOISE(10, 0);
      expect(noise.every(val => val === 0)).toBe(true);
    });
  });

  describe('Window Functions', () => {
    describe('HANNING', () => {
      test('should apply Hanning window', () => {
        const signal = [1, 1, 1, 1, 1];
        const windowed = rSignalFunctions.HANNING(signal);
        
        expect(windowed).toHaveLength(5);
        expect(windowed[0]).toBeCloseTo(0, 1); // Should be 0 at edges
        expect(windowed[4]).toBeCloseTo(0, 1);
        expect(windowed[2]).toBeCloseTo(1, 1); // Should be 1 at center
      });

      test('should handle empty signal', () => {
        const windowed = rSignalFunctions.HANNING([]);
        expect(windowed).toEqual([0]);
      });

      test('should handle single value', () => {
        const windowed = rSignalFunctions.HANNING([5]);
        expect(windowed).toEqual([0]); // Single point Hanning = 0
      });
    });

    describe('HAMMING', () => {
      test('should apply Hamming window', () => {
        const signal = [1, 1, 1, 1, 1];
        const windowed = rSignalFunctions.HAMMING(signal);
        
        expect(windowed).toHaveLength(5);
        expect(windowed[0]).toBeCloseTo(0.08, 1); // Hamming doesn't go to zero
        expect(windowed[2]).toBeCloseTo(1, 1); // Peak at center
      });
    });

    describe('BLACKMAN', () => {
      test('should apply Blackman window', () => {
        const signal = [1, 1, 1, 1, 1];
        const windowed = rSignalFunctions.BLACKMAN(signal);
        
        expect(windowed).toHaveLength(5);
        expect(windowed[0]).toBeCloseTo(0, 1); // Near zero at edges
        expect(windowed[2]).toBeCloseTo(1, 1); // Peak at center
      });
    });
  });

  describe('Filtering Functions', () => {
    describe('LOW_PASS_FILTER', () => {
      test('should smooth high-frequency noise', () => {
        // Create signal with high-frequency noise
        const signal = [1, -1, 1, -1, 1, -1, 1, -1];
        const filtered = rSignalFunctions.LOW_PASS_FILTER(signal, 0.1);
        
        expect(filtered).toHaveLength(8);
        
        // Filtered signal should be smoother (less variation)
        const originalVar = rSignalFunctions.variance(signal);
        const filteredVar = rSignalFunctions.variance(filtered);
        expect(filteredVar).toBeLessThan(originalVar);
      });

      test('should preserve DC component', () => {
        const signal = Array(10).fill(5);
        const filtered = rSignalFunctions.LOW_PASS_FILTER(signal, 0.1);
        
        filtered.forEach(val => {
          expect(val).toBeCloseTo(5, 1);
        });
      });

      test('should handle empty signal', () => {
        const filtered = rSignalFunctions.LOW_PASS_FILTER([], 0.1);
        expect(filtered).toEqual([0]);
      });
    });

    describe('HIGH_PASS_FILTER', () => {
      test('should remove DC component', () => {
        const signal = [5, 5, 5, 5, 5];
        const filtered = rSignalFunctions.HIGH_PASS_FILTER(signal, 0.1);
        
        expect(filtered).toHaveLength(5);
        
        // Should remove constant component
        const mean = filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
        expect(Math.abs(mean)).toBeLessThan(1);
      });

      test('should preserve high-frequency content', () => {
        const signal = [1, -1, 1, -1, 1, -1];
        const filtered = rSignalFunctions.HIGH_PASS_FILTER(signal, 0.9);
        
        // High-pass should preserve alternating pattern
        expect(filtered).toHaveLength(6);
        expect(Math.max(...filtered.map(Math.abs))).toBeGreaterThan(0.5);
      });
    });

    describe('BAND_PASS_FILTER', () => {
      test('should combine high-pass and low-pass effects', () => {
        const signal = [1, 2, 3, 4, 5, 4, 3, 2, 1];
        const filtered = rSignalFunctions.BAND_PASS_FILTER(signal, 0.1, 0.4);
        
        expect(filtered).toHaveLength(9);
        expect(typeof filtered[0]).toBe('number');
      });

      test('should handle invalid frequency ranges', () => {
        const signal = [1, 2, 3, 4];
        const filtered = rSignalFunctions.BAND_PASS_FILTER(signal, 0.3, 0.1);
        
        expect(filtered).toHaveLength(4);
      });
    });
  });

  describe('CONVOLVE', () => {
    test('should convolve two signals correctly', () => {
      const signal = [1, 2, 3];
      const kernel = [1, 0, -1];
      const result = rSignalFunctions.CONVOLVE(signal, kernel);
      
      expect(result).toHaveLength(5); // (3 + 3 - 1)
      expect(result[0]).toBe(1); // 1*1
      expect(result[1]).toBe(2); // 1*0 + 2*1
      expect(result[2]).toBe(2); // 1*(-1) + 2*0 + 3*1
    });

    test('should handle single-element kernel', () => {
      const signal = [1, 2, 3];
      const kernel = [2];
      const result = rSignalFunctions.CONVOLVE(signal, kernel);
      
      expect(result).toEqual([2, 4, 6]); // Just scaling
    });

    test('should handle empty inputs', () => {
      const result = rSignalFunctions.CONVOLVE([], [1, 2]);
      expect(result).toEqual([0]);
    });

    test('should be commutative', () => {
      const signal1 = [1, 2, 3];
      const signal2 = [1, -1];
      
      const result1 = rSignalFunctions.CONVOLVE(signal1, signal2);
      const result2 = rSignalFunctions.CONVOLVE(signal2, signal1);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('XCORR', () => {
    test('should compute cross-correlation', () => {
      const signal1 = [1, 2, 3, 4];
      const signal2 = [1, 2, 3, 4];
      const result = rSignalFunctions.XCORR(signal1, signal2);
      
      expect(result).toHaveLength(7); // 2 * max(4, 4) - 1
      
      // Auto-correlation should have max at center
      const maxIndex = result.indexOf(Math.max(...result));
      const centerIndex = Math.floor(result.length / 2);
      expect(maxIndex).toBe(centerIndex);
    });

    test('should detect signal delay', () => {
      const signal1 = [1, 0, 0, 0];
      const signal2 = [0, 0, 1, 0]; // Delayed version
      const result = rSignalFunctions.XCORR(signal1, signal2);
      
      expect(result).toHaveLength(7);
      
      // Maximum should be offset from center
      const maxIndex = result.indexOf(Math.max(...result));
      const centerIndex = Math.floor(result.length / 2);
      expect(maxIndex).not.toBe(centerIndex);
    });

    test('should handle identical signals', () => {
      const signal = [1, 2, 1];
      const result = rSignalFunctions.XCORR(signal, signal);
      
      expect(result).toHaveLength(5);
      expect(Math.max(...result)).toBeGreaterThan(0);
    });
  });

  describe('PSD', () => {
    test('should compute power spectral density', () => {
      const signal = rSignalFunctions.SINE_WAVE(5, 1, 100, 1);
      const psd = rSignalFunctions.PSD(signal, 100);
      
      expect(psd.type).toBe('psd');
      expect(psd.frequencies).toBeDefined();
      expect(psd.power).toBeDefined();
      expect(psd.frequencies).toHaveLength(psd.power.length);
      expect(psd.sampleRate).toBe(100);
      
      // Should show peak at 5 Hz
      const peakIndex = psd.power.indexOf(Math.max(...psd.power));
      const peakFreq = psd.frequencies[peakIndex];
      expect(peakFreq).toBeCloseTo(5, 0);
    });

    test('should handle constant signal', () => {
      const signal = Array(50).fill(1);
      const psd = rSignalFunctions.PSD(signal);
      
      expect(psd.frequencies[0]).toBe(0); // DC frequency
      expect(psd.power[0]).toBeGreaterThan(0); // DC component
    });

    test('should handle empty signal', () => {
      const psd = rSignalFunctions.PSD([]);
      expect(psd.frequencies).toEqual([0]);
      expect(psd.power).toEqual([0]);
    });
  });

  describe('SPECTROGRAM', () => {
    test('should compute spectrogram', () => {
      const signal = rSignalFunctions.SINE_WAVE(10, 2, 128, 1);
      const spec = rSignalFunctions.SPECTROGRAM(signal, 32, 0.5);
      
      expect(spec.type).toBe('spectrogram');
      expect(spec.data).toBeDefined();
      expect(spec.timeSteps).toBeDefined();
      expect(spec.frequencyBins).toBeDefined();
      expect(spec.windowSize).toBe(32);
      
      expect(spec.data.length).toBe(spec.timeSteps.length);
      expect(spec.data[0].length).toBe(spec.frequencyBins.length);
    });

    test('should handle short signals', () => {
      const signal = [1, 2, 3, 4, 5];
      const spec = rSignalFunctions.SPECTROGRAM(signal, 4, 0);
      
      expect(spec.data.length).toBeGreaterThan(0);
      expect(spec.timeSteps.length).toBeGreaterThan(0);
    });

    test('should handle different overlap ratios', () => {
      const signal = Array(100).fill().map((_, i) => Math.sin(2 * Math.PI * i / 10));
      
      const spec1 = rSignalFunctions.SPECTROGRAM(signal, 20, 0);
      const spec2 = rSignalFunctions.SPECTROGRAM(signal, 20, 0.8);
      
      // High overlap should give more time steps
      expect(spec2.timeSteps.length).toBeGreaterThan(spec1.timeSteps.length);
    });
  });

  describe('ENVELOPE', () => {
    test('should detect signal envelope', () => {
      // AM modulated signal
      const carrier = rSignalFunctions.SINE_WAVE(50, 1, 1000, 1);
      const modulator = rSignalFunctions.SINE_WAVE(5, 1, 1000, 0.5);
      const amSignal = carrier.map((c, i) => (1 + modulator[i]) * c);
      
      const envelope = rSignalFunctions.ENVELOPE(amSignal);
      
      expect(envelope).toHaveLength(amSignal.length);
      expect(Math.max(...envelope)).toBeGreaterThan(0);
      expect(Math.min(...envelope)).toBeGreaterThanOrEqual(0);
    });

    test('should handle constant signal', () => {
      const signal = Array(10).fill(5);
      const envelope = rSignalFunctions.ENVELOPE(signal);
      
      envelope.forEach(val => {
        expect(val).toBeCloseTo(5, 1);
      });
    });

    test('should handle alternating signal', () => {
      const signal = [1, -1, 1, -1, 1, -1];
      const envelope = rSignalFunctions.ENVELOPE(signal);
      
      expect(envelope).toHaveLength(6);
      envelope.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('ZERO_CROSSINGS', () => {
    test('should find zero crossings in sine wave', () => {
      const signal = rSignalFunctions.SINE_WAVE(1, 1, 20, 1);
      const crossings = rSignalFunctions.ZERO_CROSSINGS(signal);
      
      expect(crossings.length).toBeGreaterThan(0);
      expect(crossings.length).toBeLessThan(signal.length);
      
      // Should be roughly 1-2 crossings per period (depends on sampling)
      expect(crossings.length).toBeGreaterThanOrEqual(1);
      expect(crossings.length).toBeLessThanOrEqual(4);
    });

    test('should handle constant signal', () => {
      const signal = Array(10).fill(1);
      const crossings = rSignalFunctions.ZERO_CROSSINGS(signal);
      
      expect(crossings).toEqual([]); // No crossings in constant signal
    });

    test('should handle signal crossing zero', () => {
      const signal = [1, 0.5, -0.5, -1, 0.5, 1];
      const crossings = rSignalFunctions.ZERO_CROSSINGS(signal);
      
      expect(crossings.length).toBeGreaterThan(0);
      expect(crossings.every(idx => idx > 0 && idx < signal.length)).toBe(true);
    });

    test('should handle empty signal', () => {
      const crossings = rSignalFunctions.ZERO_CROSSINGS([]);
      expect(crossings).toEqual([]);
    });
  });

  describe('DETREND', () => {
    test('should remove linear trend', () => {
      // Create signal with linear trend
      const trend = Array.from({length: 100}, (_, i) => i * 0.1);
      const noise = rSignalFunctions.WHITE_NOISE(100, 0.1);
      const signal = trend.map((t, i) => t + noise[i]);
      
      const detrended = rSignalFunctions.DETREND(signal);
      
      expect(detrended).toHaveLength(100);
      
      // Mean should be close to zero after detrending
      const mean = detrended.reduce((sum, val) => sum + val, 0) / detrended.length;
      expect(Math.abs(mean)).toBeLessThan(0.1);
    });

    test('should handle constant signal', () => {
      const signal = Array(10).fill(5);
      const detrended = rSignalFunctions.DETREND(signal);
      
      detrended.forEach(val => {
        expect(val).toBeCloseTo(0, 1); // Constant becomes zero after detrending
      });
    });

    test('should handle short signals', () => {
      const detrended = rSignalFunctions.DETREND([1, 2]);
      expect(detrended).toHaveLength(2);
    });

    test('should handle single value', () => {
      const detrended = rSignalFunctions.DETREND([42]);
      expect(detrended).toEqual([42]);
    });
  });

  describe('RESAMPLE', () => {
    test('should resample to different length', () => {
      const signal = [1, 2, 3, 4, 5];
      const resampled = rSignalFunctions.RESAMPLE(signal, 10);
      
      expect(resampled).toHaveLength(10);
      expect(resampled[0]).toBe(1); // Should preserve endpoints
      expect(resampled[9]).toBe(5);
    });

    test('should interpolate correctly', () => {
      const signal = [0, 4];
      const resampled = rSignalFunctions.RESAMPLE(signal, 5);
      
      expect(resampled).toHaveLength(5);
      expect(resampled[0]).toBe(0);
      expect(resampled[4]).toBe(4);
      expect(resampled[2]).toBeCloseTo(2, 1); // Midpoint should be 2
    });

    test('should handle upsampling and downsampling', () => {
      const signal = [1, 2, 3, 4, 5, 6, 7, 8];
      
      const upsampled = rSignalFunctions.RESAMPLE(signal, 16);
      expect(upsampled).toHaveLength(16);
      
      const downsampled = rSignalFunctions.RESAMPLE(signal, 4);
      expect(downsampled).toHaveLength(4);
    });

    test('should handle single value', () => {
      const resampled = rSignalFunctions.RESAMPLE([42], 5);
      expect(resampled).toEqual([42, 42, 42, 42, 42]);
    });

    test('should handle empty signal', () => {
      const resampled = rSignalFunctions.RESAMPLE([], 3);
      expect(resampled).toEqual([0, 0, 0]);
    });
  });

  describe('FIND_PEAKS', () => {
    test('should find peaks in signal', () => {
      const signal = [0, 1, 0, 3, 0, 2, 0];
      const peaks = rSignalFunctions.FIND_PEAKS(signal, 0.5);
      
      expect(peaks).toHaveLength(3);
      expect(peaks[0].index).toBe(1);
      expect(peaks[0].value).toBe(1);
      expect(peaks[1].index).toBe(3);
      expect(peaks[1].value).toBe(3);
      expect(peaks[2].index).toBe(5);
      expect(peaks[2].value).toBe(2);
    });

    test('should respect threshold', () => {
      const signal = [0, 0.5, 0, 2, 0, 1, 0];
      const lowThreshold = rSignalFunctions.FIND_PEAKS(signal, 0.1);
      const highThreshold = rSignalFunctions.FIND_PEAKS(signal, 1.5);
      
      expect(lowThreshold.length).toBeGreaterThan(highThreshold.length);
      expect(highThreshold).toHaveLength(1); // Only peak at value 2
      expect(highThreshold[0].value).toBe(2);
    });

    test('should handle sine wave', () => {
      const signal = rSignalFunctions.SINE_WAVE(1, 2, 40, 1);
      const peaks = rSignalFunctions.FIND_PEAKS(signal, 0.8);
      
      expect(peaks.length).toBeGreaterThan(0);
      expect(peaks.length).toBeLessThanOrEqual(2); // About 2 periods
      
      // All peaks should be near 1 (sine wave amplitude)
      peaks.forEach(peak => {
        expect(peak.value).toBeCloseTo(1, 1);
      });
    });

    test('should handle flat signal', () => {
      const signal = Array(10).fill(1);
      const peaks = rSignalFunctions.FIND_PEAKS(signal);
      
      expect(peaks).toEqual([]); // No peaks in flat signal
    });

    test('should handle short signals', () => {
      const peaks1 = rSignalFunctions.FIND_PEAKS([1, 2]);
      expect(peaks1).toEqual([]);
      
      const peaks2 = rSignalFunctions.FIND_PEAKS([1]);
      expect(peaks2).toEqual([]);
    });
  });

  // Helper function tests
  describe('Helper Functions', () => {
    // Add variance helper function for testing
    rSignalFunctions.variance = (arr) => {
      const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
      return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    };

    test('variance helper should work correctly', () => {
      const constant = [5, 5, 5, 5];
      const varying = [1, 2, 3, 4];
      
      expect(rSignalFunctions.variance(constant)).toBe(0);
      expect(rSignalFunctions.variance(varying)).toBeGreaterThan(0);
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    test('should work together in signal processing pipeline', () => {
      // Generate test signal: sine wave + noise
      const cleanSignal = rSignalFunctions.SINE_WAVE(10, 1, 200, 1);
      const noise = rSignalFunctions.WHITE_NOISE(200, 0.2);
      const noisySignal = cleanSignal.map((s, i) => s + noise[i]);
      
      // Apply window and filter
      const windowed = rSignalFunctions.HANNING(noisySignal);
      const filtered = rSignalFunctions.LOW_PASS_FILTER(windowed, 0.2);
      
      // Analyze spectrum
      const psd = rSignalFunctions.PSD(filtered, 200);
      
      expect(windowed).toHaveLength(noisySignal.length);
      expect(filtered).toHaveLength(noisySignal.length);
      expect(psd.frequencies.length).toBeGreaterThan(10);
      expect(psd.power.length).toBe(psd.frequencies.length);
      
      // Should show peak near 10 Hz
      const maxPowerIndex = psd.power.indexOf(Math.max(...psd.power));
      const peakFreq = psd.frequencies[maxPowerIndex];
      expect(peakFreq).toBeCloseTo(10, 0);
    });

    test('should handle FFT/IFFT round trip with filtering', () => {
      const original = rSignalFunctions.SINE_WAVE(5, 1, 32, 1);
      
      // Forward FFT
      const fft = rSignalFunctions.FFT(original);
      
      // Zero out high frequencies (simple low-pass)
      const filtered = fft.map((f, i) => 
        i > fft.length / 4 ? { real: 0, imag: 0 } : f
      );
      
      // Inverse FFT
      const reconstructed = rSignalFunctions.IFFT(filtered);
      
      expect(reconstructed).toHaveLength(original.length);
      
      // Reconstructed should be smoother than original
      const origVar = rSignalFunctions.variance(original);
      const reconVar = rSignalFunctions.variance(reconstructed);
      expect(reconVar).toBeLessThanOrEqual(origVar);
    });

    test('should handle multi-step signal analysis', () => {
      // Generate chirp signal (frequency sweep)
      const signal = Array.from({length: 100}, (_, i) => {
        const t = i / 100;
        const freq = 1 + 10 * t; // Linear frequency sweep
        return Math.sin(2 * Math.PI * freq * t);
      });
      
      // Detrend, window, and analyze
      const detrended = rSignalFunctions.DETREND(signal);
      const windowed = rSignalFunctions.BLACKMAN(detrended);
      const envelope = rSignalFunctions.ENVELOPE(windowed);
      const peaks = rSignalFunctions.FIND_PEAKS(envelope, 0.1);
      const crossings = rSignalFunctions.ZERO_CROSSINGS(windowed);
      
      expect(detrended).toHaveLength(100);
      expect(windowed).toHaveLength(100);
      expect(envelope).toHaveLength(100);
      expect(peaks.length).toBeGreaterThanOrEqual(0);
      expect(crossings.length).toBeGreaterThan(0);
    });
  });

  // Error handling tests
  describe('Error Handling', () => {
    test('should handle null and undefined inputs gracefully', () => {
      expect(() => rSignalFunctions.FFT(null)).not.toThrow();
      expect(() => rSignalFunctions.SINE_WAVE(null)).not.toThrow();
      expect(() => rSignalFunctions.HANNING(undefined)).not.toThrow();
      expect(() => rSignalFunctions.LOW_PASS_FILTER(null)).not.toThrow();
    });

    test('should handle invalid numeric inputs', () => {
      expect(() => rSignalFunctions.SINE_WAVE('abc')).not.toThrow();
      expect(() => rSignalFunctions.LOW_PASS_FILTER([1, 2, 3], 'invalid')).not.toThrow();
      expect(() => rSignalFunctions.RESAMPLE([1, 2, 3], 'not_a_number')).not.toThrow();
    });

    test('should return sensible defaults for edge cases', () => {
      expect(rSignalFunctions.FFT([])).toEqual([]);
      expect(rSignalFunctions.WHITE_NOISE(0)).toEqual([0]);
      expect(rSignalFunctions.ZERO_CROSSINGS([])).toEqual([]);
      expect(rSignalFunctions.FIND_PEAKS([])).toEqual([]);
    });

    test('should handle mixed data types in arrays', () => {
      const mixed = [1, 'two', 3, null, 5, undefined, 7];
      
      expect(() => rSignalFunctions.FFT(mixed)).not.toThrow();
      expect(() => rSignalFunctions.HANNING(mixed)).not.toThrow();
      expect(() => rSignalFunctions.LOW_PASS_FILTER(mixed)).not.toThrow();
      
      const result = rSignalFunctions.FFT(mixed);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});