import axios from "axios";

/* ==============================
   PREDICT API Base URLs
============================== */
const PREDICT_BASE = "http://localhost:5000/api";
const HEALTH_ENDPOINT = `${PREDICT_BASE}/health`;
const RETAILERS_ENDPOINT = `${PREDICT_BASE}/retailers`;
const RECOMMENDATIONS_ENDPOINT = `${PREDICT_BASE}/recommendations`;
const ALERTS_ENDPOINT = `${PREDICT_BASE}/alerts`;

/* ==============================
   HEALTH & SYSTEM FUNCTIONS
============================== */

/**
 * Check system health and MongoDB connection
 * @returns {Promise} Axios response with health status
 */
export const checkSystemHealth = () => axios.get(HEALTH_ENDPOINT);

/**
 * Get system status and connection information
 * @returns {Promise} Axios response with detailed system info
 */
export const getSystemStatus = async () => {
  try {
    const response = await checkSystemHealth();
    return {
      status: "healthy",
      data: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/* ==============================
   RETAILER FUNCTIONS
============================== */

/**
 * Get all retailers from MongoDB
 * @returns {Promise} Axios response with retailers list
 */
export const getAllRetailers = () => axios.get(RETAILERS_ENDPOINT);

/**
 * Get specific retailer by wallet address
 * @param {string} walletAddress - Retailer wallet address
 * @returns {Promise} Axios response with retailer details
 */
export const getRetailerByWallet = (walletAddress) => 
  axios.get(`${PREDICT_BASE}/retailer/${walletAddress}`);

/**
 * Get inventory for a specific retailer
 * @param {string} walletAddress - Retailer wallet address
 * @returns {Promise} Axios response with inventory data
 */
export const getRetailerInventory = (walletAddress) => 
  axios.get(`${PREDICT_BASE}/retailer/${walletAddress}/inventory`);

/**
 * Get all retailers with their wallet addresses
 * @returns {Promise<Array>} Array of retailers with wallet addresses
 */
export const getRetailersWithWallets = async () => {
  try {
    const response = await getAllRetailers();
    const retailers = response.data.retailers || [];
    
    return retailers.map(retailer => ({
      walletAddress: retailer.walletAddress,
      name: retailer.name,
      location: retailer.location,
      certificate: retailer.certificate,
      type: retailer.type
    }));
  } catch (error) {
    console.error("Error fetching retailers:", error);
    return [];
  }
};

/* ==============================
   PREDICTION FUNCTIONS
============================== */

/**
 * Get restock recommendations for a specific retailer
 * @param {string} walletAddress - Retailer wallet address
 * @returns {Promise} Axios response with recommendations
 */
export const getRetailerRecommendations = (walletAddress) => 
  axios.get(`${PREDICT_BASE}/retailer/${walletAddress}/recommendations`);

/**
 * Get critical alerts for a specific retailer
 * @param {string} walletAddress - Retailer wallet address
 * @returns {Promise} Axios response with alerts
 */
export const getRetailerAlerts = (walletAddress) => 
  axios.get(`${PREDICT_BASE}/retailer/${walletAddress}/alerts`);

/**
 * Get all recommendations across all retailers
 * @returns {Promise} Axios response with all recommendations
 */
export const getAllRecommendations = () => axios.get(RECOMMENDATIONS_ENDPOINT);

/**
 * Get all critical alerts across all retailers
 * @returns {Promise} Axios response with all alerts
 */
export const getAllAlerts = () => axios.get(ALERTS_ENDPOINT);

/**
 * Get predictions for all retailers with their wallet addresses
 * @returns {Promise<Object>} Object with retailers and their predictions
 */
export const getPredictionsForAllRetailers = async () => {
  try {
    // Get all retailers
    const retailersResponse = await getAllRetailers();
    const retailers = retailersResponse.data.retailers || [];
    
    const predictions = {};
    
    // Get predictions for each retailer
    for (const retailer of retailers) {
      const walletAddress = retailer.walletAddress;
      
      try {
        // Get recommendations for this retailer
        const recommendationsResponse = await getRetailerRecommendations(walletAddress);
        const recommendations = recommendationsResponse.data.recommendations || [];
        
        // Get alerts for this retailer
        const alertsResponse = await getRetailerAlerts(walletAddress);
        const alerts = alertsResponse.data.alerts || [];
        
        predictions[walletAddress] = {
          retailer: retailer,
          recommendations: recommendations,
          alerts: alerts,
          totalRecommendations: recommendations.length,
          criticalAlerts: alerts.length
        };
      } catch (error) {
        console.error(`Error getting predictions for ${walletAddress}:`, error);
        predictions[walletAddress] = {
          retailer: retailer,
          recommendations: [],
          alerts: [],
          totalRecommendations: 0,
          criticalAlerts: 0,
          error: error.message
        };
      }
    }
    
    return {
      retailers: retailers,
      predictions: predictions,
      totalRetailers: retailers.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting predictions for all retailers:", error);
    return {
      retailers: [],
      predictions: {},
      totalRetailers: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get detailed prediction analysis for a specific retailer
 * @param {string} walletAddress - Retailer wallet address
 * @returns {Promise<Object>} Detailed prediction analysis
 */
export const getDetailedPredictionAnalysis = async (walletAddress) => {
  try {
    // Get retailer info
    const retailerResponse = await getRetailerByWallet(walletAddress);
    const retailer = retailerResponse.data;
    
    // Get inventory
    const inventoryResponse = await getRetailerInventory(walletAddress);
    const inventory = inventoryResponse.data.inventory || {};
    
    // Get recommendations
    const recommendationsResponse = await getRetailerRecommendations(walletAddress);
    const recommendations = recommendationsResponse.data.recommendations || [];
    
    // Get alerts
    const alertsResponse = await getRetailerAlerts(walletAddress);
    const alerts = alertsResponse.data.alerts || [];
    
    // Analyze urgency levels
    const urgencyBreakdown = {
      high: recommendations.filter(r => r.urgency_level === 'high').length,
      medium: recommendations.filter(r => r.urgency_level === 'medium').length,
      low: recommendations.filter(r => r.urgency_level === 'low').length
    };
    
    return {
      retailer: retailer,
      inventory: inventory,
      recommendations: recommendations,
      alerts: alerts,
      urgencyBreakdown: urgencyBreakdown,
      totalProducts: Object.keys(inventory).length,
      totalRecommendations: recommendations.length,
      criticalAlerts: alerts.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error getting detailed analysis for ${walletAddress}:`, error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/* ==============================
   UTILITY FUNCTIONS
============================== */

/**
 * Check if a retailer needs immediate restock (high urgency alerts)
 * @param {string} walletAddress - Retailer wallet address
 * @returns {Promise<boolean>} True if immediate restock needed
 */
export const needsImmediateRestock = async (walletAddress) => {
  try {
    const alertsResponse = await getRetailerAlerts(walletAddress);
    const alerts = alertsResponse.data.alerts || [];
    return alerts.length > 0;
  } catch (error) {
    console.error(`Error checking restock needs for ${walletAddress}:`, error);
    return false;
  }
};

/**
 * Get summary statistics for all retailers
 * @returns {Promise<Object>} Summary statistics
 */
export const getPredictionSummary = async () => {
  try {
    const allRecommendationsResponse = await getAllRecommendations();
    const allRecommendations = allRecommendationsResponse.data.recommendations || [];
    
    const allAlertsResponse = await getAllAlerts();
    const allAlerts = allAlertsResponse.data.alerts || [];
    
    const retailersResponse = await getAllRetailers();
    const retailers = retailersResponse.data.retailers || [];
    
    const urgencyBreakdown = {
      high: allRecommendations.filter(r => r.urgency_level === 'high').length,
      medium: allRecommendations.filter(r => r.urgency_level === 'medium').length,
      low: allRecommendations.filter(r => r.urgency_level === 'low').length
    };
    
    return {
      totalRetailers: retailers.length,
      totalRecommendations: allRecommendations.length,
      criticalAlerts: allAlerts.length,
      urgencyBreakdown: urgencyBreakdown,
      averageRecommendationsPerRetailer: retailers.length > 0 ? 
        (allRecommendations.length / retailers.length).toFixed(2) : 0,
      retailersWithAlerts: allAlerts.length > 0 ? 
        new Set(allAlerts.map(alert => alert.retailer_wallet)).size : 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting prediction summary:", error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/* ==============================
   BATCH OPERATIONS
============================== */

/**
 * Process predictions for multiple retailers
 * @param {Array<string>} walletAddresses - Array of retailer wallet addresses
 * @returns {Promise<Object>} Predictions for all specified retailers
 */
export const processBatchPredictions = async (walletAddresses) => {
  const results = {};
  
  for (const walletAddress of walletAddresses) {
    try {
      const analysis = await getDetailedPredictionAnalysis(walletAddress);
      results[walletAddress] = analysis;
    } catch (error) {
      results[walletAddress] = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  return {
    results: results,
    totalProcessed: walletAddresses.length,
    successful: Object.values(results).filter(r => !r.error).length,
    failed: Object.values(results).filter(r => r.error).length,
    timestamp: new Date().toISOString()
  };
};

export default {
  // Health functions
  checkSystemHealth,
  getSystemStatus,
  
  // Retailer functions
  getAllRetailers,
  getRetailerByWallet,
  getRetailerInventory,
  getRetailersWithWallets,
  
  // Prediction functions
  getRetailerRecommendations,
  getRetailerAlerts,
  getAllRecommendations,
  getAllAlerts,
  getPredictionsForAllRetailers,
  getDetailedPredictionAnalysis,
  
  // Utility functions
  needsImmediateRestock,
  getPredictionSummary,
  processBatchPredictions
}; 