# R Signal Processing Functions

This library provides R-style signal processing and time series functions for RexxJS, including digital signal processing, Fourier transforms, filtering, spectral analysis, and comprehensive time series modeling capabilities.

## Quick Start

```rexx
REQUIRE "r-signal-processing"
LET signal = SIN(2*PI*5*(1:100)/100) + 0.1*RNORM(100)
LET filtered = LOWPASS_FILTER(signal, cutoff=0.1)
LET spectrum = FFT(signal)
PLOT_SPECTRUM(spectrum, main="Signal Spectrum")
```

## Installation

```bash
npm install
npm test
```

## Function Categories

### Digital Signal Processing

#### Signal Generation
- **SIGNAL_GENERATOR(type, freq, duration, fs)** - Generate test signals
- **CHIRP(t, f0, t1, f1)** - Generate frequency-swept signals
- **WHITE_NOISE(n, sigma)** - Generate white noise
- **PINK_NOISE(n)** - Generate pink noise
- **SINE_WAVE(freq, duration, fs, phase)** - Generate sine waves

#### Fourier Transforms
- **FFT(x)** - Fast Fourier Transform
- **IFFT(X)** - Inverse FFT
- **RFFT(x)** - Real FFT (for real-valued signals)
- **IRFFT(X)** - Inverse real FFT
- **FFTFREQ(n, d)** - FFT frequency bins
- **FFTSHIFT(X)** - Shift zero frequency to center

#### Spectral Analysis
- **PERIODOGRAM(x, window)** - Power spectral density
- **WELCH(x, nperseg, noverlap)** - Welch's method for PSD
- **SPECTROGRAM(x, nperseg, noverlap)** - Time-frequency analysis
- **COHERENCE(x, y, nperseg)** - Coherence between signals
- **CROSS_SPECTRAL_DENSITY(x, y)** - Cross-spectral density

#### Filtering
- **LOWPASS_FILTER(x, cutoff, order)** - Low-pass filter
- **HIGHPASS_FILTER(x, cutoff, order)** - High-pass filter
- **BANDPASS_FILTER(x, low, high, order)** - Band-pass filter
- **BANDSTOP_FILTER(x, low, high, order)** - Band-stop filter
- **BUTTERWORTH(N, Wn, type)** - Butterworth filter design
- **CHEBYSHEV(N, rp, Wn, type)** - Chebyshev filter design

#### Windowing Functions
- **HANNING(M)** - Hanning window
- **HAMMING(M)** - Hamming window
- **BLACKMAN(M)** - Blackman window
- **KAISER(M, beta)** - Kaiser window
- **TUKEY(M, alpha)** - Tukey window

### Time Series Analysis

#### Time Series Creation
- **TS(data, start, end, frequency)** - Create time series object
- **AS_TS(x, ...)** - Convert to time series
- **IS_TS(x)** - Test if time series object
- **WINDOW(x, start, end)** - Extract time series window
- **TIME(x)** - Extract time index

#### Basic Time Series Operations
- **LAG(x, k)** - Lag time series
- **DIFF(x, lag, differences)** - Difference time series
- **DECOMPOSE(x, type)** - Classical decomposition
- **STL(x, s.window, t.window)** - STL decomposition
- **DETREND(x, method)** - Remove trend component

#### ARIMA Modeling
- **ARIMA(x, order, seasonal)** - ARIMA model fitting
- **AUTO_ARIMA(x)** - Automatic ARIMA model selection
- **ARIMA_FORECAST(model, h)** - ARIMA forecasting
- **ACF(x, lag.max, type)** - Autocorrelation function
- **PACF(x, lag.max)** - Partial autocorrelation function

#### Seasonal Analysis
- **SEASONAL_DECOMPOSE(x, model, freq)** - Seasonal decomposition
- **SEASONAL_NAIVE(x, m)** - Seasonal naive forecast
- **HW(x, alpha, beta, gamma)** - Holt-Winters smoothing
- **ETS(x, model)** - Exponential smoothing state space

#### Time Series Tests
- **ADF_TEST(x)** - Augmented Dickey-Fuller test
- **KPSS_TEST(x)** - KPSS stationarity test
- **BOX_TEST(x, lag, type)** - Box-Pierce and Ljung-Box tests
- **JARQUE_BERA_TEST(x)** - Jarque-Bera normality test

### Advanced Signal Processing

#### Wavelet Analysis
- **CWT(x, scales, wavelet)** - Continuous wavelet transform
- **DWT(x, wavelet, levels)** - Discrete wavelet transform
- **IDWT(coeffs, wavelet)** - Inverse DWT
- **WAVELET_DENOISE(x, threshold)** - Wavelet denoising

