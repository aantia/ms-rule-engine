import { RulesEngine, RuleParameter, Workflow, BuiltInActions, ActionBase, ActionContext } from '../index';

/**
 * Custom action for sending email notifications
 */
class EmailNotificationAction extends ActionBase {
  async run(context: ActionContext, _ruleParameters: RuleParameter[]): Promise<any> {
    const recipient = context.recipient;
    const subject = context.subject || 'Rule Engine Notification';
    const body = context.body || 'A rule has been triggered';

    console.log(`📧 Sending email to: ${recipient}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      sent: true,
      recipient,
      subject,
      body,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Custom action for database logging
 */
class AuditLogAction extends ActionBase {
  async run(context: ActionContext, ruleParameters: RuleParameter[]): Promise<any> {
    const action = context.action || 'RULE_EXECUTED';
    const details = context.details || {};

    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      parameters: ruleParameters.map(p => ({ name: p.name, value: p.value }))
    };

    console.log('📝 Audit Log Entry:', JSON.stringify(logEntry, null, 2));
    
    // In a real scenario, you would save this to a database
    // await this.databaseService.saveAuditLog(logEntry);
    
    return logEntry;
  }
}

/**
 * Custom action for external API calls
 */
class ApiCallAction extends ActionBase {
  async run(context: ActionContext, _ruleParameters: RuleParameter[]): Promise<any> {
    const url = context.url;
    const method = context.method || 'POST';
    const payload = context.payload || {};

    console.log(`🌐 Making ${method} request to: ${url}`);
    console.log(`   Payload:`, payload);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock response
    const response = {
      success: true,
      statusCode: 200,
      data: {
        processed: true,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`   Response:`, response);
    return response;
  }
}

/**
 * Example demonstrating custom actions
 */
async function customActionsExample() {
  console.log('=== Custom Actions Example ===\n');

  // Create workflow with custom actions
  const workflowWithCustomActions: Workflow = {
    workflowName: 'CustomerOnboarding',
    rules: [
      {
        ruleName: 'VIPCustomerCheck',
        expression: 'customer.annualRevenue >= 100000 && customer.contractLength >= 12',
        actions: {
          onSuccess: {
            name: 'EmailNotification',
            context: {
              recipient: 'vip-team@company.com',
              subject: 'New VIP Customer Onboarded',
              body: 'A new VIP customer has been successfully onboarded'
            }
          }
        }
      },
      {
        ruleName: 'StandardCustomerCheck',
        expression: 'customer.annualRevenue < 100000',
        actions: {
          onSuccess: {
            name: 'ApiCall',
            context: {
              url: 'https://api.company.com/customers/onboard',
              method: 'POST',
              payload: {
                customerType: 'standard',
                assignedTeam: 'general-support'
              }
            }
          }
        }
      },
      {
        ruleName: 'AuditTrail',
        expression: 'true', // Always execute
        actions: {
          onSuccess: {
            name: 'AuditLog',
            context: {
              action: 'CUSTOMER_ONBOARDING_EVALUATED',
              details: {
                workflow: 'CustomerOnboarding',
                evaluatedAt: new Date().toISOString()
              }
            }
          }
        }
      }
    ]
  };

  // Register custom actions
  const customActions = {
    EmailNotification: () => new EmailNotificationAction(),
    AuditLog: () => new AuditLogAction(),
    ApiCall: () => new ApiCallAction(),
    ...BuiltInActions
  };

  // Create rules engine with custom actions
  const rulesEngine = new RulesEngine([workflowWithCustomActions], {
    customActions
  });

  // Test with VIP customer
  console.log('--- Testing VIP Customer ---');
  const vipCustomer = {
    name: 'Acme Corporation',
    annualRevenue: 250000,
    contractLength: 24,
    industry: 'Technology'
  };

  let results = await rulesEngine.executeAllRulesAsync(
    'CustomerOnboarding',
    new RuleParameter('customer', vipCustomer)
  );

  results.forEach(result => {
    console.log(`✅ Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
    if (result.actionResult?.output) {
      console.log(`   Action Result:`, result.actionResult.output);
    }
  });

