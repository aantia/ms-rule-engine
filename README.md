# MS Rule Engine - Node.js SDK

A comprehensive Node.js SDK inspired by Microsoft Rules Engine, providing JSON-based business rules execution with extensive expression support. This independent implementation brings the power of Microsoft's Rules Engine concepts to the Node.js ecosystem with full TypeScript support.

> **Important:** This is an independent open-source project inspired by [Microsoft Rules Engine](https://github.com/microsoft/RulesEngine). It is NOT officially associated with or endorsed by Microsoft Corporation.

> **Learn More About Rules Engine Concepts**: Visit the [Official Microsoft Rules Engine Documentation](https://microsoft.github.io/RulesEngine/) to understand the core concepts, patterns, and best practices that this SDK implements for Node.js.

[![npm version](https://badge.fury.io/js/ms-rule-engine.svg)](https://badge.fury.io/js/ms-rule-engine)
[![Build Status](https://github.com/thechandanbhagat/ms-rule-engine/workflows/CI/badge.svg)](https://github.com/thechandanbhagat/ms-rule-engine/actions)
[![GitHub issues](https://img.shields.io/github/issues/thechandanbhagat/ms-rule-engine.svg)](https://github.com/thechandanbhagat/ms-rule-engine/issues)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **JSON-based Rules Definition** - Define business rules in declarative JSON format
- **Multiple Input Support** - Pass multiple input objects with custom naming
- **Expression Evaluation** - JavaScript expressions with C# syntax compatibility  
- **Scoped Parameters** - Global and local parameters for complex rule logic
- **Nested Rules** - Hierarchical rule structures with AND/OR operators
- **Actions Support** - Built-in and custom actions for rule outcomes
- **Custom Functions** - Inject custom functions and utilities
- **TypeScript Support** - Full type safety with comprehensive interfaces
- **Error Handling** - Configurable error handling and exception management
- **High Performance** - Optimized expression evaluation and rule execution

## Installation

```bash
npm install ms-rule-engine
# or
yarn add ms-rule-engine
```

## Quick Start

```typescript
import { RulesEngine, RuleParameter, Workflow } from 'ms-rule-engine';

// Define your business rules
const discountWorkflow: Workflow = {
  workflowName: 'CustomerDiscount',
  rules: [
    {
      ruleName: 'PremiumCustomerDiscount',
      expression: 'customer.totalSpent >= 10000 and customer.membershipYears >= 2',
      actions: {
        onSuccess: {
          name: 'OutputExpression',
          context: {
            expression: 'order.total * 0.15' // 15% discount
          }
        }
      }
    },
    {
      ruleName: 'RegularCustomerDiscount', 
      expression: 'customer.totalSpent >= 1000',
      actions: {
        onSuccess: {
          name: 'OutputExpression',
          context: {
            expression: 'order.total * 0.05' // 5% discount
          }
        }
      }
    }
  ]
};

// Initialize the rules engine
const rulesEngine = new RulesEngine([discountWorkflow]);

// Execute rules with your data
const customer = { totalSpent: 15000, membershipYears: 3 };
const order = { total: 500, items: ['laptop', 'mouse'] };

const results = await rulesEngine.executeAllRulesAsync(
  'CustomerDiscount',
  new RuleParameter('customer', customer),
  new RuleParameter('order', order)
);

// Process results
results.forEach(result => {
  console.log(`Rule: ${result.rule.ruleName}, Success: ${result.isSuccess}`);
  if (result.actionResult?.output) {
    console.log(`Discount Amount: $${result.actionResult.output}`);
  }
});
```

## Core Concepts

### Workflows and Rules

A **Workflow** contains multiple **Rules** that define your business logic:

```typescript
const workflow: Workflow = {
  workflowName: 'OrderValidation',
  globalParams: [
    {
      name: 'maxOrderValue',
      expression: '50000'
    }
  ],
  rules: [
    {
      ruleName: 'ValidateOrderAmount',
      expression: 'order.total <= maxOrderValue and order.total > 0'
    }
  ]
};
```

### Expression Syntax

The SDK supports JavaScript expressions with automatic conversion from C# syntax:

```typescript
// Supported expressions
'customer.age >= 18'                                    // Comparison
'customer.country == "USA" and customer.verified'      // Logical operators  
'order.items.length > 0'                               // Array operations
'customer.email.includes("@company.com")'              // String methods
'order.total * 0.1'                                    // Mathematical operations

// C# compatibility (automatically converted)
'customer.country == "USA" AND customer.verified'      // AND/OR operators
'customer.name.ToLower() == "john"'                    // String methods
```

### Scoped Parameters

Use scoped parameters to simplify complex expressions:

```typescript
const workflow: Workflow = {
  workflowName: 'ComplexPricing',
  globalParams: [
    {
      name: 'baseDiscount',
      expression: '0.1'
    }
  ],
  rules: [
    {
      ruleName: 'CalculateFinalPrice',
      localParams: [
        {
          name: 'discountAmount',
          expression: 'order.subtotal * baseDiscount'
        },
        {
          name: 'finalPrice',
          expression: 'order.subtotal - discountAmount + order.tax'
        }
      ],
      expression: 'finalPrice > 0'
    }
  ]
};
```

### Actions

Execute actions when rules succeed or fail:

```typescript
const ruleWithActions = {
  ruleName: 'SendWelcomeEmail',
  expression: 'customer.isNew and customer.emailVerified',
  actions: {
    onSuccess: {
      name: 'EmailNotification',
      context: {
        recipient: 'customer.email',
        template: 'welcome',
        subject: 'Welcome to our platform!'
      }
    },
    onFailure: {
      name: 'Log',
      context: {
        level: 'warn',
        message: 'Welcome email not sent - customer not eligible'
      }
    }
  }
};
```

## Advanced Usage

### Custom Actions

Create custom actions for complex business logic:

```typescript
import { ActionBase, ActionContext, RuleParameter } from 'ms-rule-engine';

class EmailNotificationAction extends ActionBase {
  async run(context: ActionContext, ruleParameters: RuleParameter[]): Promise<any> {
    const recipient = context.recipient;
    const subject = context.subject;
    
    // Your email sending logic here
    await this.emailService.send(recipient, subject, context.body);
    
    return { sent: true, recipient, timestamp: new Date() };
  }
}

// Register custom action
const rulesEngine = new RulesEngine([workflow], {
  customActions: {
    EmailNotification: () => new EmailNotificationAction()
  }
});
```

### Custom Functions

Inject custom functions for use in expressions:

```typescript
const customUtils = {
  calculateAge: (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    return today.getFullYear() - birth.getFullYear();
  },
  
  isValidEmail: (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};

const rulesEngine = new RulesEngine([workflow], {
  customTypes: { Utils: customUtils }
});

// Use in expressions
const rule = {
  ruleName: 'ValidateCustomer',
  expression: 'Utils.calculateAge(customer.birthDate) >= 18 and Utils.isValidEmail(customer.email)'
};
```

### Nested Rules

Create complex hierarchical logic:

```typescript
const nestedWorkflow: Workflow = {
  workflowName: 'LoanApproval',
  rules: [
    {
      ruleName: 'EligibilityCheck',
      operator: 'And',
      rules: [
        {
          ruleName: 'AgeCheck',
          expression: 'applicant.age >= 18 and applicant.age <= 65'
        },
        {
          ruleName: 'IncomeCheck', 
          expression: 'applicant.annualIncome >= 25000'
        },
        {
          ruleName: 'CreditCheck',
          expression: 'applicant.creditScore >= 650'
        }
      ]
    }
  ]
};
```

### Error Handling

Configure error handling behavior:

```typescript
const settings = {
  ignoreException: false,                    // Throw on errors
  enableExceptionAsErrorMessage: true,       // Include error details
  enableFormattedErrorMessage: true,         // Format error messages
  isExpressionCaseSensitive: false          // Case-insensitive expressions
};

const rulesEngine = new RulesEngine([workflow], settings);
```

## Migration from C# Version

### Key Differences

| Aspect | C# Version | Node.js Version |
|--------|------------|-----------------|
| **Method Names** | `ExecuteAllRulesAsync` | `executeAllRulesAsync` |
| **Property Names** | `WorkflowName` (PascalCase) | `workflowName` (camelCase) |
| **Parameters** | Direct objects | `RuleParameter` wrapper |
| **Expressions** | C# syntax | JavaScript syntax (auto-converted) |
| **String Methods** | `.ToLower()` | `.toLowerCase()` or `ToLower()` |
| **Operators** | `AND`, `OR` | `and`, `or` (or `&&`, `||`) |

### Migration Example

**C# Version:**
```csharp
var re = new RulesEngine.RulesEngine(workflowRules);
var results = await re.ExecuteAllRulesAsync("Discount", input1, input2, input3);
```

**Node.js Version:**
```typescript
const re = new RulesEngine(workflowRules);
const results = await re.executeAllRulesAsync("Discount", 
  new RuleParameter("input1", input1),
  new RuleParameter("input2", input2), 
  new RuleParameter("input3", input3)
);
```

## API Reference

### Classes

#### `RulesEngine`

Main class for executing business rules.

**Constructor:**
```typescript
constructor(workflows: Workflow[], settings?: ReSettings)
```

**Methods:**
- `executeAllRulesAsync(workflowName: string, ...ruleParameters: RuleParameter[]): Promise<RuleResult[]>`
- `executeRuleAsync(workflowName: string, ruleName: string, ...ruleParameters: RuleParameter[]): Promise<RuleResult | null>`
- `executeActionWorkflowAsync(workflowName: string, ruleName: string, ...ruleParameters: RuleParameter[]): Promise<ActionResult>`

#### `RuleParameter`

Wrapper for input parameters.

```typescript
constructor(name: string, value: any)
```

#### `ExpressionEvaluator`

Standalone expression evaluator.

```typescript
evaluate<T>(expression: string, ruleParameters: RuleParameter[], scopedParams?: any): T
```

### Interfaces

#### `Workflow`
```typescript
interface Workflow {
  workflowName: string;
  rules: Rule[];
  globalParams?: ScopedParam[];
}
```

#### `Rule`
```typescript
interface Rule {
  ruleName: string;
  expression?: string;
  operator?: RuleOperator;
  localParams?: ScopedParam[];
  actions?: RuleActions;
  rules?: Rule[];
  enabled?: boolean;
}
```

#### `RuleResult`
```typescript
interface RuleResult {
  rule: Rule;
  isSuccess: boolean;
  actionResult?: ActionResult;
  childResults?: RuleResult[];
  exceptionMessage?: string;
}
```

## Examples

Check out the `/src/examples` directory for comprehensive examples:

- **Basic Usage** (`basic-usage.ts`) - Simple discount rules and scoped parameters
- **Custom Actions** (`custom-actions.ts`) - Email notifications, logging, API calls
- **Migration Guide** (`migration-guide.ts`) - Complete C# to Node.js migration examples

## Running Examples

```bash
# Basic usage examples
npm run dev

# Run specific example
npx ts-node src/examples/custom-actions.ts
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Microsoft Rules Engine Compatibility

This package is inspired by and designed to be compatible with [Microsoft's Rules Engine](https://github.com/microsoft/RulesEngine). While this is an independent Node.js implementation, it follows the same concepts and JSON structure as the original Microsoft Rules Engine.

### Key Differences from Microsoft Rules Engine:
- **Platform**: Node.js/JavaScript instead of .NET/C#
- **Expression Language**: JavaScript expressions instead of C# expressions
- **Dependencies**: Uses `expr-eval` for expression evaluation
- **Type System**: TypeScript definitions included

### Microsoft Guidelines Compliance:
- **Open Source**: This project is open source under MIT license
- **Attribution**: Properly credits Microsoft Rules Engine as inspiration
- **Independent**: This is not affiliated with or endorsed by Microsoft
- **Compatible**: Maintains similar JSON structure and concepts
- **Educational**: Designed to help developers migrate from C# to Node.js

## Important Disclaimer

**This project is NOT officially associated with Microsoft Corporation.** It is an independent open-source implementation inspired by Microsoft's Rules Engine concepts. Microsoft Rules Engine is a trademark of Microsoft Corporation.

- Original Microsoft Rules Engine: https://github.com/microsoft/RulesEngine
- Microsoft Open Source Guidelines: https://opensource.microsoft.com/

## Microsoft Guidelines & Compatibility

This Node.js SDK is designed to be compatible with Microsoft's Rules Engine patterns and follows the same conceptual framework. For detailed information about the original Microsoft Rules Engine, please refer to:

- **[Official Microsoft Rules Engine Documentation](https://microsoft.github.io/RulesEngine/)**
- **[Microsoft Rules Engine GitHub Repository](https://github.com/microsoft/RulesEngine)**

### Key Compatibility Features

- **JSON Rule Definitions** - Same structure as Microsoft Rules Engine
- **Expression Syntax** - Automatic conversion from C# to JavaScript expressions
- **Workflow Concepts** - Compatible workflow and rule organization
- **Scoped Parameters** - Global and local parameters work identically
- **Action Framework** - Similar action execution patterns
- **Nested Rules** - Same hierarchical rule structure support

### Migration from C# Version

This SDK provides a seamless migration path from Microsoft's C# Rules Engine:

1. **Rule Definitions**: Your existing JSON rule definitions work with minimal changes
2. **Expression Conversion**: C# expressions are automatically converted to JavaScript
3. **API Similarity**: Method names and patterns mirror the original C# implementation
4. **Feature Parity**: All major features from the C# version are supported

For detailed migration examples, see the [Migration Guide](src/examples/migration-guide.ts) in the examples folder.

### Disclaimer

This is an independent implementation inspired by Microsoft's Rules Engine concept. It is not an official Microsoft product, but aims to provide the same powerful rule engine capabilities for the Node.js ecosystem while maintaining compatibility with Microsoft's design patterns.

## Acknowledgments

- Inspired by [Microsoft Rules Engine](https://github.com/microsoft/RulesEngine)
- Built with [expr-eval](https://github.com/silentmatt/expr-eval) for expression evaluation
- TypeScript support for enhanced developer experience
- Special thanks to the Microsoft team for creating the original Rules Engine concept

## Contributing

We welcome contributions from the community! Here's how you can help improve this project:

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/thechandanbhagat/ms-rule-engine.git
   cd ms-rule-engine
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

### Development Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Run the full test suite**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
5. **Commit your changes** with a clear message:
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. **Push to your fork** and **create a Pull Request**

### Contribution Guidelines

#### Code Standards
- Follow **TypeScript best practices** with strict type checking
- Use **meaningful variable and function names**
- Add **JSDoc comments** for public APIs
- Maintain **consistent code formatting** (we use ESLint and Prettier)
- Keep **functions small** and **single-purpose**

#### Testing Requirements
- **Write unit tests** for all new features using Jest
- **Maintain 80%+ code coverage** for new code
- **Include integration tests** for complex workflows
- **Test both success and error scenarios**
- **Update existing tests** when modifying functionality

#### Documentation
- **Update README.md** for new features or API changes
- **Add inline code comments** for complex logic
- **Include usage examples** in documentation
- **Update CHANGELOG.md** following semantic versioning

#### Types of Contributions We Welcome

**Bug Fixes**
- Report bugs with detailed reproduction steps
- Include system information and error messages
- Provide minimal test cases when possible

**Feature Enhancements**
- **Expression Functions**: Add new built-in functions
- **Actions**: Implement additional action types
- **Performance**: Optimize rule execution and evaluation
- **Compatibility**: Improve C# to JavaScript conversion

**Documentation Improvements**
- Fix typos and grammar issues
- Add more usage examples
- Improve API documentation
- Create tutorials and guides

**Testing & Quality**
- Add missing test coverage
- Improve test performance
- Add edge case testing
- Enhance error handling tests

### Code Review Process

1. **All contributions** require code review
2. **Maintain backward compatibility** unless it's a major version
3. **Address reviewer feedback** promptly
4. **Squash commits** before merging when requested
5. **Follow semantic versioning** for changes

### Community Guidelines

- **Be respectful** and inclusive in all interactions
- **Help newcomers** get started with the project
- **Provide constructive feedback** during code reviews
- **Ask questions** if anything is unclear
- **Follow the Code of Conduct** (treat everyone with respect)

### Need Help?

- **Questions?** Open a [Discussion](https://github.com/thechandanbhagat/ms-rule-engine/discussions)
- **Found a bug?** Create an [Issue](https://github.com/thechandanbhagat/ms-rule-engine/issues)
- **Want to contribute but not sure how?** Look for issues labeled `good first issue`

Thank you for helping make this project better for everyone!

## Support

- [Documentation](https://github.com/thechandanbhagat/ms-rule-engine#readme)
- [Issue Tracker](https://github.com/thechandanbhagat/ms-rule-engine/issues)
- [Discussions](https://github.com/thechandanbhagat/ms-rule-engine/discussions)
- [Author: Chandan Bhagat](https://github.com/thechandanbhagat)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with care by Chandan Bhagat for the Node.js community**