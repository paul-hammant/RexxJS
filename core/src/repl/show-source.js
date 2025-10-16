/**
 * Show Source Button - Displays REXX script content with syntax highlighting
 * Auto-adds a "Show Source" button to any page with REXX script tags
 * Uses Prism.js for syntax highlighting
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

(function() {
    'use strict';

    // Check if Prism is available
    function isPrismAvailable() {
        if (typeof Prism === 'undefined') return false;
        if (!Prism.languages) return false;

        // If REXX language not available, try to wait for it
        if (!Prism.languages.rexx) {
            // Give it a brief moment for async loading
            return false;
        }
        return true;
    }

    // Ensure REXX language is loaded with retries
    function ensureRexxLanguage() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds max with 100ms intervals

            const checkRexxLang = () => {
                if (typeof Prism !== 'undefined' && Prism.languages && Prism.languages.rexx) {
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkRexxLang, 100);
                } else {
                    resolve(false);
                }
            };

            checkRexxLang();
        });
    }

    // REXX syntax highlighter using Prism.js with inline styles
    function highlightRexx(code) {
        if (isPrismAvailable()) {
            // Use Prism for highlighting
            const highlighted = Prism.highlight(code, Prism.languages.rexx, 'rexx');

            // Apply inline styles to Prism token types
            return highlighted
                // Comments: gray italic
                .replace(/<span class="token comment">([\s\S]*?)<\/span>/g,
                    '<span style="color: #999; font-style: italic;">$1</span>')
                // Strings: blue
                .replace(/<span class="token string">([\s\S]*?)<\/span>/g,
                    '<span style="color: #183691;">$1</span>')
                // Keywords: purple/bold
                .replace(/<span class="token keyword">([\s\S]*?)<\/span>/g,
                    '<span style="color: #9000ff; font-weight: bold;">$1</span>')
                // Functions: teal
                .replace(/<span class="token function">([\s\S]*?)<\/span>/g,
                    '<span style="color: #0066cc;">$1</span>')
                // Variables: dark blue
                .replace(/<span class="token variable">([\s\S]*?)<\/span>/g,
                    '<span style="color: #0066cc;">$1</span>')
                // Numbers: orange
                .replace(/<span class="token number">([\s\S]*?)<\/span>/g,
                    '<span style="color: #d73a49;">$1</span>')
                // Operators: red
                .replace(/<span class="token operator">([\s\S]*?)<\/span>/g,
                    '<span style="color: #d73a49;">$1</span>')
                // Punctuation: gray
                .replace(/<span class="token punctuation">([\s\S]*?)<\/span>/g,
                    '<span style="color: #666;">$1</span>')
                // Namespace: purple
                .replace(/<span class="token namespace">([\s\S]*?)<\/span>/g,
                    '<span style="color: #9000ff;">$1</span>');
        } else {
            // Just escape HTML and return in monospace (no highlighting available)
            return code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
    }

    // Fetch raw HTML source and extract content
    async function fetchRawSource() {
        try {
            const response = await fetch(window.location.href);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const rawHtml = await response.text();
            return processRawSource(rawHtml);
        } catch (error) {
            console.error('Failed to fetch raw source:', error);
            return {
                error: `Failed to fetch source: ${error.message}`,
                content: null,
                highlighted: null
            };
        }
    }

    // Process raw HTML source with basic highlighting
    function processRawSource(rawHtml) {
        // Escape HTML for display
        let highlighted = rawHtml
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Find and highlight REXX script sections
        highlighted = highlighted.replace(
            /(&lt;script[^&gt;]*type=&quot;text\/rexx&quot;[^&gt;]*&gt;)([\s\S]*?)(&lt;\/script&gt;)/gi,
            (match, openTag, scriptContent, closeTag) => {
                // Highlight the script tags
                const highlightedOpenTag = `<span style="color: #0066cc; font-weight: bold;">${openTag}</span>`;
                const highlightedCloseTag = `<span style="color: #0066cc; font-weight: bold;">${closeTag}</span>`;
                
                // Apply REXX highlighting to the content (need to unescape first)
                const unescapedContent = scriptContent
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');
                
                const rexxHighlighted = highlightRexx(unescapedContent);
                
                return highlightedOpenTag + rexxHighlighted + highlightedCloseTag;
            }
        );

        // Basic HTML syntax highlighting for other elements
        highlighted = highlighted.replace(
            /(&lt;\/?[a-zA-Z][^&gt;]*&gt;)/g,
            '<span style="color: #666;">$1</span>'
        );

        // Highlight HTML attributes
        highlighted = highlighted.replace(
            /(\w+)=(&quot;[^&quot;]*&quot;|&#39;[^&#39;]*&#39;)/g,
            '<span style="color: #d14;">$1</span>=<span style="color: #183691;">$2</span>'
        );

        // Highlight HTML comments
        highlighted = highlighted.replace(
            /(&lt;!--[\s\S]*?--&gt;)/g,
            '<span style="color: #999; font-style: italic;">$1</span>'
        );

        return {
            error: null,
            content: rawHtml,
            highlighted: highlighted
        };
    }

    // Create and show the source modal
    async function showSource() {
        // Show loading message
        const loadingOverlay = createLoadingOverlay();
        document.body.appendChild(loadingOverlay);

        try {
            // Ensure REXX language is loaded before fetching source
            await ensureRexxLanguage();

            const sourceData = await fetchRawSource();

            // Remove loading overlay
            document.body.removeChild(loadingOverlay);

            if (sourceData.error) {
                alert(`Error fetching source: ${sourceData.error}`);
                return;
            }

            showRawSourceModal(sourceData);
        } catch (error) {
            // Remove loading overlay
            if (document.body.contains(loadingOverlay)) {
                document.body.removeChild(loadingOverlay);
            }
            alert(`Error: ${error.message}`);
        }
    }

    // Create loading overlay
    function createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 18px;
        `;
        overlay.textContent = 'Fetching source code...';
        return overlay;
    }

    // Show the raw source modal
    function showRawSourceModal(sourceData) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 95%;
            height: 95%;
            max-width: 1400px;
            max-height: 900px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        `;

        // Modal header
        const header = document.createElement('div');
        header.style.cssText = `
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0;
            color: #333;
            font-family: Arial, sans-serif;
        `;
        title.textContent = 'Raw HTML Source (with REXX highlighting)';

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => document.body.removeChild(overlay);

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Modal body
        const body = document.createElement('div');
        body.style.cssText = `
            padding: 0;
            overflow-y: auto;
            flex: 1;
        `;

        // Code container for the entire source
        const codeContainer = document.createElement('div');
        codeContainer.style.cssText = `
            background: #f8f9fa;
            padding: 20px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            overflow-x: auto;
            white-space: pre;
            height: 100%;
            box-sizing: border-box;
        `;
        codeContainer.innerHTML = sourceData.highlighted;

        body.appendChild(codeContainer);
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    // Create and add the show source button
    function addShowSourceButton() {
        // Only add if there are REXX scripts on the page
        const rexxScripts = document.querySelectorAll('script[type="text/rexx"]');
        if (rexxScripts.length === 0) {
            return;
        }

        const button = document.createElement('button');
        button.textContent = 'Show Source';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
            z-index: 1000;
            font-family: Arial, sans-serif;
            transition: all 0.2s ease;
        `;

        // Hover effects
        button.onmouseenter = () => {
            button.style.background = '#0056b3';
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
        };

        button.onmouseleave = () => {
            button.style.background = '#007bff';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
        };

        button.onclick = showSource;

        document.body.appendChild(button);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addShowSourceButton);
    } else {
        addShowSourceButton();
    }

})();