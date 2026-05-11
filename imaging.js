import { removeBackground } from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm';

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const processingSection = document.getElementById('processing-section');
const resultSection = document.getElementById('result-section');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('image-upload');

const progressBar = document.getElementById('progress-bar');
const processingStatus = document.getElementById('processing-status');
const processingDetails = document.getElementById('processing-details');

const originalPreview = document.getElementById('original-preview');
const resultPreview = document.getElementById('result-preview');

const btnReset = document.getElementById('btn-reset');
const btnDownload = document.getElementById('btn-download');

// State
let currentProcessedBlob = null;
let originalFileName = '';

// Initialize Event Listeners
function init() {
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    // File input event
    fileInput.addEventListener('change', handleFileSelect);

    // Action buttons
    btnReset.addEventListener('click', resetApp);
    btnDownload.addEventListener('click', downloadResult);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    dropZone.classList.add('drag-active');
}

function unhighlight(e) {
    dropZone.classList.remove('drag-active');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFile(e.target.files[0]);
    }
}

async function processFile(file) {
    // Basic validation
    if (!file.type.match('image.*')) {
        alert('Please select a valid image file (JPG, PNG, WEBP).');
        return;
    }

    originalFileName = file.name;

    // Show processing UI
    uploadSection.classList.add('hidden');
    processingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');

    // Reset progress
    progressBar.style.width = '0%';
    processingStatus.textContent = 'Preparing image...';

    try {
        // Create a URL for the original image to show in preview
        const originalUrl = URL.createObjectURL(file);
        originalPreview.src = originalUrl;

        // Configuration for the background removal
        const config = {
            debug: true, // Enable debug to see more logs if it fails again
            progress: (key, current, total) => {
                // Key is usually the model name like 'isnet'
                const percent = Math.round((current / total) * 100);
                progressBar.style.width = `${percent}%`;

                if (key.includes('model')) {
                    processingStatus.textContent = 'Loading AI Models...';
                    processingDetails.textContent = `Downloading (${percent}%) - First time takes a bit longer.`;
                } else if (key === 'compute:inference') {
                    processingStatus.textContent = 'Processing Image...';
                    processingDetails.textContent = 'Magic in progress...';
                }
            }
        };

        // Run the background removal
        console.log('Starting background removal...');
        processingStatus.textContent = 'Initializing engine...';

        const blob = await removeBackground(file, config);
        currentProcessedBlob = blob;

        // Show the result
        displayResult(blob);

    } catch (error) {
        console.error('Error during background removal:', error);
        alert(`Failed to remove background: ${error.message || error}\n\nPlease try again or use a different image. Check console for details.`);
        resetApp();
    }
}

function displayResult(blob) {
    // Hide processing, show results
    processingSection.classList.add('hidden');
    resultSection.classList.remove('hidden');

    // Create URL for the result
    const resultUrl = URL.createObjectURL(blob);
    resultPreview.src = resultUrl;
}

function downloadResult() {
    if (!currentProcessedBlob) return;

    // Generate a new filename based on the original
    const nameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
    const downloadName = `${nameWithoutExt}-rmbg.png`;

    const url = URL.createObjectURL(currentProcessedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function resetApp() {
    // Reset state
    currentProcessedBlob = null;
    originalFileName = '';
    fileInput.value = '';

    // Reset UI
    uploadSection.classList.remove('hidden');
    processingSection.classList.add('hidden');
    resultSection.classList.add('hidden');

    progressBar.style.width = '0%';

    // Clear image sources to free up memory
    if (originalPreview.src) {
        URL.revokeObjectURL(originalPreview.src);
        originalPreview.src = '';
    }
    if (resultPreview.src) {
        URL.revokeObjectURL(resultPreview.src);
        resultPreview.src = '';
    }
}

// Start the app
init();
