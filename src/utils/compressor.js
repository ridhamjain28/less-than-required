/**
 * Compressor Utility for 'Less Than Required'
 * Smart compression that preserves original file format.
 */

const LTR_Compressor = {
    /**
     * Compresses a file while preserving original format.
     * Flow: Original → JPEG (compress) → Original Format
     * @param {File} file - The original file.
     * @param {number} quality - 0 to 1 (default 0.7).
     * @returns {Promise<File>} - The compressed file in original format.
     */
    compressImage: async (file, quality = 0.7) => {
        // --- PDF Handling ---
        if (file.type === 'application/pdf') {
            return LTR_Compressor.compressPDF(file);
        }

        // --- Image Handling ---
        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }

        // Remember original format
        const originalType = file.type;
        const originalName = file.name;

        // Dynamic maxWidth based on quality
        let maxWidth;
        if (quality >= 0.85) {
            maxWidth = 2560;
        } else if (quality >= 0.6) {
            maxWidth = 1920;
        } else {
            maxWidth = 1280;
        }

        // Step 1: Load image
        const img = await LTR_Compressor.loadImage(file);

        // Step 2: Resize if needed
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
        }

        // Step 3: Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Step 4: Compress via JPEG (this is where real compression happens)
        const jpegBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });

        // Step 5: If original was JPEG, we're done
        if (originalType === 'image/jpeg' || originalType === 'image/jpg') {
            const newFile = new File([jpegBlob], originalName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
            console.log(`[LTR] Compressed JPEG: ${file.size} → ${newFile.size}`);
            return newFile;
        }

        // Step 6: Convert back to original format (PNG, WebP, etc.)
        // Load the compressed JPEG
        const compressedImg = await LTR_Compressor.loadImageFromBlob(jpegBlob);

        // Draw to new canvas
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = compressedImg.width;
        finalCanvas.height = compressedImg.height;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.drawImage(compressedImg, 0, 0);

        // Export as original format
        const finalBlob = await new Promise(resolve => {
            finalCanvas.toBlob(resolve, originalType);
        });

        const newFile = new File([finalBlob], originalName, {
            type: originalType,
            lastModified: Date.now(),
        });

        const reduction = Math.round((1 - newFile.size / file.size) * 100);
        console.log(`[LTR] Compressed ${originalType}: ${file.size} → ${newFile.size} (${reduction}% smaller)`);

        return newFile;
    },

    /**
     * Helper: Load image from File
     */
    loadImage: (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Helper: Load image from Blob
     */
    loadImageFromBlob: (blob) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    },

    /**
     * PDF Compression
     */
    compressPDF: async (file) => {
        console.log('PDF Detected. Attempting optimization...');
        try {
            if (typeof PDFLib === 'undefined') {
                throw new Error('PDFLib not loaded');
            }
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pdfBytes = await pdfDoc.save();

            const newFile = new File([pdfBytes], file.name, {
                type: 'application/pdf',
                lastModified: Date.now(),
            });

            if (newFile.size < file.size) {
                return newFile;
            } else {
                console.log('PDF did not shrink. Returning original.');
                return file;
            }
        } catch (err) {
            console.error('PDF Error:', err);
            throw err;
        }
    }
};