#### Adaptive Filtering
- **LMS_FILTER(x, d, mu, order)** - Least mean squares filter
- **NLMS_FILTER(x, d, mu, order)** - Normalized LMS filter
- **RLS_FILTER(x, d, lambda, order)** - Recursive least squares

#### Signal Enhancement
- **WIENER_FILTER(x, noise_est)** - Wiener filtering
- **KALMAN_FILTER(x, A, C, Q, R)** - Kalman filtering
- **MEDIAN_FILTER(x, window_size)** - Median filtering
- **SAVGOL_FILTER(x, window_length, polyorder)** - Savitzky-Golay filter

## Usage Examples

### Basic Signal Processing

```rexx
REQUIRE "r-signal-processing"

-- Generate test signal
LET fs = 1000  -- Sampling frequency
LET t = SEQ(0, 1, by=1/fs)  -- Time vector
LET f1 = 50   -- Signal frequency
LET f2 = 120  -- Noise frequency

LET signal = SIN(2*PI*f1*t) + 0.3*SIN(2*PI*f2*t) + 0.1*RNORM(LENGTH(t))

-- Apply low-pass filter
LET filtered = LOWPASS_FILTER(signal, cutoff=0.1, order=4)

-- Compare original and filtered
PAR(mfrow=c(2, 1))
PLOT(t[1:200], signal[1:200], type="l", main="Original Signal", xlab="Time", ylab="Amplitude")
PLOT(t[1:200], filtered[1:200], type="l", main="Filtered Signal", xlab="Time", ylab="Amplitude", col="red")
```

### Frequency Domain Analysis

```rexx
REQUIRE "r-signal-processing"

-- Create signal with multiple frequencies
LET fs = 500
LET t = SEQ(0, 2, by=1/fs)
LET signal = SIN(2*PI*10*t) + 0.5*SIN(2*PI*25*t) + 0.3*SIN(2*PI*50*t)

-- Compute FFT
LET X = FFT(signal)
LET freqs = FFTFREQ(LENGTH(signal), 1/fs)
LET magnitude = ABS(X)[1:(LENGTH(X)/2)]
LET freqs_pos = freqs[1:(LENGTH(freqs)/2)]

-- Plot spectrum
PLOT(freqs_pos, magnitude, type="l", main="Frequency Spectrum", 
     xlab="Frequency (Hz)", ylab="Magnitude", xlim=c(0, 100))

-- Find peaks
LET peaks = FIND_PEAKS(magnitude, height=MAX(magnitude)*0.1)
SAY "Peak frequencies:" freqs_pos[peaks]
```

### Spectral Analysis with Welch Method

```rexx
REQUIRE "r-signal-processing"

-- Generate longer signal for better frequency resolution
LET fs = 1000
LET t = SEQ(0, 10, by=1/fs)
LET signal = SIN(2*PI*30*t) + 0.5*SIN(2*PI*80*t) + WHITE_NOISE(LENGTH(t), 0.2)

-- Compute PSD using Welch's method
LET psd_result = WELCH(signal, nperseg=256, noverlap=128)
LET freqs = psd_result$freqs * fs
LET psd = psd_result$psd

-- Plot PSD
PLOT(freqs, 10*LOG10(psd), type="l", main="Power Spectral Density", 
     xlab="Frequency (Hz)", ylab="PSD (dB)", xlim=c(0, 200))
GRID()

-- Compare with periodogram
LET psd_periodogram = PERIODOGRAM(signal, window="hanning")
LINES(psd_periodogram$freq * fs, 10*LOG10(psd_periodogram$spec), col="red")
LEGEND("topright", legend=c("Welch", "Periodogram"), col=c("black", "red"), lty=1)
```

### Time-Frequency Analysis

```rexx
REQUIRE "r-signal-processing"

-- Create chirp signal (frequency sweep)
LET fs = 1000
LET t = SEQ(0, 3, by=1/fs)
LET signal = CHIRP(t, f0=10, t1=3, f1=100)

-- Compute spectrogram
LET spec_result = SPECTROGRAM(signal, nperseg=128, noverlap=64)
LET times = spec_result$times
LET freqs = spec_result$freqs * fs
LET Sxx = spec_result$Sxx

-- Plot spectrogram
IMAGE(times, freqs, 10*LOG10(Sxx), main="Spectrogram", 
      xlab="Time (s)", ylab="Frequency (Hz)", 
      col=HEAT_COLORS(50))
```

### Time Series Decomposition

