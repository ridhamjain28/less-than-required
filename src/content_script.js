/**
 * Content Script for 'Less Than Required'
 * Premium UI with better detection and feedback.
 */

console.log("Less Than Required: Content Script Active");

function init() {
    processExistingInputs();
    setupObserver();
    setupDragAndDrop();
}

function processExistingInputs() {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(attachListener);
}

function setupObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.tagName === 'INPUT' && node.type === 'file') {
                        attachListener(node);
                    } else {
                        const inputs = node.querySelectorAll?.('input[type="file"]');
                        inputs?.forEach(attachListener);
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function setupDragAndDrop() {
    // Intercept drop events globally during the capture phase
    document.addEventListener('drop', (e) => {
        if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

        // Skip if this is our synthetic drop event
        if (e.detail && e.detail.ltrSynthetic) return;

        const file = e.dataTransfer.files[0];
        if (!file) return;

        // Attempt to detect limit from the drop target or overall page
        const limitBytes = detectFileLimit(e.target) || 1024 * 1024;

        if (file.size > limitBytes) {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                e.preventDefault();
                e.stopPropagation();

                console.log(`[LTR] Drag-and-drop intercepted: ${file.name} (${formatBytes(file.size)}). Detected Limit: ${formatBytes(limitBytes)}`);
                showCompressNotification(e.target, file, limitBytes, true);
            }
        }
    }, true);
}

function attachListener(input) {
    if (input.dataset.ltrAttached) return;
    input.dataset.ltrAttached = "true";

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const detectedLimit = detectFileLimit(input);
        const limitBytes = detectedLimit || 1024 * 1024;

        console.log(`[LTR] File: ${file.name} (${formatBytes(file.size)}). Detected Limit: ${formatBytes(limitBytes)}`);

        if (file.size > limitBytes) {
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                showCompressNotification(input, file, limitBytes, false);
            }
        }
    });
}

function detectFileLimit(input) {
    const context = getInputContext(input).join(' ');
    const pageTitle = document.title;
    const headers = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent).join(' ');
    const fullText = (context + ' ' + pageTitle + ' ' + headers).toLowerCase();

    // Enhanced regex to catch more patterns
    const regex = /(?:max(?:imum)?|limit|size|<|up to|to|under|below)[\s\w:.\-–]*?(\d+(?:\.\d+)?)\s*[-–]?\s*(mb|kb|gb)/gi;

    let match;
    let maxLimitFound = 0;

    while ((match = regex.exec(fullText)) !== null) {
        const value = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        let bytes = 0;

        if (unit === 'mb') bytes = value * 1024 * 1024;
        if (unit === 'kb') bytes = value * 1024;
        if (unit === 'gb') bytes = value * 1024 * 1024 * 1024;

        if (bytes > 1024 && bytes < 1024 * 1024 * 1024) {
            if (bytes > maxLimitFound) maxLimitFound = bytes;
        }
    }

    return maxLimitFound > 0 ? maxLimitFound : null;
}

function getInputContext(input) {
    const texts = [];
    const safeText = (node) => node?.textContent?.trim() || '';

    if (input.id) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) texts.push(safeText(label));
    }

    let parent = input.parentElement;
    for (let i = 0; i < 4 && parent; i++) {
        texts.push(safeText(parent));
        parent = parent.parentElement;
    }

    let sibling = input.previousElementSibling;
    while (sibling) {
        texts.push(safeText(sibling));
        sibling = sibling.previousElementSibling;
    }

    return texts;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showCompressNotification(target, file, limitBytes, isDrop = false) {
    // Remove any existing notification
    document.querySelectorAll('[id^="ltr-notification"]').forEach(el => el.remove());

    const wrapperId = 'ltr-notification-' + Date.now();

    const wrapper = document.createElement('div');
    wrapper.id = wrapperId;
    wrapper.className = 'ltr-notification-toast';

    const icon = document.createElement('div');
    icon.className = 'ltr-notification-icon';
    icon.textContent = '⚡';

    const content = document.createElement('div');
    content.className = 'ltr-notification-content';

    const title = document.createElement('div');
    title.className = 'ltr-notification-title';
    title.textContent = 'Large File Detected!';

    const subtitle = document.createElement('div');
    subtitle.className = 'ltr-notification-subtitle';
    subtitle.textContent = `${formatBytes(file.size)} → Target: ${formatBytes(limitBytes)}`;

    content.appendChild(title);
    content.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.className = 'ltr-notification-actions';

    const btn = document.createElement('button');
    btn.className = 'ltr-notification-btn';
    btn.textContent = '🔥 Compress';

    const close = document.createElement('button');
    close.className = 'ltr-notification-close';
    close.textContent = '✕';
    close.onclick = () => {
        wrapper.classList.add('dismissing');
        setTimeout(() => wrapper.remove(), 300);
    };

    btn.onclick = async () => {
        btn.textContent = '⏳ Working...';
        btn.disabled = true;

        try {
            const options = {
                targetKB: Math.max(10, Math.floor(limitBytes / 1024))
            };

            const compressed = await LTR_Compressor.processFile(file, options);
            
            if (compressed.size > limitBytes) {
                throw new Error('Could not compress below required size.');
            }
            
            if (isDrop) {
                simulateDrop(target, compressed);
            } else {
                updateInput(target, compressed);
            }

            const savedPct = Math.round(((file.size - compressed.size) / file.size) * 100);

            // Success state
            wrapper.className = 'ltr-notification-toast success';
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
            title.textContent = 'Compressed Successfully!';
            subtitle.textContent = `Saved ${savedPct}% • Now ${formatBytes(compressed.size)}`;

            btn.textContent = 'Save Copy';
            btn.disabled = false;

            btn.onclick = () => {
                const url = URL.createObjectURL(compressed);
                const a = document.createElement('a');
                a.href = url;
                a.download = compressed.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            // Auto-dismiss after 20 seconds
            setTimeout(() => {
                if (wrapper.parentNode) {
                    wrapper.classList.add('dismissing');
                    setTimeout(() => wrapper.remove(), 300);
                }
            }, 20000);

        } catch (err) {
            console.error(err);
            wrapper.className = 'ltr-notification-toast error';
            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
            title.textContent = 'Compression Failed';
            subtitle.textContent = err.message || 'File too large to compress further.';
            btn.style.display = 'none';
            
            // Auto-dismiss error after 10 seconds
            setTimeout(() => {
                if (wrapper.parentNode) {
                    wrapper.classList.add('dismissing');
                    setTimeout(() => wrapper.remove(), 300);
                }
            }, 10000);
        }
    };

    actions.appendChild(btn);
    wrapper.appendChild(icon);
    wrapper.appendChild(content);
    wrapper.appendChild(actions);
    wrapper.appendChild(close);

    document.body.appendChild(wrapper);
}

function updateInput(input, file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;

    // Dispatch change, input, and blur events to trigger standard frontend bindings (React, Angular, Vue)
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
}

function simulateDrop(dropZone, file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    let dropEvent;
    try {
        dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
        });
    } catch (e) {
        dropEvent = new Event('drop', { bubbles: true, cancelable: true });
        dropEvent.dataTransfer = dataTransfer;
    }
    
    // Add custom detail so we don't intercept our own synthetic event
    Object.defineProperty(dropEvent, 'detail', { value: { ltrSynthetic: true } });
    
    dropZone.dispatchEvent(dropEvent);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
