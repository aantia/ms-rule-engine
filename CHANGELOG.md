# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-03

### Added
- Initial release of MS Rule Engine Node.js SDK
- Core `RulesEngine` class for executing JSON-based business rules
- `ExpressionEvaluator` with JavaScript expression evaluation and C# syntax compatibility
- Support for scoped parameters (global and local)
- Nested rules with AND/OR operators
- Built-in actions: `OutputExpression` and `EvaluateRule`
- Custom action framework for extensible business logic
- Full TypeScript support with comprehensive type definitions
- Automatic conversion from C# expression syntax to JavaScript
- Error handling with configurable exception management
- Performance optimizations for rule execution
- Comprehensive test suite with 41+ passing tests
- Detailed documentation and migration guide from C# version
- Complete examples including:
  - Basic usage with discount rules
  - Custom actions (email notifications, logging, API calls)
  - Migration examples from Microsoft's C# Rules Engine
- MIT license for open source usage

### Features
- ✅ JSON-based rules definition
- ✅ Multiple input support with custom naming
- ✅ Expression evaluation with C# compatibility
- ✅ Scoped parameters for complex rule logic
- ✅ Hierarchical rule structures
- ✅ Built-in and custom actions
- ✅ TypeScript support
- ✅ Error handling and validation
- ✅ High performance execution
- ✅ Extensible architecture

### Dependencies
- `expr-eval`: ^2.0.2 - Expression evaluation engine
- `lodash`: ^4.17.21 - Utility functions
- `@types/lodash`: ^4.14.202 - TypeScript definitions for lodash

### System Requirements
- Node.js >= 16.0.0
- TypeScript >= 4.0.0 (for TypeScript projects)

### Documentation
- Complete README with usage examples
- API reference documentation
- Migration guide from C# Rules Engine
- TypeScript definitions included