/**
 * OTP Utility Functions
 * Handles OTP generation and validation
 */

/**
 * Generate a random 5-digit OTP
 * @returns {string} 5-digit OTP
 */
const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

/**
 * Generate OTP expiry time
 * @param {number} minutesFromNow - Number of minutes from now when OTP expires
 * @returns {Date} Expiry datetime
 */
const getOTPExpiry = (minutesFromNow = 10) => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + minutesFromNow);
  return expiryTime;
};

/**
 * Check if OTP has expired
 * @param {Date} expiryTime - OTP expiry time
 * @returns {boolean} true if expired, false otherwise
 */
const isOTPExpired = (expiryTime) => {
  return new Date() > expiryTime;
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  isOTPExpired
};
