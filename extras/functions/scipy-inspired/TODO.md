# TODO for SciPy-inspired functions

This file lists functions and modules from the SciPy library that could be implemented in the `scipy-inspired` directory. The `interpolation` module is already well-covered.

## `scipy.stats`: Statistical functions

-   **Continuous distributions:**
    -   `norm`: Normal distribution (implemented: pdf, cdf, ppf)
    -   `uniform`: Uniform distribution
    -   `t`: Student's t-distribution
    -   `chi2`: Chi-squared distribution
    -   `f`: F-distribution
    -   `gamma`: Gamma distribution
    -   `beta`: Beta distribution
-   **Discrete distributions:**
    -   `binom`: Binomial distribution
    -   `poisson`: Poisson distribution
-   **Statistical tests:**
    -   `ttest_ind`: t-test for independent samples
    -   `ttest_rel`: t-test for related samples
    -   `kstest`: Kolmogorov-Smirnov test
    -   `shapiro`: Shapiro-Wilk test for normality
    -   `pearsonr`: Pearson correlation coefficient
    -   `spearmanr`: Spearman rank-order correlation
-   **Descriptive statistics:**
    -   `describe`: Descriptive statistics (implemented)
    -   `gmean`: Geometric mean
    -   `hmean`: Harmonic mean
    -   `sem`: Standard error of the mean
    -   `mode`: Modal value
    -   `skew`: Skewness of a distribution
    -   `kurtosis`: Kurtosis of a distribution

## `scipy.signal`: Signal processing

-   **Convolution:**
    -   `convolve`: Convolution of two N-dimensional arrays
    -   `correlate`: Cross-correlation of two N-dimensional arrays
-   **Filtering:**
    -   `lfilter`: Filter data along one-dimension with an IIR or FIR filter.
    -   `filtfilt`: Apply a digital filter forward and backward to a signal.
    -   `butter`: Butterworth digital and analog filter design.
    -   `cheby1`, `cheby2`: Chebyshev digital and analog filter design.
    -   `ellip`: Elliptic (Cauer) digital and analog filter design.
    -   `medfilt`: Median filter
-   **Spectral analysis:**
    -   `periodogram`: Estimate power spectral density using a periodogram.
    -   `welch`: Estimate power spectral density using Welch's method.
    -   `spectrogram`: Compute a spectrogram with consecutive Fourier transforms.
-   **Waveforms:**
    -   `chirp`: Frequency-swept cosine generator.
    -   `gausspulse`: Gaussian modulated sinusoidal pulse.
    -   `sawtooth`: Sawtooth waveform.
    -   `square`: Square wave.

## `scipy.linalg`: Linear algebra

-   **Basic routines:**
    -   `inv`: Inverse of a matrix
    -   `det`: Determinant of a matrix
    -   `norm`: Matrix or vector norm
    -   `solve`: Solve a system of linear equations
-   **Decompositions:**
    -   `lu`: LU decomposition
    -   `qr`: QR decomposition
    -   `svd`: Singular Value Decomposition
    -   `eig`: Eigenvalue decomposition
    -   `cholesky`: Cholesky decomposition
-   **Matrix functions:**
    -   `expm`: Matrix exponential
    -   `logm`: Matrix logarithm
    -   `sqrtm`: Matrix square root

## `scipy.optimize`: Optimization

-   **Minimization:**
    -   `minimize`: Minimization of scalar function of one or more variables.
    -   `minimize_scalar`: Minimization of scalar function of one variable.
-   **Curve fitting:**
    -   `curve_fit`: Use non-linear least squares to fit a function to data.
-   **Root finding:**
    -   `fsolve`: Find the roots of a function.
    -   `brentq`: Find a root of a function in a bracketing interval.
    -   `newton`: Newton-Raphson method for root finding.

## `scipy.fft`: Fast Fourier Transforms

-   `fft`, `ifft`: 1-D discrete Fourier Transform
-   `fft2`, `ifft2`: 2-D discrete Fourier Transform
-   `fftn`, `ifftn`: N-D discrete Fourier Transform
-   `dct`, `idct`: Discrete Cosine Transform
-   `dst`, `idst`: Discrete Sine Transform

## `scipy.io`: Input and Output

-   `loadmat`, `savemat`: Read and write MATLAB files.
-   `wavfile.read`, `wavfile.write`: Read and write WAV files.

## `scipy.sparse`: Sparse matrices

-   **Sparse matrix classes:**
    -   `csc_matrix`, `csr_matrix`, `coo_matrix`, `lil_matrix`, `dok_matrix`
-   **Functions:**
    -   `eye`: Sparse matrix with ones on the diagonal
    -   `rand`: Random sparse matrix
    -   `linalg.spsolve`: Solve a sparse linear system

## `scipy.spatial`: Spatial data structures and algorithms

-   `distance.pdist`, `distance.cdist`: Pairwise distances between observations
-   `distance.squareform`: Convert a vector-form distance vector to a square-form distance matrix
-   `KDTree`: k-d tree for nearest neighbor searches
-   `ConvexHull`: Convex hull of a set of points
-   `Delaunay`: Delaunay triangulation in N dimensions
-   `Voronoi`: Voronoi diagrams in N dimensions
