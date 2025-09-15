# R Graphics Functions

This library provides R-style graphics and visualization functions for RexxJS, enabling creation of statistical plots, charts, and data visualizations with comprehensive customization options.

## Quick Start

```rexx
REQUIRE "r-graphics"
LET x = [1, 2, 3, 4, 5]
LET y = [2, 4, 1, 5, 3]
PLOT(x, y, type="b", main="Simple Line Plot")
HIST(RNORM(100), main="Normal Distribution", col="lightblue")
```

## Installation

```bash
npm install
npm test
```

## Function Categories

### Basic Plotting Functions

#### Core Plot Functions
- **PLOT(x, y, ...)** - Generic plotting function
- **LINES(x, y, ...)** - Add lines to existing plot
- **POINTS(x, y, ...)** - Add points to existing plot
- **ABLINE(a, b, ...)** - Add straight lines
- **CURVE(expr, from, to, ...)** - Plot mathematical expressions

#### Specialized Plot Types
- **HIST(x, ...)** - Histograms
- **BOXPLOT(x, ...)** - Box-and-whisker plots
- **BARPLOT(height, ...)** - Bar charts
- **PIE(x, labels, ...)** - Pie charts
- **DOT_CHART(x, labels, ...)** - Dot plots

#### Statistical Plots
- **SCATTER_PLOT(x, y, ...)** - Scatter plots with enhancements
- **QQ_PLOT(x, distribution, ...)** - Quantile-quantile plots
- **DENSITY_PLOT(x, ...)** - Kernel density plots
- **VIOLIN_PLOT(x, group, ...)** - Violin plots
- **PAIRS(data, ...)** - Scatterplot matrix

### Advanced Visualization

#### Multi-panel Layouts
- **PAR(...)** - Set/query graphics parameters
- **LAYOUT(mat, ...)** - Complex panel layouts  
- **MFROW(nrow, ncol)** - Simple grid layouts
- **SPLIT_SCREEN(figs)** - Split screen into regions

#### 3D Plotting
- **PERSP(x, y, z, ...)** - 3D perspective plots
- **CONTOUR(x, y, z, ...)** - Contour plots
- **FILLED_CONTOUR(x, y, z, ...)** - Filled contour plots
- **IMAGE(x, y, z, ...)** - Image plots/heatmaps

#### Specialized Charts
- **HEATMAP(x, ...)** - Enhanced heatmaps with clustering
- **MOSAIC_PLOT(formula, data, ...)** - Mosaic plots
- **PARALLEL_COORDS(data, ...)** - Parallel coordinate plots
- **STAR_PLOT(data, ...)** - Star/radar charts

### Plot Enhancement

#### Annotations and Labels
- **TITLE(main, sub, xlab, ylab, ...)** - Add titles and labels
- **TEXT(x, y, labels, ...)** - Add text annotations
- **MTEXT(text, side, line, ...)** - Margin text
- **LEGEND(x, y, legend, ...)** - Add legends

#### Axes and Grids
- **AXIS(side, at, labels, ...)** - Custom axes
- **GRID(nx, ny, ...)** - Add reference grids
- **RUG(x, side, ...)** - Add rug plots
- **CLIP(x1, x2, y1, y2)** - Set clipping region

#### Colors and Styling
- **PALETTE(colors)** - Set color palette
- **RAINBOW(n)** - Rainbow color sequence
- **HEAT_COLORS(n)** - Heat color sequence
- **TOPO_COLORS(n)** - Topographic colors
- **COLORS()** - List available colors

### Graphics Devices

#### Device Management
- **DEV_NEW(...)** - Open new graphics device
- **DEV_OFF(which)** - Close graphics device
- **DEV_COPY(...)** - Copy between devices
- **DEV_LIST()** - List active devices

#### Output Formats
- **PNG(filename, width, height, ...)** - PNG output
- **JPEG(filename, width, height, ...)** - JPEG output
- **PDF(file, width, height, ...)** - PDF output
- **SVG(filename, width, height, ...)** - SVG output
- **POSTSCRIPT(file, ...)** - PostScript output

## Usage Examples

### Basic Plotting

```rexx
REQUIRE "r-graphics"

-- Simple scatter plot
LET x = 1:10
LET y = x^2 + RNORM(10, 0, 5)
PLOT(x, y, main="Scatter Plot Example", xlab="X Values", ylab="Y Values",
     pch=19, col="blue")

-- Add trend line
LET model = LM(y ~ x)
ABLINE(model, col="red", lwd=2)

-- Add grid and legend
GRID()
LEGEND("topleft", legend=c("Data", "Trend"), 
       col=c("blue", "red"), pch=c(19, NA), lty=c(NA, 1))
```

### Histogram with Density Overlay

