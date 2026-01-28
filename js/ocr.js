// ========================================
// OCR.JS - Super Enhanced OCR for DKUT IDs
// ========================================

console.log("📷 Super Enhanced OCR Module Loaded!");

// Handle upload area click
document.getElementById('uploadArea').addEventListener('click', function() {
    document.getElementById('idImage').click();
});

// Handle file selection
document.getElementById('idImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File is too large! Maximum size is 5MB.');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG, PNG, JPEG)');
            return;
        }
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('uploadArea').style.display = 'none';
            
            // Process with OCR
            processImageWithOCR(e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// Handle remove image
document.getElementById('removeImage').addEventListener('click', function() {
    document.getElementById('idImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('ocrResults').style.display = 'none';
});

// Process image with Tesseract OCR - Super Enhanced
function processImageWithOCR(imageData) {
    console.log("🔍 Starting super enhanced OCR processing...");
    
    // Show processing status
    document.getElementById('processingStatus').style.display = 'block';
    document.getElementById('submitBtn').disabled = true;
    
    // Create an image object for preprocessing
    const img = new Image();
    img.onload = function() {
        // Preprocess the image with more variations
        const preprocessedImages = preprocessImageEnhanced(img);
        
        console.log(`📸 Created ${preprocessedImages.length} preprocessed versions`);
        
        // Try OCR with multiple preprocessing methods and PSM modes
        const ocrPromises = [];
        const psmModes = [3, 6, 11, 12]; // Different page segmentation modes
        
        preprocessedImages.forEach((imageData, imgIndex) => {
            psmModes.forEach(psm => {
                ocrPromises.push(
                    Tesseract.recognize(
                        imageData,
                        'eng',
                        {
                            logger: info => {
                                if (info.status === 'recognizing text') {
                                    console.log(`Pass ${imgIndex + 1}-${psm}: ${Math.round(info.progress * 100)}%`);
                                }
                            },
                            tessedit_pageseg_mode: psm
                        }
                    ).then(result => ({
                        text: result.data.text,
                        confidence: result.data.confidence,
                        psm: psm,
                        imageIndex: imgIndex
                    })).catch(err => {
                        console.log(`Pass ${imgIndex + 1}-${psm} failed:`, err);
                        return null;
                    })
                );
            });
        });
        
        Promise.all(ocrPromises).then(results => {
            // Filter out failed attempts
            const validResults = results.filter(r => r !== null);
            console.log(`✅ ${validResults.length} OCR passes completed successfully!`);
            
            // Log all extracted texts for debugging
            validResults.forEach((result, i) => {
                console.log(`\n=== Pass ${i + 1} (PSM ${result.psm}, Confidence: ${result.confidence.toFixed(1)}%) ===`);
                console.log(result.text);
            });
            
            // Combine all extracted texts
            const allTexts = validResults.map(r => r.text);
            
            // Extract name and registration number using super enhanced patterns
            const extractedData = extractIDDetailsSuperEnhanced(allTexts);
            
            // Display results
            document.getElementById('extractedName').textContent = extractedData.name || 'Not detected';
            document.getElementById('extractedAdmission').textContent = extractedData.admissionNumber || 'Not detected';
            document.getElementById('ocrResults').style.display = 'block';
            
            // Hide processing status
            document.getElementById('processingStatus').style.display = 'none';
            document.getElementById('submitBtn').disabled = false;
            
        }).catch(error => {
            console.error('OCR Error:', error);
            alert('Error processing image. Please try again.');
            document.getElementById('processingStatus').style.display = 'none';
            document.getElementById('submitBtn').disabled = false;
        });
    };
    img.src = imageData;
}

// Enhanced preprocessing with more variations
function preprocessImageEnhanced(img) {
    const preprocessedImages = [];
    
    // Version 1: Original scaled up 2x
    preprocessedImages.push(scaleImage(img, 2));
    
    // Version 2: Scaled up 3x (even larger)
    preprocessedImages.push(scaleImage(img, 3));
    
    // Version 3: High contrast
    preprocessedImages.push(applyFilter(img, 2, 'contrast'));
    
    // Version 4: Very high contrast
    preprocessedImages.push(applyFilter(img, 3, 'contrast'));
    
    // Version 5: Grayscale + threshold
    preprocessedImages.push(applyFilter(img, 2, 'threshold'));
    
    // Version 6: Inverted (sometimes helps)
    preprocessedImages.push(applyFilter(img, 2, 'invert'));
    
    return preprocessedImages;
}

// Scale image
function scaleImage(img, scale) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
}

// Apply various filters
function applyFilter(img, scale, filterType) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    if (filterType === 'contrast') {
        // High contrast
        const factor = 1.8;
        const intercept = 128 * (1 - factor);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
        }
    } else if (filterType === 'threshold') {
        // Grayscale + threshold
        const threshold = 128;
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const binary = gray > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = binary;
        }
    } else if (filterType === 'invert') {
        // Invert colors
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

// Super enhanced extraction with aggressive patterns
function extractIDDetailsSuperEnhanced(allTexts) {
    const result = {
        name: null,
        admissionNumber: null
    };
    
    console.log("\n🔍 Starting super enhanced extraction...");
    
    // ==========================================
    // EXTRACT REGISTRATION NUMBER
    // ==========================================
    
    const regPatterns = [
        // Pattern 1: With label
        /REG\.?\s*NO\.?\s*:?\s*([CS]\d{3,4}[-\s]?\d{2}[-\s]?\d{3,4}\/\d{4})/gi,
        // Pattern 2: Direct C/S format
        /\b([CS]\d{3,4}[-\s]?\d{2}[-\s]?\d{3,4}\/\d{4})\b/g,
        // Pattern 3: More flexible
        /([A-Z]\d{3,4}[-\s]?\d{2}[-\s]?\d{3,4}\/\d{4})/g,
        // Pattern 4: With potential OCR errors (0 vs O)
        /([CS][O0]\d{2,3}[-\s]?[O0]\d[-\s]?[O0]\d{3,4}\/\d{4})/gi
    ];
    
    for (const text of allTexts) {
        if (result.admissionNumber) break;
        
        for (const pattern of regPatterns) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                // Clean up: remove spaces, fix O/0 confusion
                let regNo = matches[0]
                    .replace(/\s+/g, '-')
                    .replace(/O/g, '0')
                    .toUpperCase();
                result.admissionNumber = regNo;
                console.log("✅ Found registration number:", regNo);
                break;
            }
        }
    }
    
    // ==========================================
    // EXTRACT NAME - SUPER AGGRESSIVE
    // ==========================================
    
    const excludeWords = [
        'DEDAN', 'KIMATHI', 'UNIVERSITY', 'TECHNOLOGY', 'STUDENT',
        'IDENTITY', 'CARD', 'FACULTY', 'COURSE', 'DEPARTMENT', 'DEPT',
        'VALIDITY', 'VALID', 'THRU', 'BACHELOR', 'SCIENCE', 'ACTUARIAL',
        'STATISTICS', 'INFORMATION', 'TECH', 'BETTER', 'LIFE', 'THROUGH',
        'MONTHLY', 'YEAR', 'REGISTRATION', 'NUMBER', 'PHOTO', 'NAME'
    ];
    
    const allFoundNames = new Set();
    
    for (const text of allTexts) {
        console.log("\n--- Analyzing text block ---");
        
        // Pattern 1: Explicit NAME: label
        const namePattern1 = /NAME\s*:?\s*([A-Z][A-Z\s]{5,}?)(?=\n|REG|COURSE|DEPT|$)/gi;
        let matches = [...text.matchAll(namePattern1)];
        matches.forEach(match => {
            const name = cleanName(match[1]);
            if (isValidName(name, excludeWords)) {
                allFoundNames.add(name);
                console.log("✅ Found name (Pattern 1 - NAME:):", name);
            }
        });
        
        // Pattern 2: After chip card number (CRITICAL for Version 1)
        // Look for: digits digits digits digits, then NAME on next line(s)
        const chipPattern = /(\d{4}[\s\-\.]*\d{4}[\s\-\.]*\d{4}[\s\-\.]*\d{4})\s*[\r\n]+\s*([A-Z][A-Z\s]{5,50}?)[\r\n]/gi;
        matches = [...text.matchAll(chipPattern)];
        matches.forEach(match => {
            const name = cleanName(match[2]);
            if (isValidName(name, excludeWords)) {
                allFoundNames.add(name);
                console.log("✅ Found name (Pattern 2 - After chip):", name);
            }
        });
        
        // Pattern 3: Look for ALL CAPS lines (2-4 words, each word 3+ chars)
        const lines = text.split(/[\r\n]+/);
        lines.forEach(line => {
            line = line.trim();
            const words = line.split(/\s+/);
            
            // Must be 2-4 words, all uppercase, each 3+ characters
            if (words.length >= 2 && words.length <= 4) {
                if (words.every(w => /^[A-Z]{3,}$/.test(w))) {
                    const name = cleanName(line);
                    if (isValidName(name, excludeWords)) {
                        allFoundNames.add(name);
                        console.log("✅ Found name (Pattern 3 - Caps line):", name);
                    }
                }
            }
        });
        
        // Pattern 4: Between chip number and REG NO
        const betweenPattern = /\d{4}\s+\d{4}\s+\d{4}\s+\d{4}\s*[\r\n]+([\s\S]*?)REG/gi;
        matches = [...text.matchAll(betweenPattern)];
        matches.forEach(match => {
            const betweenText = match[1].trim();
            const betweenLines = betweenText.split(/[\r\n]+/);
            betweenLines.forEach(line => {
                line = line.trim();
                const words = line.split(/\s+/);
                if (words.length >= 2 && words.length <= 4) {
                    if (words.every(w => /^[A-Z]{3,}$/i.test(w))) {
                        const name = cleanName(line);
                        if (isValidName(name, excludeWords)) {
                            allFoundNames.add(name);
                            console.log("✅ Found name (Pattern 4 - Between chip and REG):", name);
                        }
                    }
                }
            });
        });
        
        // Pattern 5: SUPER AGGRESSIVE - Find any sequence of 2-4 capitalized words
        const aggressivePattern = /\b([A-Z]{3,}\s+[A-Z]{3,}(?:\s+[A-Z]{3,})?(?:\s+[A-Z]{3,})?)\b/g;
        matches = [...text.matchAll(aggressivePattern)];
        matches.forEach(match => {
            const name = cleanName(match[1]);
            if (isValidName(name, excludeWords)) {
                allFoundNames.add(name);
                console.log("✅ Found name (Pattern 5 - Aggressive):", name);
            }
        });
    }
    
    // Select best name (longest valid one)
    if (allFoundNames.size > 0) {
        const namesArray = Array.from(allFoundNames);
        console.log("\n📋 All candidate names found:", namesArray);
        
        // Sort by length (longest first) and select
        result.name = namesArray.sort((a, b) => b.length - a.length)[0];
        console.log("🎯 Selected best name:", result.name);
    } else {
        console.log("❌ No valid names found");
    }
    
    console.log("\n📋 Final Extracted Details:", result);
    return result;
}

