# TODO for new function sets

This file lists ideas for new sets of functions inspired by other popular software and libraries.

## Pandas-inspired

A set of functions for data manipulation and analysis, providing DataFrame-like objects. This would be a major addition to the Rexx ecosystem.

-   **DataFrame and Series objects**: The core data structures.
-   **Data input/output**: Reading and writing from/to CSV, Excel, JSON, etc.
-   **Data cleaning**: Handling missing data, duplicates, etc.
-   **Data selection and filtering**: `loc`, `iloc`, boolean indexing.
-   **Data manipulation**: `groupby`, `merge`, `join`, `concat`, `pivot_table`.
-   **Time series analysis**: Date range generation, resampling, etc.

## scikit-learn-inspired

A library for machine learning in Rexx. We can start with the basics.

-   **Preprocessing**: `StandardScaler`, `MinMaxScaler`, `OneHotEncoder`.
-   **Models**:
    -   **Linear Models**: `LinearRegression`, `LogisticRegression`.
    -   **Tree-based models**: `DecisionTreeClassifier`, `RandomForestClassifier`.
    -   **Clustering**: `KMeans`.
    -   **Dimensionality Reduction**: `PCA`.
-   **Model evaluation**: `accuracy_score`, `precision_score`, `recall_score`, `f1_score`, `confusion_matrix`.
-   **Model selection**: `train_test_split`.

## MATLAB-inspired

Functions inspired by MATLAB's core functionality.

-   **Matrix manipulation**: `size`, `length`, `numel`, `find`.
-   **Plotting**: `plot`, `figure`, `subplot`, `xlabel`, `ylabel`, `title`, `legend`.
-   **Signal processing**: `fft`, `ifft`, `filter`, `spectrogram`.
-   **Image processing**: `imread`, `imwrite`, `imshow`.

## TensorFlow/PyTorch-inspired

Basic tensor operations for deep learning.

-   **Tensor creation and manipulation**.
-   **Basic mathematical operations on tensors**.
-   **Automatic differentiation**.

## Statsmodels-inspired

Functions for statistical modeling.

-   **Time series analysis**: `ARIMA`, `VAR`, `seasonal_decompose`.
-   **Regression**: `OLS`, `GLS`, `WLS`.
-   **ANOVA**: `anova_lm`.

## SymPy-inspired

Functions for symbolic mathematics.

-   **Symbolic variables**.
-   **Symbolic expressions**.
-   **Calculus**: `diff`, `integrate`, `limit`.
-   **Solvers**: `solve`.

## NetworkX-inspired

Functions for graph analysis.

-   **Graph creation and manipulation**.
-   **Graph algorithms**: Shortest path, centrality, etc.
-   **Graph visualization**.

## OpenCV-inspired

Functions for computer vision.

-   **Image reading and writing**.
-   **Image filtering and transformations**.
-   **Feature detection**.
-   **Object detection**.
