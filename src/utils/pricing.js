const prisma = require('./prisma');

/**
 * Pricing Utility
 * Handles all pricing calculations including tiers and rules
 * 
 * PRICING SYSTEM OVERVIEW:
 * 
 * 1. PRICING TIERS (Volume-based pricing)
 *    - Each product has pricing tiers (e.g., 1-5 units: $15, 6-12 units: $13.50)
 *    - The system automatically selects the correct price based on quantity
 *    - Uses the unitPrice from the matching tier, not the basePrice
 * 
 * 2. PRICING RULES (Platform-wide fees)
 *    - Shipping Cost: FIXED fee applied to all orders
 *    - Customization Fee: FIXED or PERCENTAGE fee when customization is present
 *    - Printing Fee: PERCENTAGE fee applied to subtotal
 * 
 * 3. CALCULATION FLOW:
 *    a. Calculate each item's price using pricing tiers
 *    b. Sum all items to get subtotal
 *    c. Apply Customization Fee (if applicable)
 *    d. Apply Printing Fee (percentage of subtotal)
 *    e. Add Shipping Cost
 *    f. Calculate final total
 * 
 * USAGE:
 *   const { calculateOrderPricing } = require('./pricing');
 *   const pricing = await calculateOrderPricing(cartItems, { hasCustomization: true });
 */

/**
 * Get the correct unit price based on quantity and pricing tiers
 * @param {Array} pricingTiers - Array of pricing tier objects
 * @param {number} quantity - Quantity being ordered
 * @param {number} basePrice - Fallback base price if no tiers match
 * @returns {number} The unit price for the given quantity
 */
const getUnitPriceForQuantity = (pricingTiers, quantity, basePrice) => {
  if (!pricingTiers || pricingTiers.length === 0) {
    return parseFloat(basePrice);
  }

  // Sort tiers by minQuantity ascending
  const sortedTiers = [...pricingTiers].sort((a, b) => a.minQuantity - b.minQuantity);

  // Find the appropriate tier for the quantity
  for (const tier of sortedTiers) {
    const meetsMinimum = quantity >= tier.minQuantity;
    const meetsMaximum = tier.maxQuantity === null || quantity <= tier.maxQuantity;

    if (meetsMinimum && meetsMaximum) {
      return parseFloat(tier.unitPrice);
    }
  }

  // If no tier matches, use the base price
  return parseFloat(basePrice);
};

/**
 * Calculate item subtotal with tiered pricing
 * @param {Object} product - Product object with pricingTiers
 * @param {number} quantity - Quantity being ordered
 * @returns {Object} Calculation breakdown { unitPrice, itemSubtotal }
 */
const calculateItemPrice = (product, quantity) => {
  const unitPrice = getUnitPriceForQuantity(
    product.pricingTiers,
    quantity,
    product.basePrice
  );

  const itemSubtotal = unitPrice * quantity;

  return {
    unitPrice,
    itemSubtotal,
    quantity
  };
};

/**
 * Fetch all active pricing rules
 * @returns {Promise<Array>} Array of active pricing rules sorted by priority
 */
const getPricingRules = async () => {
  try {
    const rules = await prisma.pricingRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' } // Lower priority number = applied first
    });
    
    return rules;
  } catch (error) {
    console.error('Failed to fetch pricing rules:', error);
    return [];
  }
};

/**
 * Check if a pricing rule's conditions are met for order-level context
 * @param {Object} rule - Pricing rule with conditions
 * @param {Object} context - Context object with order/cart data
 * @returns {boolean} True if conditions are met
 */
