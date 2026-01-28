// ========================================
// APP.JS - Main Application Logic
// ========================================

console.log("🚀 Lost & Found App Loaded!");

// ========================================
// UPDATE STATISTICS ON HOMEPAGE
// ========================================

function updateStatistics() {
    const stats = {
        lostCount: 0,
        foundCount: 0,
        matchCount: 0
    };
    
    document.getElementById('lostCount').textContent = stats.lostCount;
    document.getElementById('foundCount').textContent = stats.foundCount;
    document.getElementById('matchCount').textContent = stats.matchCount;
    
    console.log("📊 Statistics updated:", stats);
}

// ========================================
// ANIMATE NUMBERS (COUNTING UP EFFECT)
// ========================================

function animateNumber(elementId, targetNumber, duration = 1000) {
    const element = document.getElementById(elementId);
    const startNumber = 0;
    const increment = targetNumber / (duration / 16);
    let currentNumber = startNumber;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        
        if (currentNumber >= targetNumber) {
            currentNumber = targetNumber;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(currentNumber);
    }, 16);
}

// ========================================
// RUN WHEN PAGE LOADS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM Content Loaded - Page is ready!");
    
    if (document.getElementById('lostCount')) {
        updateStatistics();
        
        setTimeout(() => {
            animateNumber('lostCount', 15, 1500);
            animateNumber('foundCount', 8, 1500);
            animateNumber('matchCount', 5, 1500);
        }, 500);
    }
});

console.log("✅ All helper functions loaded!");