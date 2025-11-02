/**
 * Migration Guide: From Microsoft Rules Engine (C#) to Node.js SDK
 * 
 * This file demonstrates how to migrate from the C# version to the Node.js version
 * of the Microsoft Rules Engine, highlighting syntax differences and new capabilities.
 */

import { RulesEngine, RuleParameter, Workflow, ReSettings } from '../index';

/**
 * COMPARISON: C# vs Node.js
 * 
 * C# Version:
 * ```csharp
 * var workflowRules = // Get list of workflow rules declared in the json
 * var re = new RulesEngine.RulesEngine(workflowRules);
 * var resultList = await re.ExecuteAllRulesAsync("Discount", input1, input2, input3);
 * ```
 * 
 * Node.js Version:
 * ```typescript
 * const workflowRules = // Get list of workflow rules declared in the json
 * const re = new RulesEngine(workflowRules);
 * const resultList = await re.executeAllRulesAsync("Discount", 
 *   new RuleParameter("input1", input1),
 *   new RuleParameter("input2", input2), 
 *   new RuleParameter("input3", input3)
 * );
 * ```
 */

console.log('=== C# to Node.js Migration Examples ===\n');

/**
 * 1. BASIC WORKFLOW MIGRATION
 */
async function basicMigrationExample() {
  console.log('--- 1. Basic Workflow Migration ---');
  
  // Original C# JSON (unchanged)
  const discountWorkflowJson = {
    "WorkflowName": "Discount",
    "Rules": [
      {
        "RuleName": "GiveDiscount10",
        "Expression": "input1.country == \"india\" AND input1.loyalityFactor <= 2 AND input1.totalPurchasesToDate >= 5000 AND input2.totalOrders > 2 AND input3.noOfVisitsPerMonth > 2"
      },
      {
        "RuleName": "GiveDiscount20", 
        "Expression": "input1.country == \"india\" AND input1.loyalityFactor == 3 AND input1.totalPurchasesToDate >= 10000 AND input2.totalOrders > 2 AND input3.noOfVisitsPerMonth > 2"
      }
    ]
  };

  // Convert to TypeScript interface (automatic conversion)
  const discountWorkflow: Workflow = {
    workflowName: discountWorkflowJson.WorkflowName,
    rules: discountWorkflowJson.Rules.map(rule => ({
      ruleName: rule.RuleName,
      expression: rule.Expression
    }))
  };

  const rulesEngine = new RulesEngine([discountWorkflow]);

  // C# input objects (unchanged)
  const input1 = { country: "india", loyalityFactor: 3, totalPurchasesToDate: 15000 };
  const input2 = { totalOrders: 5 };
  const input3 = { noOfVisitsPerMonth: 4 };

  // Node.js execution (parameters wrapped in RuleParameter)
  const results = await rulesEngine.executeAllRulesAsync(
    "Discount",
    new RuleParameter("input1", input1),
    new RuleParameter("input2", input2),
    new RuleParameter("input3", input3)
  );

  console.log('Migration successful! Results:');
  results.forEach(result => {
    console.log(`  ${result.rule.ruleName}: ${result.isSuccess}`);
  });
  console.log();
}

/**
 * 2. EXPRESSION SYNTAX MIGRATION
 */
async function expressionSyntaxMigration() {
  console.log('--- 2. Expression Syntax Migration ---');
  
  // C# expressions are automatically converted to JavaScript
  const expressionMigrationExamples = [
    {
      name: "Logical Operators",
      csharp: "input1.value > 0 AND input2.value < 100",
      javascript: "input1.value > 0 && input2.value < 100",
      description: "AND/OR operators converted to &&/||"
    },
    {
      name: "String Methods",
      csharp: "input1.name.ToLower() == \"john\"",
      javascript: "input1.name.toLowerCase() === \"john\"",
      description: "C# string methods converted to JavaScript equivalents"
    },
    {
      name: "Equality Operators", 
      csharp: "input1.status == \"active\"",
      javascript: "input1.status === \"active\"",
      description: "== converted to === for strict equality"
    }
  ];

  console.log('Expression conversion examples:');
  expressionMigrationExamples.forEach(example => {
    console.log(`  ${example.name}:`);
    console.log(`    C#: ${example.csharp}`);
    console.log(`    JS: ${example.javascript}`);
    console.log(`    📝 ${example.description}\n`);
  });
}

/**
 * 3. CUSTOM TYPES MIGRATION
 */