```rexx
REQUIRE "r-signal-processing"

-- Create time series with trend and seasonal components
LET n = 120  -- 10 years of monthly data
LET time = 1:n
LET trend = 0.5 * time + 10
LET seasonal = 3 * SIN(2*PI*time/12) + 1.5 * COS(2*PI*time/12)
LET noise = RNORM(n, 0, 1)
LET ts_data = trend + seasonal + noise

-- Create time series object
LET ts = TS(ts_data, start=c(2014, 1), frequency=12)

-- Classical decomposition
LET decomp = DECOMPOSE(ts, type="additive")

-- Plot decomposition
PAR(mfrow=c(4, 1), mar=c(3, 4, 2, 1))
PLOT(decomp$x, main="Original Time Series", ylab="Value")
PLOT(decomp$trend, main="Trend", ylab="Trend")
PLOT(decomp$seasonal, main="Seasonal", ylab="Seasonal")
PLOT(decomp$random, main="Random", ylab="Random")
PAR(mfrow=c(1, 1))
```

### ARIMA Modeling and Forecasting

```rexx
REQUIRE "r-signal-processing"

-- Load or create time series data
LET data = CUMSUM(RNORM(200)) + 0.1*(1:200)  -- Random walk with drift
LET ts = TS(data, frequency=1)

-- Check stationarity
LET adf_result = ADF_TEST(ts)
SAY "ADF test p-value:" adf_result$p.value

-- If non-stationary, difference the series
IF (adf_result$p.value > 0.05) {
    LET ts_diff = DIFF(ts)
    LET adf_diff = ADF_TEST(ts_diff)
    SAY "After differencing, ADF p-value:" adf_diff$p.value
}

-- Plot ACF and PACF for model identification
PAR(mfrow=c(2, 1))
ACF(ts_diff, main="Autocorrelation Function")
PACF(ts_diff, main="Partial Autocorrelation Function")

-- Fit ARIMA model
LET arima_model = ARIMA(ts, order=c(1, 1, 1))
SUMMARY(arima_model)

-- Forecast
LET forecast = ARIMA_FORECAST(arima_model, h=20)
PLOT(forecast, main="ARIMA Forecast")
```

### Digital Filter Design

```rexx
REQUIRE "r-signal-processing"

-- Design Butterworth filters
LET fs = 1000
LET nyquist = fs / 2

-- Low-pass filter
LET lp_filter = BUTTERWORTH(N=4, Wn=100/nyquist, type="low")

-- Band-pass filter  
LET bp_filter = BUTTERWORTH(N=4, Wn=c(50, 200)/nyquist, type="bandpass")

-- Plot frequency responses
LET w = SEQ(0, PI, length.out=512)
LET h_lp = FREQZ(lp_filter, w)
LET h_bp = FREQZ(bp_filter, w)

PAR(mfrow=c(2, 1))
PLOT(w*fs/(2*PI), 20*LOG10(ABS(h_lp)), type="l", 
     main="Low-pass Filter Response", xlab="Frequency (Hz)", ylab="Magnitude (dB)")
PLOT(w*fs/(2*PI), 20*LOG10(ABS(h_bp)), type="l",
     main="Band-pass Filter Response", xlab="Frequency (Hz)", ylab="Magnitude (dB)")
```

### Wavelet Analysis

```rexx
REQUIRE "r-signal-processing"

-- Create test signal with transient
LET fs = 1000
LET t = SEQ(0, 2, by=1/fs)
LET signal = SIN(2*PI*10*t)  -- Base frequency
LET transient = ifelse(t > 0.5 & t < 1.0, SIN(2*PI*50*t), 0)  -- High freq transient
LET combined = signal + transient + 0.1*RNORM(LENGTH(t))

-- Continuous wavelet transform
LET scales = 2^SEQ(1, 8, by=0.1)  -- Log-spaced scales
LET cwt_result = CWT(combined, scales, wavelet="morlet")

-- Plot time-frequency representation
LET freqs = 1 / scales  -- Convert scales to frequencies (approximate)
IMAGE(t, freqs, ABS(cwt_result), main="Continuous Wavelet Transform",
      xlab="Time (s)", ylab="Frequency (Hz)", col=JET_COLORS(50))
```

### Kalman Filtering

```rexx
REQUIRE "r-signal-processing"

-- State space model for position tracking
LET dt = 0.1  -- Time step
LET A = MATRIX(c(1, dt, 0, 1), nrow=2, ncol=2)  -- State transition
LET C = MATRIX(c(1, 0), nrow=1, ncol=2)  -- Observation matrix
LET Q = MATRIX(c(0.01, 0, 0, 0.01), nrow=2, ncol=2)  -- Process noise
LET R = MATRIX(0.1)  -- Observation noise

-- Generate synthetic data
LET n = 100
LET true_pos = CUMSUM(RNORM(n, 0, 0.1))
LET observations = true_pos + RNORM(n, 0, sqrt(0.1))

-- Apply Kalman filter
LET kf_result = KALMAN_FILTER(observations, A, C, Q, R)
LET estimated_pos = kf_result$states[, 1]

-- Plot results
PLOT(1:n, true_pos, type="l", main="Kalman Filter Tracking", 
     ylab="Position", xlab="Time", col="black", lwd=2)
LINES(1:n, observations, col="red", pch=1, type="p")
LINES(1:n, estimated_pos, col="blue", lwd=2)
LEGEND("topright", legend=c("True", "Observed", "Kalman Est."),
       col=c("black", "red", "blue"), lty=c(1, NA, 1), pch=c(NA, 1, NA))
```