```rexx
REQUIRE "r-graphics"

-- Generate sample data
LET data = RNORM(1000, mean=50, sd=15)

-- Create histogram
HIST(data, freq=FALSE, main="Distribution Analysis", 
     xlab="Values", col="lightgray", border="white")

-- Add density curve
LET density = DENSITY(data)
LINES(density, col="red", lwd=2)

-- Add normal reference
LET xseq = SEQ(MIN(data), MAX(data), length.out=100)
LET normal = DNORM(xseq, mean=MEAN(data), sd=SD(data))
LINES(xseq, normal, col="blue", lwd=2, lty=2)

-- Legend
LEGEND("topright", legend=c("Data Density", "Normal Reference"),
       col=c("red", "blue"), lty=c(1, 2))
```

### Multi-panel Plot Layout

```rexx
REQUIRE "r-graphics"

-- Set up 2x2 layout
PAR(mfrow=c(2, 2))

-- Panel 1: Scatter plot
LET x = RNORM(50)
LET y = x + RNORM(50, 0, 0.5)
PLOT(x, y, main="Scatter Plot", pch=19)
ABLINE(LM(y ~ x), col="red")

-- Panel 2: Histogram
HIST(x, main="X Distribution", col="lightblue")

-- Panel 3: Box plots
LET groups = FACTOR(REP(c("A", "B", "C"), each=20))
LET values = c(RNORM(20, 0), RNORM(20, 1), RNORM(20, -1))
BOXPLOT(values ~ groups, main="Group Comparison")

-- Panel 4: Time series
LET time = 1:50
LET ts_data = CUMSUM(RNORM(50))
PLOT(time, ts_data, type="l", main="Time Series", lwd=2)

-- Reset layout
PAR(mfrow=c(1, 1))
```

### Statistical Visualization

```rexx
REQUIRE "r-graphics"

-- QQ plot for normality assessment
LET sample = RCHISQ(100, df=3)
PAR(mfrow=c(1, 2))

-- QQ plot against normal
QQ_PLOT(sample, distribution="norm", main="Q-Q Plot vs Normal")

-- QQ plot against chi-square
QQ_PLOT(sample, distribution="chisq", df=3, main="Q-Q Plot vs Chi-Square")

PAR(mfrow=c(1, 1))

-- Pairs plot for multivariate data
LET mvdata = DATA_FRAME(
    x1 = RNORM(100),
    x2 = RNORM(100),
    x3 = RNORM(100),
    group = FACTOR(SAMPLE(c("A", "B"), 100, replace=TRUE))
)
PAIRS(mvdata[1:3], col=AS_NUMERIC(mvdata$group), main="Multivariate Data")
```

### Advanced Plotting Techniques

```rexx
REQUIRE "r-graphics"

-- 3D surface plot
LET x = SEQ(-3, 3, length.out=30)
LET y = SEQ(-3, 3, length.out=30)
LET z = OUTER(x, y, FUNCTION(x, y) x^2 + y^2)

PERSP(x, y, z, theta=45, phi=30, expand=0.5, 
      main="3D Surface Plot", col="lightblue")

-- Contour plot with filled regions
FILLED_CONTOUR(x, y, z, color.palette=HEAT_COLORS,
               main="Filled Contour Plot")

-- Add contour lines
CONTOUR(x, y, z, add=TRUE, col="darkred")
```

### Heatmap with Clustering

```rexx
REQUIRE "r-graphics"

-- Generate sample matrix data
LET matrix_data = MATRIX(RNORM(200), nrow=10, ncol=20)
ROWNAMES(matrix_data) = PASTE("Gene", 1:10)
COLNAMES(matrix_data) = PASTE("Sample", 1:20)

-- Create heatmap with clustering
HEATMAP(matrix_data, 
        main="Gene Expression Heatmap",
        col=HEAT_COLORS(50),
        scale="row",
        margins=c(8, 6))

-- Alternative with custom colors
LET custom_colors = c("blue", "white", "red")
HEATMAP(matrix_data, 
        col=COLORRAMPPPALETTE(custom_colors)(50),
        main="Custom Color Heatmap")
```

### Custom Color Schemes

```rexx
REQUIRE "r-graphics"

-- Display color palettes
PAR(mfrow=c(2, 2))

-- Rainbow colors
BARPLOT(REP(1, 10), col=RAINBOW(10), main="Rainbow Palette", 
        names.arg=1:10)

-- Heat colors
BARPLOT(REP(1, 10), col=HEAT_COLORS(10), main="Heat Palette",
        names.arg=1:10)

-- Topographic colors
BARPLOT(REP(1, 10), col=TOPO_COLORS(10), main="Topographic Palette",
        names.arg=1:10)

-- Custom palette
LET custom = c("#FF0000", "#FF4000", "#FF8000", "#FFBF00", "#FFFF00",
               "#BFFF00", "#80FF00", "#40FF00", "#00FF00", "#00FF40")
BARPLOT(REP(1, 10), col=custom, main="Custom Palette",
        names.arg=1:10)

PAR(mfrow=c(1, 1))
```