// Clean name text
function cleanName(name) {
    return name
        .trim()
        .replace(/\s+/g, ' ')  // Multiple spaces to single space
        .replace(/[^A-Z\s]/gi, '')  // Remove non-letters
        .toUpperCase();
}

// Validate if extracted text is a valid name
function isValidName(name, excludeWords) {
    if (!name || name.length < 6) return false;
    
    // Check for excluded words
    for (const word of excludeWords) {
        if (name.includes(word)) {
            return false;
        }
    }
    
    // Split into words
    const words = name.trim().split(/\s+/);
    
    // Must be 2-4 words
    if (words.length < 2 || words.length > 4) {
        return false;
    }
    
    // Each word should be 3-15 characters
    for (const word of words) {
        if (word.length < 3 || word.length > 15) {
            return false;
        }
    }
    
    // Should only contain letters and spaces
    if (!/^[A-Z\s]+$/i.test(name)) {
        return false;
    }
    
    return true;
}

// Handle form submission
document.getElementById('uploadFoundForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        finderName: document.getElementById('finderName').value,
        finderPhone: document.getElementById('finderPhone').value,
        locationFound: document.getElementById('locationFound').value,
        additionalNotes: document.getElementById('additionalNotes').value,
        extractedName: document.getElementById('extractedName').textContent,
        extractedAdmission: document.getElementById('extractedAdmission').textContent,
        uploadDate: new Date().toISOString()
    };
    
    console.log("📤 Form submitted:", formData);
    
    // Show success message
    document.getElementById('successMessage').style.display = 'block';
    this.reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadArea').style.display = 'block';
    document.getElementById('ocrResults').style.display = 'none';
    
    // Scroll to success message
    document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
});

console.log("✅ Super Enhanced OCR handlers initialized!");
console.log("🎯 Features:");
console.log("   • 6 preprocessing variations");
console.log("   • 4 PSM modes per variation = 24 OCR passes");
console.log("   • 5 name extraction patterns");
console.log("   • Aggressive pattern matching for chip card IDs");
console.log("   • Smart name validation and selection");