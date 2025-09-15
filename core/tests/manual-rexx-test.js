/**
 * Quick manual test to verify the new Rexx-to-Rexx functionality
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

// Quick manual test to verify the new Rexx-to-Rexx functionality
const { chromium } = require('playwright');

async function testRexxToRexx() {
    console.log('🔴 Testing Rexx-to-Rexx Communication...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to test harness
        console.log('📱 Opening test harness...');
        await page.goto('http://localhost:8080/tests/test-harness-multi-instance.html');
        
        // Wait for all frames to load
        console.log('⏳ Waiting for frames to load...');
        await page.waitForSelector('#communication-log', { timeout: 10000 });
        
        // Check if we can see the new frames
        const epsilonFrame = await page.locator('#rexx-epsilon').isVisible();
        const serviceFrame = await page.locator('#rexx-service').isVisible();
        
        console.log(`✅ Epsilon frame visible: ${epsilonFrame}`);
        console.log(`✅ Service frame visible: ${serviceFrame}`);
        
        // Wait for ready message
        await page.waitForFunction(
            () => document.querySelector('#communication-log').textContent.includes('rexx-epsilon'),
            { timeout: 15000 }
        );
        
        console.log('✅ Test harness loaded with new Rexx-to-Rexx components!');
        
        // Try to access the client frame and click the test button
        const clientFrame = page.frameLocator('#rexx-epsilon');
        await clientFrame.locator('#test-simple').click();
        
        console.log('✅ Clicked test simple button');
        
        await clientFrame.locator('#send-rexx').click();
        console.log('✅ Clicked send rexx button');
        
        // Wait a bit for execution
        await page.waitForTimeout(5000);
        
        const logContent = await page.locator('#communication-log').textContent();
        console.log('📋 Communication log contains:');
        console.log(logContent.includes('RAW REXX REQUEST') ? '✅ RAW REXX REQUEST found' : '❌ RAW REXX REQUEST not found');
        console.log(logContent.includes('ROUTED RAW REXX') ? '✅ ROUTED RAW REXX found' : '❌ ROUTED RAW REXX not found');
        
        console.log('🎉 Manual test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testRexxToRexx();