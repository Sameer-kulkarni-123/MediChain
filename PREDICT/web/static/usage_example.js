// PREDICT API Usage Examples
// This file shows how to use the predict_api.js to fetch retailers and make predictions

import predictAPI from './predict_api.js';

// Example 1: Get all retailers with their wallet addresses
async function example1_getAllRetailers() {
    console.log("🔍 Example 1: Getting all retailers with wallet addresses");
    
    try {
        const retailers = await predictAPI.getRetailersWithWallets();
        console.log("✅ Retrieved retailers:", retailers);
        
        // Display each retailer's wallet address
        retailers.forEach((retailer, index) => {
            console.log(`Retailer ${index + 1}:`);
            console.log(`  Wallet: ${retailer.walletAddress}`);
            console.log(`  Name: ${retailer.name}`);
            console.log(`  Location: ${retailer.location}`);
            console.log(`  Certificate: ${retailer.certificate}`);
            console.log("---");
        });
        
        return retailers;
    } catch (error) {
        console.error("❌ Error getting retailers:", error);
        return [];
    }
}

// Example 2: Get predictions for a specific retailer by wallet address
async function example2_getRetailerPredictions(walletAddress) {
    console.log(`🔍 Example 2: Getting predictions for retailer ${walletAddress}`);
    
    try {
        // Get detailed analysis for this retailer
        const analysis = await predictAPI.getDetailedPredictionAnalysis(walletAddress);
        
        if (analysis.error) {
            console.error("❌ Error in analysis:", analysis.error);
            return null;
        }
        
        console.log("✅ Retailer Analysis:", {
            retailer: analysis.retailer,
            totalProducts: analysis.totalProducts,
            totalRecommendations: analysis.totalRecommendations,
            criticalAlerts: analysis.criticalAlerts,
            urgencyBreakdown: analysis.urgencyBreakdown
        });
        
        // Show recommendations
        if (analysis.recommendations.length > 0) {
            console.log("📊 Recommendations:");
            analysis.recommendations.forEach((rec, index) => {
                console.log(`  ${index + 1}. ${rec.product_name}`);
                console.log(`     Current: ${rec.current_stock} → Recommended: ${rec.recommended_quantity}`);
                console.log(`     Urgency: ${rec.urgency_level} (${rec.days_until_depletion} days)`);
                console.log(`     Reasoning: ${rec.reasoning}`);
                console.log("---");
            });
        }
        
        return analysis;
    } catch (error) {
        console.error("❌ Error getting predictions:", error);
        return null;
    }
}

// Example 3: Get predictions for all retailers
async function example3_getAllPredictions() {
    console.log("🔍 Example 3: Getting predictions for all retailers");
    
    try {
        const predictions = await predictAPI.getPredictionsForAllRetailers();
        
        console.log("✅ Predictions Summary:", {
            totalRetailers: predictions.totalRetailers,
            timestamp: predictions.timestamp
        });
        
        // Show predictions for each retailer
        Object.entries(predictions.predictions).forEach(([wallet, prediction]) => {
            console.log(`\n🏪 Retailer: ${prediction.retailer.name} (${wallet.substring(0, 8)}...)`);
            console.log(`   Location: ${prediction.retailer.location}`);
            console.log(`   Recommendations: ${prediction.totalRecommendations}`);
            console.log(`   Critical Alerts: ${prediction.criticalAlerts}`);
            
            if (prediction.recommendations.length > 0) {
                console.log("   📋 Top Recommendations:");
                prediction.recommendations.slice(0, 3).forEach((rec, index) => {
                    console.log(`     ${index + 1}. ${rec.product_name} (${rec.urgency_level})`);
                });
            }
        });
        
        return predictions;
    } catch (error) {
        console.error("❌ Error getting all predictions:", error);
        return null;
    }
}

// Example 4: Check if a retailer needs immediate restock
async function example4_checkRestockNeeds(walletAddress) {
    console.log(`🔍 Example 4: Checking restock needs for ${walletAddress}`);
    
    try {
        const needsRestock = await predictAPI.needsImmediateRestock(walletAddress);
        
        if (needsRestock) {
            console.log("🚨 URGENT: This retailer needs immediate restock!");
            
            // Get the alerts to see what's needed
            const alerts = await predictAPI.getRetailerAlerts(walletAddress);
            console.log("📋 Critical Alerts:", alerts.data.alerts);
        } else {
            console.log("✅ This retailer has adequate stock levels");
        }
        
        return needsRestock;
    } catch (error) {
        console.error("❌ Error checking restock needs:", error);
        return false;
    }
}

