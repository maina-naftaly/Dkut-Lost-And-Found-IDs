// ========================================
// MATCHING.JS - ID Matching Algorithm
// ========================================

console.log("🔍 Matching Module Loaded!");

import { 
    db, 
    collection, 
    getDocs, 
    query, 
    where, 
    updateDoc, 
    doc 
} from './firebase-config.js';

// ========================================
// MATCHING ALGORITHM
// ========================================

/**
 * Find potential matches between lost and found IDs
 * @param {string} lostID - The lost ID registration number
 * @param {string} studentName - The student's name
 * @returns {Promise<Array>} Array of potential matches
 */
async function findPotentialMatches(lostID, studentName) {
    console.log("🎯 Starting matching algorithm for:", lostID, studentName);
    
    try {
        // Query found items that haven't been matched yet
        const foundQuery = query(
            collection(db, 'foundItems'),
            where('matched', '==', false)
        );
        
        const foundSnapshot = await getDocs(foundQuery);
        const potentialMatches = [];
        
        foundSnapshot.forEach(doc => {
            const foundData = doc.data();
            const matchScore = calculateMatchScore(lostID, studentName, foundData);
            
            if (matchScore > 0) {
                potentialMatches.push({
                    id: doc.id,
                    ...foundData,
                    matchScore: matchScore,
                    matchConfidence: getConfidenceLevel(matchScore)
                });
            }
        });
        
        // Sort by match score (highest first)
        potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
        
        console.log(`✅ Found ${potentialMatches.length} potential matches`);
        return potentialMatches;
        
    } catch (error) {
        console.error('❌ Error finding matches:', error);
        return [];
    }
}

/**
 * Calculate match score between lost ID and found item
 * @param {string} lostID - Lost registration number
 * @param {string} studentName - Student name
 * @param {Object} foundData - Found item data
 * @returns {number} Match score (0-100)
 */
function calculateMatchScore(lostID, studentName, foundData) {
    let score = 0;
    
    // Exact registration number match (highest priority)
    if (foundData.extractedAdmission && lostID) {
        if (foundData.extractedAdmission.toLowerCase() === lostID.toLowerCase()) {
            score += 80;
        } else if (foundData.extractedAdmission.toLowerCase().includes(lostID.toLowerCase()) || 
                   lostID.toLowerCase().includes(foundData.extractedAdmission.toLowerCase())) {
            score += 50;
        }
    }
    
    // Name matching
    if (foundData.extractedName && studentName) {
        const cleanFoundName = cleanName(foundData.extractedName);
        const cleanLostName = cleanName(studentName);
        
        if (cleanFoundName === cleanLostName) {
            score += 70;
        } else if (cleanFoundName.includes(cleanLostName) || cleanLostName.includes(cleanFoundName)) {
            score += 40;
        } else if (calculateNameSimilarity(cleanFoundName, cleanLostName) > 0.7) {
            score += 30;
        }
    }
    
    // Partial matches for registration numbers
    if (foundData.extractedAdmission && lostID) {
        const foundParts = foundData.extractedAdmission.split('/');
        const lostParts = lostID.split('/');
        
        // Match first part (e.g., "J17")
        if (foundParts[0] && lostParts[0] && foundParts[0] === lostParts[0]) {
            score += 20;
        }
        
        // Match year part
        if (foundParts[2] && lostParts[2] && foundParts[2] === lostParts[2]) {
            score += 15;
        }
    }
    
    return Math.min(score, 100); // Cap at 100
}

/**
 * Clean and normalize name for comparison
 * @param {string} name - Raw name string
 * @returns {string} Cleaned name
 */
function cleanName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Multiple spaces to single space
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\b(mr|ms|mrs|dr)\b/g, '') // Remove titles
        .trim();
}

/**
 * Calculate similarity between two names using Levenshtein distance
 * @param {string} name1 - First name
 * @param {string} name2 - Second name
 * @returns {number} Similarity score (0-1)
 */
