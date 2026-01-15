/**
 * Content Script for 'Less Than Required'
 * Premium UI with better detection and feedback.
 */

console.log("Less Than Required: Content Script Active");

function init() {
    processExistingInputs();
    setupObserver();
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
                showCompressNotification(input, file, limitBytes);
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

function showCompressNotification(input, file, limitBytes) {
    // Remove any existing notification
    document.querySelectorAll('[id^="ltr-notification"]').forEach(el => el.remove());

    const wrapperId = 'ltr-notification-' + Date.now();

    // Inject styles once
    if (!document.getElementById('ltr-styles')) {
        const style = document.createElement('style');
        style.id = 'ltr-styles';
        style.textContent = `
            @keyframes ltr-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes ltr-slide-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
            @keyframes ltr-pulse { 0%, 100% { box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3); } 50% { box-shadow: 0 4px 30px rgba(99, 102, 241, 0.5); } }
            @keyframes ltr-confetti { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-100px) rotate(360deg); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }

    const wrapper = document.createElement('div');
    wrapper.id = wrapperId;
    wrapper.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px 20px;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        z-index: 2147483647;
        animation: ltr-slide-in 0.4s ease-out, ltr-pulse 2s infinite;
        color: white;
        max-width: 380px;
    `;

    const icon = document.createElement('div');
    icon.textContent = '⚡';
    icon.style.cssText = 'font-size: 24px; flex-shrink: 0;';

    const content = document.createElement('div');
    content.style.cssText = 'flex: 1; min-width: 0;';

    const title = document.createElement('div');
    title.textContent = 'Large File Detected!';
    title.style.cssText = 'font-weight: 600; margin-bottom: 4px;';

    const subtitle = document.createElement('div');
    subtitle.textContent = `${formatBytes(file.size)} → Target: ${formatBytes(limitBytes)}`;
    subtitle.style.cssText = 'font-size: 12px; opacity: 0.9;';

    content.appendChild(title);
    content.appendChild(subtitle);

    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; flex-shrink: 0;';

    const btn = document.createElement('button');
    btn.textContent = '🔥 Compress';
    btn.style.cssText = `
        background: white;
        color: #6366f1;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
    `;
    btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
    btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

    const close = document.createElement('button');
    close.textContent = '✕';
    close.style.cssText = 'background: transparent; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 16px; padding: 4px;';
    close.onclick = () => {
        wrapper.style.animation = 'ltr-slide-out 0.3s forwards';
        setTimeout(() => wrapper.remove(), 300);
    };

    btn.onclick = async () => {
        btn.textContent = '⏳ Working...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        try {
            const compressed = await LTR_Compressor.compressImage(file, 0.7);
            updateInput(input, compressed);

            const savedPct = Math.round(((file.size - compressed.size) / file.size) * 100);

            // Success state
            wrapper.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            wrapper.style.animation = 'none';
            icon.textContent = '🎉';
            title.textContent = 'Compressed Successfully!';
            subtitle.textContent = `Saved ${savedPct}% • Now ${formatBytes(compressed.size)}`;

            btn.textContent = '⬇️ Save Copy';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.color = '#10b981';

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
                    wrapper.style.animation = 'ltr-slide-out 0.3s forwards';
                    setTimeout(() => wrapper.remove(), 300);
                }
            }, 20000);

        } catch (err) {
            console.error(err);
            wrapper.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            title.textContent = 'Compression Failed';
            subtitle.textContent = err.message || 'Unknown error';
            btn.textContent = 'Retry';
            btn.disabled = false;
            btn.style.opacity = '1';
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

    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
