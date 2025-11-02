import { RulesEngine, RuleParameter, Workflow } from '../index';

/**
 * Basic usage example demonstrating discount rules
 * This mirrors the examples from the Microsoft Rules Engine documentation
 */
async function basicUsageExample() {
  console.log('=== Basic Usage Example ===\n');

  // Define the workflow with discount rules
  const discountWorkflow: Workflow = {
    workflowName: 'Discount',
    rules: [
      {
        ruleName: 'GiveDiscount10',
        expression: 'input1.country === "india" && input1.loyalityFactor <= 2 && input1.totalPurchasesToDate >= 5000 && input2.totalOrders > 2 && input3.noOfVisitsPerMonth > 2'
      },
      {
        ruleName: 'GiveDiscount20',
        expression: 'input1.country === "india" && input1.loyalityFactor === 3 && input1.totalPurchasesToDate >= 10000 && input2.totalOrders > 2 && input3.noOfVisitsPerMonth > 2'
      }
    ]
  };

  // Initialize the rules engine
  const rulesEngine = new RulesEngine([discountWorkflow]);

  // Prepare input data
  const input1 = {
    country: 'india',
    loyalityFactor: 3,
    totalPurchasesToDate: 15000
  };

  const input2 = {
    totalOrders: 5
  };

  const input3 = {
    noOfVisitsPerMonth: 4
  };

  // Execute all rules
  const results = await rulesEngine.executeAllRulesAsync(
    'Discount', 
    new RuleParameter('input1', input1),
    new RuleParameter('input2', input2),
    new RuleParameter('input3', input3)
  );

  // Display results
  results.forEach(result => {
    console.log(`Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
  });
  
  console.log('\n'); 
}

/**
 * Example using custom input names instead of input1, input2, input3
 */
async function customInputNamesExample() {
  console.log('=== Custom Input Names Example ===\n');

  const discountWithCustomNamesWorkflow: Workflow = {
    workflowName: 'DiscountWithCustomInputNames',
    rules: [
      {
        ruleName: 'GiveDiscount10',
        expression: 'basicInfo.country === "india" && basicInfo.loyalityFactor <= 2 && basicInfo.totalPurchasesToDate >= 5000 && orderInfo.totalOrders > 2 && telemetryInfo.noOfVisitsPerMonth > 2'
      },
      {
        ruleName: 'GiveDiscount20',
        expression: 'basicInfo.country === "india" && basicInfo.loyalityFactor === 3 && basicInfo.totalPurchasesToDate >= 10000 && orderInfo.totalOrders > 2 && telemetryInfo.noOfVisitsPerMonth > 2'
      }
    ]
  };

  const rulesEngine = new RulesEngine([discountWithCustomNamesWorkflow]);

  const basicInfo = {
    country: 'india',
    loyalityFactor: 2,
    totalPurchasesToDate: 8000
  };

  const orderInfo = {
    totalOrders: 3
  };

  const telemetryInfo = {
    noOfVisitsPerMonth: 5
  };

  const results = await rulesEngine.executeAllRulesAsync(
    'DiscountWithCustomInputNames',
    new RuleParameter('basicInfo', basicInfo),
    new RuleParameter('orderInfo', orderInfo),
    new RuleParameter('telemetryInfo', telemetryInfo)
  );

  results.forEach(result => {
    console.log(`Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
  });
  
  console.log('\n');
}

/**
 * Example demonstrating scoped parameters (global and local)
 */
async function scopedParametersExample() {
  console.log('=== Scoped Parameters Example ===\n');

  const workflowWithScopedParams: Workflow = {
    workflowName: 'WorkflowWithScopedParams',
    globalParams: [
      {
        name: 'discountThreshold',
        expression: '5000'
      },
      {
        name: 'premiumCountries',
        expression: '["india", "usa", "canada"]'
      }
    ],
    rules: [
      {
        ruleName: 'EligibleForDiscount',
        localParams: [
          {
            name: 'isPremiumCountry',
            expression: 'premiumCountries.includes(customer.country)'
          },
          {
            name: 'meetsSpendingThreshold',
            expression: 'customer.totalSpent >= discountThreshold'
          }
        ],
        expression: 'isPremiumCountry && meetsSpendingThreshold'
      }
    ]
  };

  const rulesEngine = new RulesEngine([workflowWithScopedParams]);

  const customer = {
    country: 'usa',
    totalSpent: 7500,
    membershipLevel: 'gold'
  };

  const results = await rulesEngine.executeAllRulesAsync(
    'WorkflowWithScopedParams',
    new RuleParameter('customer', customer)
  );

  results.forEach(result => {
    console.log(`Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
  });
  
  console.log('\n');
}

/**
 * Example with actions (OutputExpression)
 */
async function actionsExample() {
  console.log('=== Actions Example ===\n');

  const workflowWithActions: Workflow = {
    workflowName: 'DiscountCalculation',
    rules: [
      {
        ruleName: 'CalculateDiscount',
        expression: 'order.total >= 1000',
        actions: {
          onSuccess: {
            name: 'OutputExpression',
            context: {
              expression: 'order.total * 0.1'
            }
          },
          onFailure: {
            name: 'OutputExpression',
            context: {
              expression: '0'
            }
          }
        }
      }
    ]
  };

  const rulesEngine = new RulesEngine([workflowWithActions]);

  const order = {
    total: 1500,
    customerId: 'CUST001'
  };

  const results = await rulesEngine.executeAllRulesAsync(
    'DiscountCalculation',
    new RuleParameter('order', order)
  );

  results.forEach(result => {
    console.log(`Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
    if (result.actionResult) {
      console.log(`Action Output: ${result.actionResult.output}`);
    }
  });
  
  console.log('\n');
}

/**
 * Example with nested rules
 */
async function nestedRulesExample() {
  console.log('=== Nested Rules Example ===\n');

  const nestedRulesWorkflow: Workflow = {
    workflowName: 'ComplexEligibility',
    rules: [
      {
        ruleName: 'PremiumCustomerCheck',
        operator: 'And' as any,
        rules: [
          {
            ruleName: 'AgeCheck',
            expression: 'customer.age >= 18'
          },
          {
            ruleName: 'IncomeCheck',
            expression: 'customer.income >= 50000'
          },
          {
            ruleName: 'CreditCheck',
            expression: 'customer.creditScore >= 700'
          }
        ]
      }
    ]
  };

  const rulesEngine = new RulesEngine([nestedRulesWorkflow]);

  const customer = {
    age: 25,
    income: 75000,
    creditScore: 750
  };

  const results = await rulesEngine.executeAllRulesAsync(
    'ComplexEligibility',
    new RuleParameter('customer', customer)
  );

  results.forEach(result => {
    console.log(`Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
    if (result.childResults) {
      result.childResults.forEach(childResult => {
        console.log(`  - ${childResult.rule.ruleName}: ${childResult.isSuccess}`);
      });
    }
  });
  
  console.log('\n');
}

// Run all examples
async function runAllExamples() {
  try {
    await basicUsageExample();
    await customInputNamesExample();
    await scopedParametersExample();
    await actionsExample();
    await nestedRulesExample();
    
    console.log('All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other files
export {
  basicUsageExample,
  customInputNamesExample,
  scopedParametersExample,
  actionsExample,
  nestedRulesExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}