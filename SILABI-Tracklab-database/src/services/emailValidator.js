const { VerifaliaRestClient } = require('verifalia');

// Initialize Verifalia client
const verifalia = new VerifaliaRestClient({
    username: process.env.VERIFALIA_USERNAME,
    password: process.env.VERIFALIA_PASSWORD
});

/**
 * Validate email address using Verifalia API
 * @param {string} email - Email address to validate
 * @returns {Promise<Object>} Validation result
 */
async function validateEmail(email) {
    try {
        console.log(`Validating email: ${email}`);
        
        const validation = await verifalia.emailValidations.submit(email, {
            quality: 'Standard' // Standard, High, or Extreme
        });
        
        const entry = validation.entries[0];
        
        const result = {
            isValid: entry.status === 'Success',
            status: entry.status,
            email: entry.emailAddress,
            isDisposable: entry.isDisposable || false,
            isFreeEmail: entry.isFreeEmailProvider || false,
            suggestion: entry.suggestion || null
        };
        
        console.log('Validation result:', result);
        return result;
        
    } catch (error) {
        console.error('Verifalia validation error:', error.message);
        
        // If daily limit exceeded or API error, allow registration but log it
        if (error.message.includes('quota') || error.message.includes('limit')) {
            console.warn('Verifalia daily limit reached, skipping validation');
            return { isValid: true, skipped: true, reason: 'quota_exceeded' };
        }
        
        // For other errors, still allow registration
        return { isValid: true, skipped: true, error: error.message };
    }
}

/**
 * Simple email format validation (regex)
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

module.exports = { 
    validateEmail,
    isValidEmailFormat
};