  console.log('\n--- Testing Standard Customer ---');
  const standardCustomer = {
    name: 'Small Business Inc',
    annualRevenue: 50000,
    contractLength: 6,
    industry: 'Retail'
  };

  results = await rulesEngine.executeAllRulesAsync(
    'CustomerOnboarding',
    new RuleParameter('customer', standardCustomer)
  );

  results.forEach(result => {
    console.log(`✅ Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
    if (result.actionResult?.output) {
      console.log(`   Action Result:`, result.actionResult.output);
    }
  });
  
  console.log('\n');
}

/**
 * Example demonstrating chained rules with EvaluateRule action
 */
async function chainedRulesExample() {
  console.log('=== Chained Rules Example ===\n');

  const chainedRulesWorkflow: Workflow = {
    workflowName: 'PricingEngine',
    rules: [
      {
        ruleName: 'PremiumPricing',
        expression: 'customer.tier === "premium" && order.quantity >= 100',
        actions: {
          onSuccess: {
            name: 'OutputExpression',
            context: {
              expression: 'order.basePrice * order.quantity * 0.8' // 20% discount
            }
          },
          onFailure: {
            name: 'EvaluateRule',
            context: {
              workflowName: 'PricingEngine',
              ruleName: 'StandardPricing'
            }
          }
        }
      },
      {
        ruleName: 'StandardPricing',
        expression: 'order.quantity >= 50',
        actions: {
          onSuccess: {
            name: 'OutputExpression',
            context: {
              expression: 'order.basePrice * order.quantity * 0.9' // 10% discount
            }
          },
          onFailure: {
            name: 'EvaluateRule',
            context: {
              workflowName: 'PricingEngine',
              ruleName: 'RegularPricing'
            }
          }
        }
      },
      {
        ruleName: 'RegularPricing',
        expression: 'true', // Always applies
        actions: {
          onSuccess: {
            name: 'OutputExpression',
            context: {
              expression: 'order.basePrice * order.quantity' // No discount
            }
          }
        }
      }
    ]
  };

  const rulesEngine = new RulesEngine([chainedRulesWorkflow]);

  // Test premium customer
  console.log('--- Premium Customer Large Order ---');
  const premiumOrder = {
    customer: { tier: 'premium', id: 'CUST001' },
    order: { basePrice: 10, quantity: 150 }
  };

  let result = await rulesEngine.executeActionWorkflowAsync(
    'PricingEngine',
    'PremiumPricing',
    new RuleParameter('customer', premiumOrder.customer),
    new RuleParameter('order', premiumOrder.order)
  );

  console.log(`Final Price: $${result.output}`);

  // Test standard customer
  console.log('\n--- Standard Customer Medium Order ---');
  const standardOrder = {
    customer: { tier: 'standard', id: 'CUST002' },
    order: { basePrice: 10, quantity: 75 }
  };

  result = await rulesEngine.executeActionWorkflowAsync(
    'PricingEngine',
    'PremiumPricing',
    new RuleParameter('customer', standardOrder.customer),
    new RuleParameter('order', standardOrder.order)
  );

  console.log(`Final Price: $${result.output}`);

  // Test regular customer small order
  console.log('\n--- Regular Customer Small Order ---');
  const regularOrder = {
    customer: { tier: 'regular', id: 'CUST003' },
    order: { basePrice: 10, quantity: 25 }
  };

  result = await rulesEngine.executeActionWorkflowAsync(
    'PricingEngine',
    'PremiumPricing',
    new RuleParameter('customer', regularOrder.customer),
    new RuleParameter('order', regularOrder.order)
  );

  console.log(`Final Price: $${result.output}`);
  
  console.log('\n');
}

// Run examples
async function runCustomActionExamples() {
  try {
    await customActionsExample();
    await chainedRulesExample();
    
    console.log('Custom action examples completed successfully!');
  } catch (error) {
    console.error('Error running custom action examples:', error);
  }
}

// Export for use in other files
export {
  EmailNotificationAction,
  AuditLogAction,
  ApiCallAction,
  customActionsExample,
  chainedRulesExample,
  runCustomActionExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runCustomActionExamples();
}