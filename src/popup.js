const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const resultCard = document.getElementById('result');
const origSizeSpan = document.getElementById('origSize');
const compSizeSpan = document.getElementById('compSize');
const savedPercentSpan = document.getElementById('savedPercent');
const downloadLink = document.getElementById('downloadLink');
const resetBtn = document.getElementById('resetBtn');

const presetSelect = document.getElementById('presetSelect');
const customSettings = document.getElementById('customSettings');
const targetKB = document.getElementById('targetKB');
const targetWidth = document.getElementById('targetWidth');
const targetHeight = document.getElementById('targetHeight');
const targetFormat = document.getElementById('targetFormat');

// State
let isCompressing = false;

// Presets Configuration
const PRESETS = {
    'passport': { kb: 45, width: 200, height: 230, format: 'image/jpeg' },
    'signature': { kb: 18, width: 140, height: 60, format: 'image/jpeg' },
    'doc_pdf': { kb: 480, width: null, height: null, format: 'auto' }
};

// UI Logic
presetSelect.addEventListener('change', () => {
    const val = presetSelect.value;
    if (val === 'custom') {
        customSettings.classList.add('show');
    } else {
        customSettings.classList.remove('show');
    }
    
    // Auto-fill custom fields based on preset if it's a known preset
    if (PRESETS[val]) {
        targetKB.value = PRESETS[val].kb || '';
        targetWidth.value = PRESETS[val].width || '';
        targetHeight.value = PRESETS[val].height || '';
        targetFormat.value = PRESETS[val].format || 'auto';
    } else if (val === 'auto') {
        targetKB.value = '';
        targetWidth.value = '';
        targetHeight.value = '';
        targetFormat.value = 'auto';
    }
});

// Drag interactions
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (isCompressing) return;
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (isCompressing) return;

    const files = e.dataTransfer.files;
    if (files.length) handleFile(files[0]);
});

// Click to select
dropZone.addEventListener('click', () => {
    if (!resultCard.classList.contains('show')) {
        fileInput.click();
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
    fileInput.value = '';
});

resetBtn.addEventListener('click', resetUI);

function resetUI() {
    resultCard.classList.remove('show');
    dropZone.classList.remove('hidden');
    origSizeSpan.textContent = '-';
    compSizeSpan.textContent = '-';
    savedPercentSpan.textContent = '-';
}

async function handleFile(file) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert("Please select an image or PDF file.");
        return;
    }

    isCompressing = true;
    dropZone.style.opacity = '0.5';
    dropZone.querySelector('.drop-text').textContent = 'Compressing...';

    try {
        const preset = presetSelect.value;
        const options = {};
        
        if (preset === 'auto') {
            options.quality = 0.7; // default auto behavior
        } else {
            options.targetKB = targetKB.value ? parseInt(targetKB.value, 10) : null;
            options.width = targetWidth.value ? parseInt(targetWidth.value, 10) : null;
            options.height = targetHeight.value ? parseInt(targetHeight.value, 10) : null;
            options.format = targetFormat.value === 'auto' ? null : targetFormat.value;
        }

        const compressed = await LTR_Compressor.processFile(file, options);

        // Calculate stats
        const savedBytes = file.size - compressed.size;
        const savedPct = Math.round((savedBytes / file.size) * 100);

        // Update UI
        isCompressing = false;
        dropZone.style.opacity = '1';
        dropZone.querySelector('.drop-text').textContent = 'Drop your file here';
        dropZone.classList.add('hidden');
        resultCard.classList.add('show');

        origSizeSpan.textContent = formatSize(file.size);
        compSizeSpan.textContent = formatSize(compressed.size);
        savedPercentSpan.textContent = savedPct > 0 ? `${savedPct}%` : '0%';

        const url = URL.createObjectURL(compressed);
        downloadLink.href = url;
        downloadLink.download = compressed.name;

    } catch (err) {
        console.error(err);
        isCompressing = false;
        dropZone.style.opacity = '1';
        dropZone.querySelector('.drop-text').textContent = 'Error! Try again.';
    }
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