function calculateNameSimilarity(name1, name2) {
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = calculateLevenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Distance
 */
function calculateLevenshteinDistance(a, b) {
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[b.length][a.length];
}

/**
 * Get confidence level based on match score
 * @param {number} score - Match score
 * @returns {string} Confidence level
 */
function getConfidenceLevel(score) {
    if (score >= 80) return 'Very High';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
}

/**
 * Mark a found item as matched with a lost ID
 * @param {string} foundItemId - Found item document ID
 * @param {string} lostItemId - Lost item document ID
 * @param {string} studentId - Student document ID
 * @returns {Promise<boolean>} Success status
 */
async function confirmMatch(foundItemId, lostItemId, studentId) {
    console.log("🤝 Confirming match between:", foundItemId, lostItemId);
    
    try {
        // Update found item as matched
        await updateDoc(doc(db, 'foundItems', foundItemId), {
            matched: true,
            matchedWith: lostItemId,
            matchedAt: new Date().toISOString(),
            matchedBy: studentId
        });
        
        // Update lost item as found
        await updateDoc(doc(db, 'lostItems', lostItemId), {
            found: true,
            foundAt: new Date().toISOString(),
            matchedWith: foundItemId
        });
        
        // Update student record
        await updateDoc(doc(db, 'students', studentId), {
            hasLostID: false,
            idFound: true,
            idFoundAt: new Date().toISOString()
        });
        
        console.log("✅ Match confirmed successfully!");
        return true;
        
    } catch (error) {
        console.error('❌ Error confirming match:', error);
        return false;
    }
}

/**
 * Get all matches for a student
 * @param {string} studentId - Student document ID
 * @returns {Promise<Array>} Array of matches
 */
async function getStudentMatches(studentId) {
    try {
        const matchesQuery = query(
            collection(db, 'foundItems'),
            where('matchedBy', '==', studentId)
        );
        
        const matchesSnapshot = await getDocs(matchesQuery);
        const matches = [];
        
        matchesSnapshot.forEach(doc => {
            matches.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return matches;
        
    } catch (error) {
        console.error('❌ Error getting student matches:', error);
        return [];
    }
}

/**
 * Get statistics for dashboard
 * @returns {Promise<Object>} Statistics object
 */
async function getMatchingStatistics() {
    try {
        const [lostSnapshot, foundSnapshot, matchedSnapshot] = await Promise.all([
            getDocs(collection(db, 'lostItems')),
            getDocs(collection(db, 'foundItems')),
            getDocs(query(collection(db, 'foundItems'), where('matched', '==', true)))
        ]);
        
        return {
            totalLost: lostSnapshot.size,
            totalFound: foundSnapshot.size,
            totalMatched: matchedSnapshot.size,
            successRate: foundSnapshot.size > 0 ? 
                (matchedSnapshot.size / foundSnapshot.size * 100).toFixed(1) : 0
        };
        
    } catch (error) {
        console.error('❌ Error getting statistics:', error);
        return {
            totalLost: 0,
            totalFound: 0,
            totalMatched: 0,
            successRate: 0
        };
    }
}

// ========================================
// REAL-TIME MATCHING LISTENERS
// ========================================

/**
 * Set up real-time listener for new found items that might match a lost ID
 * @param {string} studentId - Student ID to monitor for
 * @param {Function} callback - Callback when new potential match found
 */
function setupMatchListener(studentId, callback) {
    console.log("👂 Setting up real-time match listener for student:", studentId);
    
    // This would typically use onSnapshot for real-time updates
    // For now, we'll simulate with periodic checks
    setInterval(async () => {
        try {
            // Get student data to check for lost ID
            const studentQuery = query(
                collection(db, 'students'),
                where('__name__', '==', studentId)
            );
            
            const studentSnapshot = await getDocs(studentQuery);
            
            if (!studentSnapshot.empty) {
                const studentData = studentSnapshot.docs[0].data();
                
                if (studentData.hasLostID) {
                    const matches = await findPotentialMatches(
                        studentData.regNumber, 
                        studentData.fullName
                    );
                    
                    if (matches.length > 0) {
                        callback(matches);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error in match listener:', error);
        }
    }, 30000); // Check every 30 seconds
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

export {
    findPotentialMatches,
    confirmMatch,
    getStudentMatches,
    getMatchingStatistics,
    setupMatchListener,
    calculateMatchScore,
    getConfidenceLevel
};

console.log("✅ Matching functions exported successfully!");