### Interactive Plot Elements

```rexx
REQUIRE "r-graphics"

-- Plot with click interaction
LET x = RNORM(20)
LET y = RNORM(20)
PLOT(x, y, main="Interactive Plot - Click to Identify Points", 
     pch=19, cex=1.2)

-- Add identification capability
IDENTIFY(x, y, n=3)  -- Allow identification of up to 3 points

-- Brushing plot
PLOT(x, y, main="Brushing Plot", pch=19)
LET selected = BRUSH(x, y)  -- Returns indices of brushed points
IF (LENGTH(selected) > 0) {
    POINTS(x[selected], y[selected], col="red", pch=19, cex=1.5)
}
```

### Publication-Quality Plots

```rexx
REQUIRE "r-graphics"

-- Set publication parameters
PAR(mar=c(5, 5, 4, 2) + 0.1,  -- Margins
    cex.axis=1.2,              -- Axis label size
    cex.lab=1.3,               -- Axis title size
    cex.main=1.4)              -- Main title size

-- Create publication plot
LET x = SEQ(0, 10, 0.1)
LET y1 = SIN(x)
LET y2 = COS(x)

PLOT(x, y1, type="l", lwd=2, col="blue",
     main="Trigonometric Functions",
     xlab="x", ylab="f(x)",
     ylim=c(-1.2, 1.2))

LINES(x, y2, lwd=2, col="red", lty=2)

-- Add grid
GRID(col="gray", lty=3)

-- Professional legend
LEGEND("topright", legend=c("sin(x)", "cos(x)"),
       col=c("blue", "red"), lty=c(1, 2), lwd=2,
       bty="n")  -- No box around legend

-- Reset parameters
PAR(mar=c(5, 4, 4, 2) + 0.1, cex.axis=1, cex.lab=1, cex.main=1)
```

## Saving Graphics

```rexx
REQUIRE "r-graphics"

-- Save to PNG
PNG("myplot.png", width=800, height=600, res=300)
PLOT(1:10, (1:10)^2, main="Sample Plot")
DEV_OFF()

-- Save to PDF (vector format)
PDF("myplot.pdf", width=8, height=6)
PLOT(1:10, (1:10)^2, main="Sample Plot")
DEV_OFF()

-- Multiple plots in one PDF
PDF("multiplots.pdf", width=8, height=10)
PAR(mfrow=c(2, 1))
PLOT(1:10, main="Plot 1")
PLOT((1:10)^2, main="Plot 2")
DEV_OFF()
```

## Error Handling

```rexx
REQUIRE "r-graphics"

-- Handle missing data in plots
LET x = c(1, 2, NA, 4, 5)
LET y = c(2, NA, 6, 8, 10)

-- Remove missing values
LET complete = COMPLETE_CASES(CBIND(x, y))
PLOT(x[complete], y[complete], main="Plot with Missing Data Removed")

-- Safe device operations
LET safeGraphics = FUNCTION(plotFunction) {
    TRY({
        plotFunction()
    }, ERROR = {
        SAY "Graphics error occurred"
        IF (LENGTH(DEV_LIST()) > 1) {
            DEV_OFF()  -- Close problematic device
        }
    })
}

-- Validate plot parameters
LET safePlot = FUNCTION(x, y, ...) {
    IF (LENGTH(x) != LENGTH(y)) {
        SAY "Error: x and y must have same length"
        RETURN NULL
    }
    IF (ALL(IS_NA(x)) || ALL(IS_NA(y))) {
        SAY "Error: All data is missing"
        RETURN NULL
    }
    PLOT(x, y, ...)
}
```

## Performance Tips

- Use appropriate plot types for data size (e.g., hexbin for large datasets)
- Pre-calculate complex expressions before plotting
- Use vectorized graphics operations when possible
- Consider data aggregation for very large datasets
- Cache color palettes for repeated use

## Integration

This library integrates with:
- RexxJS core interpreter
- R math-stats functions for statistical computations
- R data-manipulation for data preparation
- Standard REXX variable and array systems
- REXX error handling and control flow
- Web browsers for interactive graphics
- Various graphics devices and formats

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Basic plotting functions
- Statistical plots and visualizations
- Multi-panel layouts
- Color schemes and palettes
- Graphics devices and output formats
- 3D plotting capabilities
- Error conditions and edge cases
- Integration with REXX interpreter

Part of the RexxJS extras collection.