async function customTypesMigration() {
  console.log('--- 3. Custom Types Migration ---');
  
  // C# custom class example:
  // public static class Utils
  // {
  //     public static bool CheckContains(string check, string valList)
  //     {
  //         var list = valList.Split(',').ToList();
  //         return list.Contains(check);
  //     }
  // }

  // Node.js equivalent
  const Utils = {
    CheckContains: (check: string, valList: string): boolean => {
      if (!check || !valList) return false;
      const list = valList.split(',');
      return list.includes(check);
    },
    
    // Additional utility functions
    IsValidEmail: (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    
    CalculateAge: (birthDate: string): number => {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
  };

  const customTypesWorkflow: Workflow = {
    workflowName: "CustomTypesDemo",
    rules: [
      {
        ruleName: "CheckValidCountry",
        expression: "Utils.CheckContains(user.country, \"india,usa,canada,france\")"
      },
      {
        ruleName: "CheckValidEmail",
        expression: "Utils.IsValidEmail(user.email)"
      },
      {
        ruleName: "CheckAdultAge",
        expression: "Utils.CalculateAge(user.birthDate) >= 18"
      }
    ]
  };

  const settings: ReSettings = {
    customTypes: { Utils }
  };

  const rulesEngine = new RulesEngine([customTypesWorkflow], settings);

  const user = {
    country: "usa",
    email: "john.doe@example.com", 
    birthDate: "1990-05-15"
  };

  const results = await rulesEngine.executeAllRulesAsync(
    "CustomTypesDemo",
    new RuleParameter("user", user)
  );

  console.log('Custom types migration results:');
  results.forEach(result => {
    console.log(`  ${result.rule.ruleName}: ${result.isSuccess}`);
  });
  console.log();
}

/**
 * 4. SCOPED PARAMETERS MIGRATION
 */
async function scopedParametersMigration() {
  console.log('--- 4. Scoped Parameters Migration ---');
  
  // C# JSON with scoped parameters (unchanged)
  const scopedParamsWorkflow: Workflow = {
    workflowName: "ScopedParamsDemo",
    globalParams: [
      {
        name: "discountThreshold",
        expression: "1000"
      },
      {
        name: "premiumDiscount",
        expression: "0.15"
      }
    ],
    rules: [
      {
        ruleName: "CalculatePremiumDiscount",
        localParams: [
          {
            name: "qualifiesForDiscount",
            expression: "order.total >= discountThreshold"
          },
          {
            name: "discountAmount", 
            expression: "qualifiesForDiscount ? order.total * premiumDiscount : 0"
          }
        ],
        expression: "discountAmount > 0",
        actions: {
          onSuccess: {
            name: "OutputExpression",
            context: {
              expression: "discountAmount"
            }
          }
        }
      }
    ]
  };

  const rulesEngine = new RulesEngine([scopedParamsWorkflow]);

  const order = {
    total: 1500,
    customerId: "CUST001"
  };

  const results = await rulesEngine.executeAllRulesAsync(
    "ScopedParamsDemo",
    new RuleParameter("order", order)
  );

  console.log('Scoped parameters migration results:');
  results.forEach(result => {
    console.log(`  ${result.rule.ruleName}: ${result.isSuccess}`);
    if (result.actionResult?.output) {
      console.log(`    Discount Amount: $${result.actionResult.output}`);
    }
  });
  console.log();
}

/**
 * 5. MIGRATION CHECKLIST
 */
function displayMigrationChecklist() {
  console.log('--- 5. Migration Checklist ---');
  
  const checklist = [
    "✅ Convert PascalCase properties to camelCase (WorkflowName → workflowName)",
    "✅ Wrap input parameters in RuleParameter class",
    "✅ Update method names (ExecuteAllRulesAsync → executeAllRulesAsync)",
    "✅ Convert C# expressions to JavaScript syntax (AND → &&, == → ===)",
    "✅ Migrate custom types from C# static classes to JavaScript objects",
    "✅ Update string methods (ToLower() → toLowerCase())",
    "✅ Verify Boolean logic and null handling",
    "✅ Test all rule expressions with sample data",
    "✅ Migrate custom actions from C# ActionBase to JavaScript ActionBase",
    "✅ Update ReSettings configuration options"
  ];

  console.log('Complete this checklist for successful migration:');
  checklist.forEach(item => {
    console.log(`  ${item}`);
  });
  console.log();
}

/**
 * 6. PERFORMANCE CONSIDERATIONS
 */
function displayPerformanceConsiderations() {
  console.log('--- 6. Performance Considerations ---');
  
  const considerations = [
    {
      aspect: "Expression Evaluation",
      csharp: "Compiled C# expressions",
      nodejs: "JavaScript expression parsing",
      recommendation: "Pre-compile frequently used expressions"
    },
    {
      aspect: "Type Safety",
      csharp: "Strong typing at compile time",
      nodejs: "Runtime type checking",
      recommendation: "Use TypeScript for better type safety"
    },
    {
      aspect: "Memory Usage",
      csharp: "Managed memory with GC",
      nodejs: "V8 garbage collection",
      recommendation: "Monitor memory usage with large rule sets"
    },
    {
      aspect: "Async Operations",
      csharp: "Task-based async/await",
      nodejs: "Promise-based async/await",
      recommendation: "Both handle async operations similarly"
    }
  ];

  console.log('Performance comparison:');
  considerations.forEach(item => {
    console.log(`  ${item.aspect}:`);
    console.log(`    C#: ${item.csharp}`);
    console.log(`    Node.js: ${item.nodejs}`);
    console.log(`    💡 ${item.recommendation}\n`);
  });
}

// Run all migration examples
async function runMigrationGuide() {
  try {
    await basicMigrationExample();
    await expressionSyntaxMigration();
    await customTypesMigration();
    await scopedParametersMigration();
    displayMigrationChecklist();
    displayPerformanceConsiderations();
    
    console.log('✅ Migration guide completed successfully!');
    console.log('📚 Your C# Rules Engine workflows are now ready for Node.js!');
  } catch (error) {
    console.error('❌ Error in migration guide:', error);
  }
}

// Export for use in other files
export {
  basicMigrationExample,
  expressionSyntaxMigration,
  customTypesMigration,
  scopedParametersMigration,
  runMigrationGuide
};

// Run migration guide if this file is executed directly
if (require.main === module) {
  runMigrationGuide();
}