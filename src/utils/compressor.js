/**
 * Compressor Utility for 'Less Than Required'
 * Smart compression that preserves original file format and handles transparency.
 */

const LTR_Compressor = {
    /**
     * Advanced processing for Govt File Upload Helper MVP
     * Handles explicit dimensions (cropping), formats, and exact KB targeting.
     */
    processFile: async (file, options = {}) => {
        if (!options.targetKB && !options.width && !options.height && !options.format) {
            return LTR_Compressor.compressImage(file, options.quality || 0.7);
        }

        if (file.type === 'application/pdf') {
            if (options.targetKB) {
                 return LTR_Compressor.compressPDFIterative(file, options.targetKB);
            }
            return LTR_Compressor.compressPDF(file, 0.7);
        }

        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }

        let img = await LTR_Compressor.loadImage(file);
        
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        
        if (options.width && options.height) {
            // Explicit dimensions: Crop and center
            canvas.width = options.width;
            canvas.height = options.height;
            
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / scale - img.width) / 2;
            const y = (canvas.height / scale - img.height) / 2;
            
            // Draw background white just in case it's converted to JPEG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.drawImage(img, x * scale, y * scale, img.width * scale, img.height * scale);
        } else {
            // Just normal resize if needed
            let width = img.width;
            let height = img.height;
            const maxWidth = options.width || 2560;
            
            if (width > maxWidth) {
                height = Math.round(height * (maxWidth / width));
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
        }

        let targetFormat = options.format || file.type;
        
        let newName = file.name;
        if (options.format && options.format !== file.type) {
            let ext = targetFormat.split('/')[1] || 'jpg';
            if (ext === 'jpeg') ext = 'jpg';
            newName = newName.replace(/\.[^/.]+$/, "") + "." + ext;
        }

        if (!options.targetKB) {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, targetFormat, 0.9));
            return new File([blob], newName, { type: targetFormat, lastModified: Date.now() });
        }

        // Iterative compression to hit targetKB
        const targetBytes = options.targetKB * 1024;
        let bestBlob = null;
        let low = 0.1;
        let high = 0.95;
        let iterations = 0;

        while (low <= high && iterations < 7) {
            let mid = (low + high) / 2;
            let blob = await new Promise(resolve => canvas.toBlob(resolve, targetFormat, mid));
            
            if (blob.size <= targetBytes) {
                bestBlob = blob; // This works, try to get better quality
                low = mid + 0.05;
            } else {
                high = mid - 0.05; // Too big, lower quality
            }
            iterations++;
        }

        if (!bestBlob) {
             bestBlob = await new Promise(resolve => canvas.toBlob(resolve, targetFormat, 0.1));
        }

        return new File([bestBlob], newName, { type: targetFormat, lastModified: Date.now() });
    },

    /**
     * Compresses a file while preserving original format.
     * Flow:
     * - JPEG/WebP: standard canvas toBlob with quality.
     * - PNG: checks for transparency. If transparent, downscale size and save as PNG. If opaque, downscale + JPEG compress -> PNG to save massive space.
     * @param {File} file - The original file.
     * @param {number} quality - 0 to 1 (default 0.7).
     * @returns {Promise<File>} - The compressed file in original format.
     */
    compressImage: async (file, quality = 0.7) => {
        // --- PDF Handling ---
        if (file.type === 'application/pdf') {
            return LTR_Compressor.compressPDF(file, quality);
        }

        // --- Image Handling ---
        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }

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

        // Step 3: Check PNG transparency to route compression strategy
        if (originalType === 'image/png') {
            const hasTransparency = await LTR_Compressor.pngHasTransparency(file);

            if (hasTransparency) {
                // If it has transparency, we CANNOT use JPEG compression since it destroys transparency.
                // Instead, we resize it to reduce file size and export directly as PNG.
                console.log(`[LTR] PNG has transparency. Resizing to ${width}x${height} and exporting as PNG.`);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const finalBlob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png');
                });

                const newFile = new File([finalBlob], originalName, {
                    type: 'image/png',
                    lastModified: Date.now(),
                });

                const reduction = Math.round((1 - newFile.size / file.size) * 100);
                console.log(`[LTR] Compressed Transparent PNG: ${file.size} → ${newFile.size} (${reduction}% smaller)`);
                return newFile;
            } else {
                // If it's an opaque PNG, we can do a JPEG compression roundtrip to save massive space,
                // and then convert it back to PNG so it matches the original format.
                console.log(`[LTR] PNG is opaque. Compressing via JPEG roundtrip.`);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const jpegBlob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/jpeg', quality);
                });

                const compressedImg = await LTR_Compressor.loadImageFromBlob(jpegBlob);

                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = compressedImg.width;
                finalCanvas.height = compressedImg.height;
                const finalCtx = finalCanvas.getContext('2d');
                finalCtx.drawImage(compressedImg, 0, 0);

                const finalBlob = await new Promise(resolve => {
                    finalCanvas.toBlob(resolve, 'image/png');
                });

                const newFile = new File([finalBlob], originalName, {
                    type: 'image/png',
                    lastModified: Date.now(),
                });

                const reduction = Math.round((1 - newFile.size / file.size) * 100);
                console.log(`[LTR] Compressed Opaque PNG: ${file.size} → ${newFile.size} (${reduction}% smaller)`);
                return newFile;
            }
        }

        // Step 4: WebP Handling (WebP supports transparency and lossy quality)
        if (originalType === 'image/webp') {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const finalBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/webp', quality);
            });

            const newFile = new File([finalBlob], originalName, {
                type: 'image/webp',
                lastModified: Date.now(),
            });

            const reduction = Math.round((1 - newFile.size / file.size) * 100);
            console.log(`[LTR] Compressed WebP: ${file.size} → ${newFile.size} (${reduction}% smaller)`);
            return newFile;
        }

        // Step 5: Default JPEG / standard formats
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const jpegBlob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
        });

        const newFile = new File([jpegBlob], originalName, {
            type: originalType,
            lastModified: Date.now(),
        });

        const reduction = Math.round((1 - newFile.size / file.size) * 100);
        console.log(`[LTR] Compressed JPEG: ${file.size} → ${newFile.size} (${reduction}% smaller)`);
        return newFile;
    },

    /**
     * Helper: Fast PNG transparency check by parsing the binary headers.
     * Checks Color Type in IHDR (byte 25) or the presence of a 'tRNS' chunk.
     */
    pngHasTransparency: (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arr = new Uint8Array(e.target.result);
                // Check PNG signature: 0x89, 0x50, 0x4E, 0x47 (137 80 78 71)
                if (arr[0] !== 0x89 || arr[1] !== 0x50 || arr[2] !== 0x4E || arr[3] !== 0x47) {
                    resolve(false);
                    return;
                }
                // Color Type is at byte index 25
                const colorType = arr[25];
                // Color type 4 (Grayscale with alpha) or 6 (Truecolor with alpha)
                if (colorType === 4 || colorType === 6) {
                    resolve(true);
                    return;
                }
                // Search for tRNS chunk in the first 100KB of the file
                const limit = Math.min(arr.length, 100000);
                for (let i = 33; i < limit - 4; i++) {
                    if (arr[i] === 116 && arr[i+1] === 82 && arr[i+2] === 78 && arr[i+3] === 83) { // 'tRNS'
                        resolve(true);
                        return;
                    }
                }
                resolve(false);
            };
            // Read first 100KB
            reader.readAsArrayBuffer(file.slice(0, 100000));
        });
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
     * Helper: Load image from Uint8Array bytes
     */
    loadImageFromBytes: (bytes) => {
        return new Promise((resolve, reject) => {
            const blob = new Blob([bytes], { type: 'image/jpeg' });
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
     * Advanced PDF Compression Iterative
     */
    compressPDFIterative: async (file, targetKB) => {
        let q = 0.8;
        let res = await LTR_Compressor.compressPDF(file, q);
        if (res.size <= targetKB * 1024) return res;
        
        q = 0.5;
        res = await LTR_Compressor.compressPDF(file, q);
        if (res.size <= targetKB * 1024) return res;
        
        q = 0.2;
        return await LTR_Compressor.compressPDF(file, q);
    },

    /**
     * Advanced PDF Compression
     * Finds DCTDecode (JPEG) images, resizes and compresses them via Canvas, and writes them back.
     */
    compressPDF: async (file, quality = 0.7) => {
        console.log('[LTR] PDF Detected. Attempting optimization...');
        try {
            if (typeof PDFLib === 'undefined') {
                throw new Error('PDFLib not loaded');
            }
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

            // Dynamic maxWidth for PDF images based on quality
            let maxWidth;
            if (quality >= 0.85) {
                maxWidth = 2048;
            } else if (quality >= 0.6) {
                maxWidth = 1440;
            } else {
                maxWidth = 960;
            }

            const enumeratedIndirectObjects = pdfDoc.context.enumerateIndirectObjects();
            let imagesProcessed = 0;
            let sizeReduced = 0;

            for (const [pdfRef, pdfObject] of enumeratedIndirectObjects) {
                if (!(pdfObject instanceof PDFLib.PDFRawStream)) continue;

                const { dict } = pdfObject;
                const subtype = dict.get(PDFLib.PDFName.of('Subtype'));
                const filter = dict.get(PDFLib.PDFName.of('Filter'));

                if (subtype === PDFLib.PDFName.of('Image') && filter === PDFLib.PDFName.of('DCTDecode')) {
                    const originalBytes = pdfObject.contents;
                    if (!originalBytes || originalBytes.length === 0) continue;

                    try {
                        const img = await LTR_Compressor.loadImageFromBytes(originalBytes);
                        
                        let width = img.width;
                        let height = img.height;

                        // Only compress if image is larger than maxWidth or if we want to compress it
                        if (width > maxWidth || quality < 0.9) {
                            if (width > maxWidth) {
                                height = Math.round(height * (maxWidth / width));
                                width = maxWidth;
                            }

                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);

                            const compressedBytes = await new Promise(resolve => {
                                canvas.toBlob(blob => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(new Uint8Array(reader.result));
                                    reader.readAsArrayBuffer(blob);
                                }, 'image/jpeg', quality);
                            });

                            if (compressedBytes.length < originalBytes.length) {
                                pdfObject.contents = compressedBytes;
                                dict.set(PDFLib.PDFName.of('Width'), PDFLib.PDFNumber.of(width));
                                dict.set(PDFLib.PDFName.of('Height'), PDFLib.PDFNumber.of(height));
                                dict.set(PDFLib.PDFName.of('Length'), PDFLib.PDFNumber.of(compressedBytes.length));
                                imagesProcessed++;
                                sizeReduced += originalBytes.length - compressedBytes.length;
                            }
                        }
                    } catch (e) {
                        console.warn('[LTR] Failed to compress internal PDF image:', e);
                    }
                }
            }

            console.log(`[LTR] PDF Optimization Complete: Compressed ${imagesProcessed} images, saved ${sizeReduced} bytes.`);

            const pdfBytes = await pdfDoc.save({
                useObjectStreams: true,
                useCompression: true
            });

            const newFile = new File([pdfBytes], file.name, {
                type: 'application/pdf',
                lastModified: Date.now(),
            });

            return newFile;
        } catch (err) {
            console.error('[LTR] PDF Compression Error:', err);
            throw err;
        }
    }
};
