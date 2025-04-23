module.exports = {
  secret: process.env.JWT_SECRET || "feedback_management_secret_key",
  jwtExpiration: parseInt(process.env.JWT_EXPIRATION) || 604800, // 7 days 
  tokenType: 'Bearer',
  clockTolerance: 60, // 60 seconds of clock tolerance for verification
  algorithm: 'HS256' // Default algorithm
};