### Cross-Correlation and Coherence

```rexx
REQUIRE "r-signal-processing"

-- Generate two related signals
LET fs = 500
LET t = SEQ(0, 4, by=1/fs)
LET f1 = 10
LET f2 = 25

LET signal1 = SIN(2*PI*f1*t) + 0.5*SIN(2*PI*f2*t) + 0.2*RNORM(LENGTH(t))
LET signal2 = 0.8*signal1 + 0.3*RNORM(LENGTH(t))  -- Correlated with signal1

-- Cross-correlation
LET xcorr_result = XCORR(signal1, signal2, maxlags=100)
LET max_corr_idx = WHICH_MAX(ABS(xcorr_result$correlation))
LET lag_at_max = xcorr_result$lags[max_corr_idx]
SAY "Maximum correlation at lag:" lag_at_max

-- Coherence analysis
LET coh_result = COHERENCE(signal1, signal2, nperseg=128)
LET freqs = coh_result$freqs * fs
LET coherence = coh_result$coherence

PLOT(freqs, coherence, type="l", main="Coherence Analysis",
     xlab="Frequency (Hz)", ylab="Coherence", ylim=c(0, 1))
GRID()
```

## Advanced Applications

### Adaptive Noise Cancellation

```rexx
REQUIRE "r-signal-processing"

-- Simulate adaptive noise cancellation scenario
LET fs = 1000
LET n = 2000
LET t = (0:(n-1)) / fs

-- Desired signal (speech-like)
LET desired = SIN(2*PI*100*t) * (1 + 0.5*SIN(2*PI*5*t))

-- Noise source
LET noise_source = SIN(2*PI*200*t) + 0.5*SIN(2*PI*300*t)

-- Observed signal (desired + noise)
LET observed = desired + 0.8*noise_source + 0.1*RNORM(n)

-- Reference signal (correlated with noise)
LET reference = noise_source + 0.2*RNORM(n)

-- Apply LMS adaptive filter
LET lms_result = LMS_FILTER(reference, observed, mu=0.01, order=10)
LET cleaned_signal = observed - lms_result$output

-- Plot results
PAR(mfrow=c(3, 1))
PLOT(t[1:500], desired[1:500], type="l", main="Original Desired Signal", ylab="Amplitude")
PLOT(t[1:500], observed[1:500], type="l", main="Noisy Observed Signal", ylab="Amplitude", col="red")
PLOT(t[1:500], cleaned_signal[1:500], type="l", main="Cleaned Signal", ylab="Amplitude", col="blue")
```

## Error Handling

```rexx
REQUIRE "r-signal-processing"

-- Handle FFT size requirements
LET safeFft = FUNCTION(x) {
    IF (LENGTH(x) < 2) {
        SAY "Warning: Signal too short for FFT"
        RETURN NA
    }
    # Pad to next power of 2 for efficiency
    LET nextPow2 = 2^CEILING(LOG2(LENGTH(x)))
    LET padded = c(x, REP(0, nextPow2 - LENGTH(x)))
    RETURN FFT(padded)[1:LENGTH(x)]
}

-- Validate time series parameters
LET validateTs = FUNCTION(data, frequency) {
    IF (!IS_NUMERIC(data)) {
        SAY "Error: Time series data must be numeric"
        RETURN NULL
    }
    IF (frequency <= 0) {
        SAY "Error: Frequency must be positive"
        RETURN NULL
    }
    RETURN TS(data, frequency=frequency)
}

-- Safe filter application
LET safeFilter = FUNCTION(x, filter_func, ...) {
    TRY({
        filter_func(x, ...)
    }, ERROR = {
        SAY "Filter application failed, returning original signal"
        RETURN x
    })
}
```

## Performance Tips

- Use appropriate FFT sizes (powers of 2) for best performance
- Consider overlap-add/overlap-save methods for long signals
- Pre-allocate arrays for iterative algorithms
- Use windowing to reduce spectral leakage
- Apply appropriate anti-aliasing filters before downsampling

## Integration

This library integrates with:
- RexxJS core interpreter
- R math-stats functions for statistical analysis
- R graphics functions for signal visualization
- Standard REXX variable and array systems
- REXX error handling and control flow
- Real-time data processing systems

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Digital signal processing functions
- Fourier transform implementations
- Filter design and application  
- Time series analysis and modeling
- Spectral analysis methods
- Wavelet transforms
- Adaptive filtering algorithms
- Error conditions and edge cases
- Integration with REXX interpreter

Part of the RexxJS extras collection.