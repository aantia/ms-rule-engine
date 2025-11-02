import { ExpressionEvaluator } from '../src/core/ExpressionEvaluator';
import { RuleParameter, ReSettings } from '../src/models';

describe('ExpressionEvaluator', () => {
  let evaluator: ExpressionEvaluator;

  beforeEach(() => {
    evaluator = new ExpressionEvaluator();
  });

  describe('Basic Expression Evaluation', () => {
    it('should evaluate simple numeric expressions', () => {
      const ruleParams = [new RuleParameter('input1', { value: 10 })];
      
      const result = evaluator.evaluate('input1.value > 5', ruleParams);
      expect(result).toBe(true);
    });

    it('should evaluate string expressions', () => {
      const ruleParams = [new RuleParameter('input1', { name: 'John' })];
      
      const result = evaluator.evaluate('input1.name == "John"', ruleParams);
      expect(result).toBe(true);
    });

    it('should evaluate boolean expressions', () => {
      const ruleParams = [new RuleParameter('input1', { active: true })];
      
      const result = evaluator.evaluate('input1.active == true', ruleParams);
      expect(result).toBe(true);
    });
  });

  describe('Complex Expressions', () => {
    it('should handle logical AND operations', () => {
      const ruleParams = [
        new RuleParameter('input1', { value: 10 }),
        new RuleParameter('input2', { status: 'active' })
      ];
      
      const result = evaluator.evaluate(
        'input1.value > 5 and input2.status == "active"', 
        ruleParams
      );
      expect(result).toBe(true);
    });

    it('should handle logical OR operations', () => {
      const ruleParams = [
        new RuleParameter('input1', { value: 3 }),
        new RuleParameter('input2', { status: 'active' })
      ];
      
      const result = evaluator.evaluate(
        'input1.value > 5 or input2.status == "active"', 
        ruleParams
      );
      expect(result).toBe(true);
    });

    it('should handle nested expressions with parentheses', () => {
      const ruleParams = [new RuleParameter('input1', { a: 5, b: 10, c: 15 })];
      
      const result = evaluator.evaluate(
        '(input1.a + input1.b) > input1.c or input1.c > (input1.a * 2)', 
        ruleParams
      );
      expect(result).toBe(true);
    });
  });

  describe('C# to JavaScript Conversion', () => {
    it('should convert C# AND/OR operators', () => {
      const ruleParams = [new RuleParameter('input1', { value: 10, status: 'active' })];
      
      // Test AND conversion
      const andResult = evaluator.evaluate(
        'input1.value > 5 AND input1.status == "active"', 
        ruleParams
      );
      expect(andResult).toBe(true);

      // Test OR conversion  
      const orResult = evaluator.evaluate(
        'input1.value < 5 OR input1.status == "active"', 
        ruleParams
      );
      expect(orResult).toBe(true);
    });

    it('should handle string method conversions', () => {
      const ruleParams = [new RuleParameter('input1', { name: 'JOHN DOE' })];
      
      const result = evaluator.evaluate(
        'ToLower(input1.name) == "john doe"', 
        ruleParams
      );
      expect(result).toBe(true);
    });

    it('should handle equality operator conversion', () => {
      const ruleParams = [new RuleParameter('input1', { value: 42 })];
      
      const result = evaluator.evaluate('input1.value == 42', ruleParams);
      expect(result).toBe(true);
    });
  });

  describe('Scoped Parameters', () => {
    it('should evaluate scoped parameters in correct order', () => {
      const scopedParams = [
        { name: 'baseValue', expression: 'input1.value' },
        { name: 'doubledValue', expression: 'baseValue * 2' },
        { name: 'finalValue', expression: 'doubledValue + 10' }
      ];
      
      const ruleParams = [new RuleParameter('input1', { value: 5 })];
      
      const result = evaluator.evaluateScopedParams(scopedParams, ruleParams);
      
      expect(result.baseValue).toBe(5);
      expect(result.doubledValue).toBe(10);
      expect(result.finalValue).toBe(20);
    });

    it('should handle scoped parameter dependencies', () => {
      const scopedParams = [
        { name: 'threshold', expression: '100' },
        { name: 'exceedsThreshold', expression: 'input1.value > threshold' }
      ];
      
      const ruleParams = [new RuleParameter('input1', { value: 150 })];
      
      const result = evaluator.evaluateScopedParams(scopedParams, ruleParams);
      
      expect(result.threshold).toBe(100);
      expect(result.exceedsThreshold).toBe(true);
    });
  });

  describe('Custom Types Integration', () => {
    it('should use custom types in expressions', () => {
      const customTypes = {
        MathUtils: {
          Square: (n: number) => n * n,
          IsEven: (n: number) => n % 2 === 0
        }
      };

      const settings: ReSettings = { customTypes };
      const customEvaluator = new ExpressionEvaluator(settings);
      
      const ruleParams = [new RuleParameter('input1', { number: 4 })];
      
      const squareResult = customEvaluator.evaluate(
        'MathUtils.Square(input1.number) == 16', 
        ruleParams
      );
      expect(squareResult).toBe(true);

      const evenResult = customEvaluator.evaluate(
        'MathUtils.IsEven(input1.number)', 
        ruleParams
      );
      expect(evenResult).toBe(true);
    });

    it('should access utility functions', () => {
      const ruleParams = [new RuleParameter('input1', { text: 'Hello World' })];
      
      // Test built-in string utilities
      const result = evaluator.evaluate(
        'ToLower(input1.text) == "hello world"', 
        ruleParams
      );
      expect(result).toBe(true);
    });
  });

  describe('Array Operations', () => {
    it('should handle array includes operations', () => {
      const ruleParams = [
        new RuleParameter('input1', { country: 'usa' }),
        new RuleParameter('input2', { validCountries: ['usa', 'canada', 'uk'] })
      ];
      
      const result = evaluator.evaluate(
        'includes(input2.validCountries, input1.country)', 
        ruleParams
      );
      expect(result).toBe(true);
    });

    it('should handle array length checks', () => {
      const ruleParams = [
        new RuleParameter('input1', { items: [1, 2, 3, 4, 5] })
      ];
      
      const result = evaluator.evaluate('length(input1.items) > 3', ruleParams);
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined properties gracefully', () => {
      const settings: ReSettings = { ignoreException: true };
      const tolerantEvaluator = new ExpressionEvaluator(settings);
      
      const ruleParams = [new RuleParameter('input1', { value: 10 })];
      
      const result = tolerantEvaluator.evaluate(
        'input1.nonExistentProperty > 5', 
        ruleParams
      );
      expect(result).toBe(false); // Should return false when ignoring exceptions
    });

    it('should throw errors when not ignoring exceptions', () => {
      const settings: ReSettings = { ignoreException: false };
      const strictEvaluator = new ExpressionEvaluator(settings);
      
      const ruleParams = [new RuleParameter('input1', { value: 10 })];
      
      expect(() => {
        strictEvaluator.evaluate('nonExistentVariable > 5', ruleParams);
      }).toThrow();
    });

    it('should handle division by zero', () => {
      const ruleParams = [new RuleParameter('input1', { a: 10, b: 0 })];
      
      const result = evaluator.evaluate('input1.a / input1.b == Infinity', ruleParams);
      expect(result).toBe(true);
    });
  });

  describe('Type Coercion', () => {
    it('should handle string to number comparisons', () => {
      const ruleParams = [new RuleParameter('input1', { stringNumber: '10' })];
      
      const result = evaluator.evaluate('input1.stringNumber > 5', ruleParams);
      expect(result).toBe(true);
    });

    it('should handle boolean conversions', () => {
      const ruleParams = [
        new RuleParameter('input1', { 
          truthyString: 'hello',
          falsyString: '',
          truthyNumber: 1,
          falsyNumber: 0
        })
      ];
      
      expect(evaluator.evaluate('input1.truthyString != ""', ruleParams)).toBe(true);
      expect(evaluator.evaluate('input1.falsyString == ""', ruleParams)).toBe(true);
      expect(evaluator.evaluate('input1.truthyNumber > 0', ruleParams)).toBe(true);
      expect(evaluator.evaluate('input1.falsyNumber == 0', ruleParams)).toBe(true);
    });
  });

  describe('Mathematical Operations', () => {
    it('should handle basic arithmetic', () => {
      const ruleParams = [new RuleParameter('input1', { a: 10, b: 5 })];
      
      expect(evaluator.evaluate('input1.a + input1.b == 15', ruleParams)).toBe(true);
      expect(evaluator.evaluate('input1.a - input1.b == 5', ruleParams)).toBe(true);
      expect(evaluator.evaluate('input1.a * input1.b == 50', ruleParams)).toBe(true);
      expect(evaluator.evaluate('input1.a / input1.b == 2', ruleParams)).toBe(true);
      expect(evaluator.evaluate('input1.a % 3 == 1', ruleParams)).toBe(true);
    });

    it('should handle mathematical functions', () => {
      const ruleParams = [new RuleParameter('input1', { value: 16 })];
      
      // Note: expr-eval supports Math functions
      const result = evaluator.evaluate('sqrt(input1.value) == 4', ruleParams);
      expect(result).toBe(true);
    });
  });
});