const checkRuleConditions = (rule, context) => {
  if (!rule.conditions) return true;
  
  const conditions = rule.conditions;
  
  if (conditions.hasCustomization !== undefined) {
    if (context.hasCustomization !== conditions.hasCustomization) {
      return false;
    }
  }
  
  if (conditions.minQuantity !== undefined) {
    if (context.totalQuantity < conditions.minQuantity) {
      return false;
    }
  }
  
  if (conditions.maxQuantity !== undefined) {
    if (context.totalQuantity > conditions.maxQuantity) {
      return false;
    }
  }
  
  if (conditions.minAmount !== undefined) {
    if (context.subTotal < conditions.minAmount) {
      return false;
    }
  }
  
  if (conditions.maxAmount !== undefined) {
    if (context.subTotal > conditions.maxAmount) {
      return false;
    }
  }
  
  if (conditions.minItems !== undefined) {
    if (context.itemCount < conditions.minItems) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if a pricing rule's conditions are met for a specific item
 * @param {Object} rule - Pricing rule with conditions
 * @param {Object} item - Cart item object
 * @returns {boolean} True if conditions are met
 */
const checkItemRuleConditions = (rule, item) => {
  if (!rule.conditions) return true;
  
  const conditions = rule.conditions;
  
  if (conditions.hasCustomization !== undefined) {
    const itemHasCustomization = item.customizationDetails && 
                                Object.keys(item.customizationDetails).length > 0;
    if (itemHasCustomization !== conditions.hasCustomization) {
      return false;
    }
  }
  
  return true;
};

/**
 * Apply a pricing rule to an amount
 * @param {number} amount - Base amount
 * @param {Object} rule - Pricing rule { type, value }
 * @returns {number} Calculated fee
 */
const applyPricingRule = (amount, rule) => {
  if (!rule) return 0;

  if (rule.type === 'FIXED') {
    return rule.value;
  } else if (rule.type === 'PERCENTAGE') {
    return (amount * rule.value) / 100;
  }

  return 0;
};

/**
 * Calculate complete order pricing with all fees
 * @param {Array} cartItems - Array of cart items with product and quantity
 * @param {Object} customizationInfo - Info about customizations { hasCustomization }
 * @returns {Promise<Object>} Complete pricing breakdown
 */
const calculateOrderPricing = async (cartItems, customizationInfo = {}) => {
  try {
    const rules = await getPricingRules();
    
    let subTotal = 0;
    const itemBreakdown = [];
    let totalQuantity = 0;

    for (const item of cartItems) {
      const { unitPrice, itemSubtotal, quantity } = calculateItemPrice(
        item.product,
        item.quantity
      );

      itemBreakdown.push({
        productId: item.product.id,
        productName: item.product.name,
        quantity,
        unitPrice,
        itemSubtotal
      });

      subTotal += itemSubtotal;
      totalQuantity += quantity;
    }

    const context = {
      subTotal,
      totalQuantity,
      itemCount: cartItems.length,
      hasCustomization: customizationInfo.hasCustomization || false
    };

    const appliedFees = [];
    let additionalFees = 0;

    for (const rule of rules) {
      if (!checkRuleConditions(rule, context)) {
        continue;
      }

      let feeAmount = 0;
      const ruleValue = parseFloat(rule.value);

      switch (rule.application) {
        case 'PER_ORDER':
          if (rule.type === 'FIXED') {
            feeAmount = ruleValue;
          } else if (rule.type === 'PERCENTAGE') {
            feeAmount = (subTotal * ruleValue) / 100;
          }
          break;

        case 'PER_ITEM':
          if (rule.type === 'FIXED') {
            for (const item of cartItems) {
              if (checkItemRuleConditions(rule, item)) {
                feeAmount += ruleValue * item.quantity;
              }
            }
          } else if (rule.type === 'PERCENTAGE') {
            for (const item of cartItems) {
              if (checkItemRuleConditions(rule, item)) {
                const { unitPrice } = calculateItemPrice(item.product, item.quantity);
                feeAmount += (unitPrice * item.quantity * ruleValue) / 100;
              }
            }
          }
          break;

        case 'ON_SUBTOTAL':
          if (rule.type === 'FIXED') {
            feeAmount = ruleValue;
          } else if (rule.type === 'PERCENTAGE') {
            feeAmount = (subTotal * ruleValue) / 100;
          }
          break;

        case 'CONDITIONAL':
          if (rule.type === 'FIXED') {
            feeAmount = ruleValue;
          } else if (rule.type === 'PERCENTAGE') {
            if (rule.scope === 'SUBTOTAL') {
              feeAmount = (subTotal * ruleValue) / 100;
            } else if (rule.scope === 'TOTAL_QUANTITY') {
              feeAmount = ruleValue * totalQuantity;
            }
          }
          break;

        default:
          console.warn(`Unknown application type: ${rule.application}`);
      }

      if (feeAmount > 0) {
        appliedFees.push({
          ruleName: rule.name,
          ruleType: rule.type,
          application: rule.application,
          amount: parseFloat(feeAmount.toFixed(2))
        });
        additionalFees += feeAmount;
      }
    }

    const totalAmount = subTotal + additionalFees;

    return {
      itemBreakdown,
      subTotal: parseFloat(subTotal.toFixed(2)),
      appliedFees,
      totalFees: parseFloat(additionalFees.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      context
    };
  } catch (error) {
    throw new Error(`Pricing calculation failed: ${error.message}`);
  }
};

module.exports = {
  getUnitPriceForQuantity,
  calculateItemPrice,
  getPricingRules,
  checkRuleConditions,
  checkItemRuleConditions,
  applyPricingRule,
  calculateOrderPricing
};
