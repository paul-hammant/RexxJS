const { test, expect } = require('@playwright/test');

test.describe('SciPy Interpolation Functions - Playwright Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8082/tests/web/test-harness-sp-interpolation.html');
        
        // Wait for the page to load and the log to be ready
        await page.waitForSelector('#testLog');
        await page.waitForFunction(() => window.spInterpolationFunctions !== undefined);
    });

    test('should load test harness successfully', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('SciPy Interpolation Functions Test Harness');
        
        // Check that all main sections are present
        await expect(page.locator('h3')).toContainText(['Setup JavaScript Execution', 'SP_INTERP1D', 'SP_PCHIP', 'SP_RBF', 'SP_SPLREP']);
        
        // Check that canvas is present
        await expect(page.locator('#plotCanvas')).toBeVisible();
    });

    test('should execute setup code successfully', async ({ page }) => {
        await page.fill('#setupCode', 'const testVar = 42; console.log("Setup executed");');
        await page.click('button:text("Execute Setup")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Setup code executed successfully/);
    });

    test('should test SP_INTERP1D with default values', async ({ page }) => {
        await page.click('button:text("Test SP_INTERP1D")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_INTERP1D with method: cubic/);
        expect(logContent).toMatch(/✅ Interpolator created successfully/);
        expect(logContent).toMatch(/Interpolated values:/);
    });

    test('should test SP_INTERP1D with different methods', async ({ page }) => {
        // Test linear interpolation
        await page.selectOption('#interpMethod', 'linear');
        await page.click('button:text("Test SP_INTERP1D")');
        
        let logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_INTERP1D with method: linear/);
        
        // Clear log and test nearest neighbor
        await page.click('button:text("Clear Log")');
        await page.selectOption('#interpMethod', 'nearest');
        await page.click('button:text("Test SP_INTERP1D")');
        
        logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_INTERP1D with method: nearest/);
        expect(logContent).toMatch(/✅ Interpolator created successfully/);
    });

    test('should test SP_PCHIP with default values', async ({ page }) => {
        await page.click('button:text("Test SP_PCHIP")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_PCHIP/);
        expect(logContent).toMatch(/✅ PCHIP interpolator created successfully/);
        expect(logContent).toMatch(/PCHIP interpolated values:/);
    });

    test('should test SP_RBF with different functions', async ({ page }) => {
        // Test multiquadric (default)
        await page.click('button:text("Test SP_RBF")');
        
        let logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_RBF with function: multiquadric/);
        expect(logContent).toMatch(/✅ RBF interpolator created successfully/);
        
        // Clear log and test gaussian
        await page.click('button:text("Clear Log")');
        await page.selectOption('#rbfFunction', 'gaussian');
        await page.click('button:text("Test SP_RBF")');
        
        logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_RBF with function: gaussian/);
        expect(logContent).toMatch(/✅ RBF interpolator created successfully/);
    });

    test('should test B-Splines with different degrees', async ({ page }) => {
        // Test cubic (default)
        await page.click('button:text("Test B-Splines")');
        
        let logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_SPLREP\/SP_SPLEV with degree: 3/);
        expect(logContent).toMatch(/✅ B-spline representation created successfully/);
        
        // Clear log and test linear
        await page.click('button:text("Clear Log")');
        await page.selectOption('#splineDegree', '1');
        await page.click('button:text("Test B-Splines")');
        
        logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_SPLREP\/SP_SPLEV with degree: 1/);
        expect(logContent).toMatch(/✅ B-spline representation created successfully/);
    });

    test('should visualize SP_INTERP1D interpolation', async ({ page }) => {
        await page.click('button:text("Visualize Interpolation")');
        
        // Check that visualization was updated
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Visualization updated/);
        
        // Check that canvas has been drawn to (canvas should have non-zero image data)
        const hasDrawing = await page.evaluate(() => {
            const canvas = document.getElementById('plotCanvas');
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return imageData.data.some(pixel => pixel !== 255); // Check if any non-white pixels
        });
        
        expect(hasDrawing).toBe(true);
    });

    test('should visualize SP_PCHIP interpolation', async ({ page }) => {
        await page.click('button:text("Visualize PCHIP")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ PCHIP visualization updated/);
    });

    test('should visualize SP_RBF interpolation', async ({ page }) => {
        await page.click('button:text("Visualize RBF")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ RBF visualization updated/);
    });

    test('should visualize B-Spline interpolation', async ({ page }) => {
        await page.click('button:text("Visualize B-Splines")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ B-spline visualization updated/);
    });

    test('should run all tests successfully', async ({ page }) => {
        await page.click('button:text("Run All Tests")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/=== Running All SciPy Interpolation Tests ===/);
        expect(logContent).toMatch(/Testing SP_INTERP1D/);
        expect(logContent).toMatch(/Testing SP_PCHIP/);
        expect(logContent).toMatch(/Testing SP_RBF/);
        expect(logContent).toMatch(/Testing SP_SPLREP\/SP_SPLEV/);
        expect(logContent).toMatch(/=== All Tests Completed ===/);
        
        // Should have multiple success messages (at least 4)
        const successCount = (logContent.match(/✅/g) || []).length;
        expect(successCount).toBeGreaterThanOrEqual(4);
    });

    test('should handle custom input data', async ({ page }) => {
        // Test with custom data
        await page.fill('#interpX', '[0,2,4,6,8]');
        await page.fill('#interpY', '[1,3,2,4,3]');
        await page.fill('#interpEval', '[1,3,5,7]');
        
        await page.click('button:text("Test SP_INTERP1D")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Input X: \[0, 2, 4, 6, 8\]/);
        expect(logContent).toMatch(/Input Y: \[1, 3, 2, 4, 3\]/);
        expect(logContent).toMatch(/✅ Interpolator created successfully/);
        expect(logContent).toMatch(/Interpolated values:/);
    });

    test('should handle array format input parsing', async ({ page }) => {
        // Test JSON array format
        await page.fill('#interpX', '[1, 2, 3, 4]');
        await page.fill('#interpY', '[2, 4, 6, 8]');
        
        await page.click('button:text("Test SP_INTERP1D")');
        
        let logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Interpolator created successfully/);
        
        // Clear and test comma-separated format
        await page.click('button:text("Clear Log")');
        await page.fill('#interpX', '1, 2, 3, 4');
        await page.fill('#interpY', '2, 4, 6, 8');
        
        await page.click('button:text("Test SP_INTERP1D")');
        
        logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Interpolator created successfully/);
    });

    test('should handle errors gracefully', async ({ page }) => {
        // Test with invalid data (empty arrays)
        await page.fill('#interpX', '[]');
        await page.fill('#interpY', '[]');
        
        await page.click('button:text("Test SP_INTERP1D")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/❌ Error creating interpolator/);
    });

    test('should clear log functionality', async ({ page }) => {
        // Add some content to log
        await page.click('button:text("Test SP_INTERP1D")');
        
        let logContent = await page.textContent('#testLog');
        expect(logContent.length).toBeGreaterThan(0);
        
        // Clear log
        await page.click('button:text("Clear Log")');
        
        logContent = await page.textContent('#testLog');
        expect(logContent.trim()).toBe('');
    });

    test('should have proper UI controls and labels', async ({ page }) => {
        // Check that all input controls are present and properly labeled (use first() for multiple matches)
        await expect(page.locator('label:text("X Data:")').first()).toBeVisible();
        await expect(page.locator('label:text("Y Data:")').first()).toBeVisible();
        await expect(page.locator('label:text("Method:")').first()).toBeVisible();
        await expect(page.locator('label:text("Eval Points:")').first()).toBeVisible();
        await expect(page.locator('label:text("Function:")').first()).toBeVisible();
        await expect(page.locator('label:text("Degree:")').first()).toBeVisible();
        
        // Check dropdown options
        const methodOptions = await page.locator('#interpMethod option').allTextContents();
        expect(methodOptions).toEqual(['Linear', 'Cubic', 'Nearest', 'Quadratic']);
        
        const rbfOptions = await page.locator('#rbfFunction option').allTextContents();
        expect(rbfOptions).toEqual(['Multiquadric', 'Gaussian', 'Linear', 'Cubic', 'Thin Plate']);
    });

    test('should support PCHIP with custom data showing shape preservation', async ({ page }) => {
        // Use data that would show oscillations with regular splines but should be smooth with PCHIP
        await page.fill('#pchipX', '[0,1,2,3,4,5]');
        await page.fill('#pchipY', '[0,1,0,1,0,1]'); // Oscillating data
        
        await page.click('button:text("Test SP_PCHIP")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Input X: \[0, 1, 2, 3, 4, 5\]/);
        expect(logContent).toMatch(/Input Y: \[0, 1, 0, 1, 0, 1\]/);
        expect(logContent).toMatch(/✅ PCHIP interpolator created successfully/);
        expect(logContent).toMatch(/PCHIP interpolated values:/);
    });

    test('should test RBF with 2D capability hint', async ({ page }) => {
        // While the UI focuses on 1D, verify that the RBF system acknowledges 2D capability
        await page.fill('#rbfX', '[0,1,2]');
        await page.fill('#rbfY', '[0,1,4]');
        await page.selectOption('#rbfFunction', 'thin_plate');
        
        await page.click('button:text("Test SP_RBF")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_RBF with function: thin_plate/);
        expect(logContent).toMatch(/✅ RBF interpolator created successfully/);
    });

    test('should test SP_GRIDDATA with scattered data', async ({ page }) => {
        await page.fill('#griddataPoints', '[[0,0],[1,0],[0,1],[1,1]]');
        await page.fill('#griddataValues', '[1,2,3,4]');
        await page.selectOption('#griddataMethod', 'linear');
        await page.fill('#griddataQuery', '[[0.5,0.5],[0.25,0.75]]');
        
        await page.click('button:text("Test SP_GRIDDATA")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_GRIDDATA with method: linear/);
        expect(logContent).toMatch(/✅ SP_GRIDDATA interpolator created successfully/);
        expect(logContent).toMatch(/Results:/);
    });

    test('should test SP_AKIMA1D shape-preserving interpolation', async ({ page }) => {
        await page.fill('#akimaX', '[0,1,2,3,4,5]');
        await page.fill('#akimaY', '[0,2,1,3,2,4]');
        
        await page.click('button:text("Test SP_AKIMA1D")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_AKIMA1D/);
        expect(logContent).toMatch(/✅ SP_AKIMA1D interpolator created successfully/);
        expect(logContent).toMatch(/Akima interpolated values:/);
    });

    test('should test SP_UNISPLINE smoothing splines', async ({ page }) => {
        await page.fill('#unisplineX', '[0,1,2,3,4,5]');
        await page.fill('#unisplineY', '[0.1,0.9,4.1,8.9,16.1,24.9]');
        await page.fill('#unisplineSmooth', '1.5');
        
        await page.click('button:text("Test SP_UNISPLINE")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_UNISPLINE with smoothing factor: 1.5/);
        expect(logContent).toMatch(/✅ SP_UNISPLINE interpolator created successfully/);
        expect(logContent).toMatch(/Unispline interpolated values:/);
    });

    test('should test SP_REGULARGRID with regular grid interpolation', async ({ page }) => {
        await page.fill('#regulargridPoints', '[0,1,2,3,4]');
        await page.fill('#regulargridValues', '[0,1,4,9,16]');
        await page.selectOption('#regulargridMethod', 'linear');
        
        await page.click('button:text("Test SP_REGULARGRID")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_REGULARGRID with method: linear/);
        expect(logContent).toMatch(/✅ SP_REGULARGRID interpolator created successfully/);
        expect(logContent).toMatch(/Regular grid interpolated values:/);
    });

    test('should test SP_CUBIC_SPLINE with boundary conditions', async ({ page }) => {
        await page.selectOption('#cubicBoundary', 'natural');
        await page.setChecked('#cubicExtrapolate', false);
        
        await page.click('button:text("Test SP_CUBIC_SPLINE")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_CUBIC_SPLINE with boundary: natural, extrapolate: false/);
        expect(logContent).toMatch(/✅ SP_CUBIC_SPLINE interpolator created successfully/);
        expect(logContent).toMatch(/Cubic spline interpolated values:/);
    });

    test('should test SP_CUBIC_SPLINE with extrapolation', async ({ page }) => {
        await page.selectOption('#cubicBoundary', 'not-a-knot');
        await page.setChecked('#cubicExtrapolate', true);
        
        await page.click('button:text("Test SP_CUBIC_SPLINE")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_CUBIC_SPLINE with boundary: not-a-knot, extrapolate: true/);
        expect(logContent).toMatch(/✅ SP_CUBIC_SPLINE interpolator created successfully/);
    });

    test('should test SP_SPLPREP parametric splines', async ({ page }) => {
        await page.fill('#splprepX', '[0,1,2,3]');
        await page.fill('#splprepY', '[0,1,0,-1]');
        
        await page.click('button:text("Test SP_SPLPREP")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/Testing SP_SPLPREP for parametric curve/);
        expect(logContent).toMatch(/✅ SP_SPLPREP parametric spline created successfully/);
        expect(logContent).toMatch(/Parametric curve values:/);
    });

    test('should visualize SP_GRIDDATA', async ({ page }) => {
        await page.click('button:text("Visualize Griddata")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Griddata visualization updated/);
    });

    test('should visualize SP_AKIMA1D', async ({ page }) => {
        await page.click('button:text("Visualize Akima")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Akima visualization updated/);
        
        // Check that canvas has been drawn to
        const hasDrawing = await page.evaluate(() => {
            const canvas = document.getElementById('plotCanvas');
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return imageData.data.some(pixel => pixel !== 255);
        });
        
        expect(hasDrawing).toBe(true);
    });

    test('should visualize SP_UNISPLINE', async ({ page }) => {
        await page.click('button:text("Visualize Unispline")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Unispline visualization updated/);
    });

    test('should visualize SP_REGULARGRID', async ({ page }) => {
        await page.click('button:text("Visualize Regulargrid")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Regular grid visualization updated/);
    });

    test('should visualize SP_CUBIC_SPLINE', async ({ page }) => {
        await page.click('button:text("Visualize Cubic Spline")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Cubic spline visualization updated/);
    });

    test('should visualize SP_SPLPREP parametric curve', async ({ page }) => {
        await page.click('button:text("Visualize Parametric Curve")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/✅ Parametric curve visualization updated/);
        
        // Verify canvas has parametric curve drawing
        const hasDrawing = await page.evaluate(() => {
            const canvas = document.getElementById('plotCanvas');
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            return imageData.data.some(pixel => pixel !== 255);
        });
        
        expect(hasDrawing).toBe(true);
    });

    test('should run extended test suite with new functions', async ({ page }) => {
        await page.click('button:text("Run All Tests")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/=== Running All SciPy Interpolation Tests ===/);
        expect(logContent).toMatch(/Testing SP_GRIDDATA/);
        expect(logContent).toMatch(/Testing SP_AKIMA1D/);
        expect(logContent).toMatch(/Testing SP_UNISPLINE/);
        expect(logContent).toMatch(/Testing SP_REGULARGRID/);
        expect(logContent).toMatch(/Testing SP_CUBIC_SPLINE/);
        expect(logContent).toMatch(/Testing SP_SPLPREP/);
        expect(logContent).toMatch(/=== All Tests Completed ===/);
        
        // Should have significantly more success messages now
        const successCount = (logContent.match(/✅/g) || []).length;
        expect(successCount).toBeGreaterThanOrEqual(10);
    });

    test('should handle different GRIDDATA interpolation methods', async ({ page }) => {
        await page.selectOption('#griddataMethod', 'nearest');
        await page.click('button:text("Test SP_GRIDDATA")');
        
        let logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/method: nearest/);
        
        await page.click('button:text("Clear Log")');
        await page.selectOption('#griddataMethod', 'cubic');
        await page.click('button:text("Test SP_GRIDDATA")');
        
        logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/method: cubic/);
    });

    test('should handle different REGULARGRID methods', async ({ page }) => {
        await page.selectOption('#regulargridMethod', 'nearest');
        await page.click('button:text("Test SP_REGULARGRID")');
        
        const logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/method: nearest/);
        expect(logContent).toMatch(/✅ SP_REGULARGRID interpolator created successfully/);
    });

    test('should handle UNISPLINE smoothing parameter changes', async ({ page }) => {
        await page.fill('#unisplineSmooth', '0');
        await page.click('button:text("Test SP_UNISPLINE")');
        
        let logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/smoothing factor: 0/);
        
        await page.click('button:text("Clear Log")');
        await page.fill('#unisplineSmooth', '2.5');
        await page.click('button:text("Test SP_UNISPLINE")');
        
        logContent = await page.textContent('#testLog');
        expect(logContent).toMatch(/smoothing factor: 2.5/);
    });
});