// Example 5: Get summary statistics
async function example5_getSummary() {
    console.log("🔍 Example 5: Getting prediction summary statistics");
    
    try {
        const summary = await predictAPI.getPredictionSummary();
        
        console.log("📊 Prediction Summary:", {
            totalRetailers: summary.totalRetailers,
            totalRecommendations: summary.totalRecommendations,
            criticalAlerts: summary.criticalAlerts,
            urgencyBreakdown: summary.urgencyBreakdown,
            averageRecommendationsPerRetailer: summary.averageRecommendationsPerRetailer,
            retailersWithAlerts: summary.retailersWithAlerts
        });
        
        return summary;
    } catch (error) {
        console.error("❌ Error getting summary:", error);
        return null;
    }
}

// Example 6: Process batch predictions for multiple retailers
async function example6_batchPredictions(walletAddresses) {
    console.log("🔍 Example 6: Processing batch predictions");
    
    try {
        const results = await predictAPI.processBatchPredictions(walletAddresses);
        
        console.log("✅ Batch Processing Results:", {
            totalProcessed: results.totalProcessed,
            successful: results.successful,
            failed: results.failed
        });
        
        // Show results for each wallet
        Object.entries(results.results).forEach(([wallet, result]) => {
            if (result.error) {
                console.log(`❌ ${wallet.substring(0, 8)}...: ${result.error}`);
            } else {
                console.log(`✅ ${wallet.substring(0, 8)}...: ${result.totalRecommendations} recommendations, ${result.criticalAlerts} alerts`);
            }
        });
        
        return results;
    } catch (error) {
        console.error("❌ Error in batch processing:", error);
        return null;
    }
}

// Example 7: Complete workflow - Get retailers and make predictions
async function example7_completeWorkflow() {
    console.log("🚀 Example 7: Complete workflow - Get retailers and make predictions");
    
    try {
        // Step 1: Check system health
        console.log("Step 1: Checking system health...");
        const health = await predictAPI.getSystemStatus();
        console.log("System Status:", health);
        
        if (health.status === 'unhealthy') {
            console.error("❌ System is unhealthy, cannot proceed");
            return;
        }
        
        // Step 2: Get all retailers
        console.log("\nStep 2: Getting all retailers...");
        const retailers = await predictAPI.getRetailersWithWallets();
        console.log(`Found ${retailers.length} retailers`);
        
        if (retailers.length === 0) {
            console.log("❌ No retailers found");
            return;
        }
        
        // Step 3: Get predictions for each retailer
        console.log("\nStep 3: Getting predictions for each retailer...");
        const predictions = {};
        
        for (const retailer of retailers) {
            console.log(`Processing ${retailer.name} (${retailer.walletAddress.substring(0, 8)}...)`);
            
            const analysis = await predictAPI.getDetailedPredictionAnalysis(retailer.walletAddress);
            predictions[retailer.walletAddress] = analysis;
            
            if (analysis.error) {
                console.log(`  ❌ Error: ${analysis.error}`);
            } else {
                console.log(`  ✅ ${analysis.totalRecommendations} recommendations, ${analysis.criticalAlerts} alerts`);
            }
        }
        
        // Step 4: Get summary
        console.log("\nStep 4: Getting summary statistics...");
        const summary = await predictAPI.getPredictionSummary();
        console.log("Summary:", summary);
        
        // Step 5: Identify urgent cases
        console.log("\nStep 5: Identifying urgent cases...");
        const urgentRetailers = [];
        
        for (const retailer of retailers) {
            const needsRestock = await predictAPI.needsImmediateRestock(retailer.walletAddress);
            if (needsRestock) {
                urgentRetailers.push(retailer);
                console.log(`🚨 ${retailer.name} needs immediate restock!`);
            }
        }
        
        console.log(`\n🎯 Workflow Complete!`);
        console.log(`   Total retailers processed: ${retailers.length}`);
        console.log(`   Retailers needing urgent restock: ${urgentRetailers.length}`);
        console.log(`   Total recommendations generated: ${summary.totalRecommendations}`);
        console.log(`   Critical alerts: ${summary.criticalAlerts}`);
        
        return {
            retailers,
            predictions,
            summary,
            urgentRetailers
        };
        
    } catch (error) {
        console.error("❌ Error in complete workflow:", error);
        return null;
    }
}

// Export all examples for use in other files
export {
    example1_getAllRetailers,
    example2_getRetailerPredictions,
    example3_getAllPredictions,
    example4_checkRestockNeeds,
    example5_getSummary,
    example6_batchPredictions,
    example7_completeWorkflow
};

// Example usage in browser console:
/*
// Import and run examples
import { example1_getAllRetailers, example7_completeWorkflow } from './usage_example.js';

// Get all retailers
const retailers = await example1_getAllRetailers();

// Run complete workflow
const results = await example7_completeWorkflow();

// Get predictions for a specific retailer
if (retailers.length > 0) {
    const firstRetailer = retailers[0];
    const predictions = await example2_getRetailerPredictions(firstRetailer.walletAddress);
}
*/ 