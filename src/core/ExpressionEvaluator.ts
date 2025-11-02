import { Parser } from 'expr-eval';
import * as _ from 'lodash';
import { RuleParameter, ScopedParam, ReSettings } from '../models';

/**
 * JavaScript expression evaluator that handles rule expressions
 * Converts Microsoft Rules Engine expressions to JavaScript-compatible format
 */
export class ExpressionEvaluator {
  private parser: Parser;
  private settings: ReSettings;

  constructor(settings: ReSettings = {}) {
    this.settings = settings;
    this.parser = new Parser();
  }

  /**
   * Evaluates an expression with given parameters and scoped params
   */
  public evaluate<T = any>(
    expression: string, 
    ruleParameters: RuleParameter[], 
    scopedParams: { [key: string]: any } = {},
    customTypes: { [key: string]: any } = {}
  ): T {
    try {
      // Convert expression from C# syntax to JavaScript syntax
      const jsExpression = this.convertCSharpToJavaScript(expression);
      
      // Build evaluation context
      const context = this.buildEvaluationContext(ruleParameters, scopedParams, customTypes);
      
      // Parse and evaluate the expression
      const expr = this.parser.parse(jsExpression);
      const result = expr.evaluate(context);
      
      return result as T;
    } catch (error) {
      if (this.settings.ignoreException) {
        return false as T;
      }
      if (this.settings.enableExceptionAsErrorMessage) {
        throw new Error(`Expression evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw error;
    }
  }

  /**
   * Builds the evaluation context from rule parameters and scoped params
   */
  private buildEvaluationContext(
    ruleParameters: RuleParameter[], 
    scopedParams: { [key: string]: any } = {},
    customTypes: { [key: string]: any } = {}
  ): { [key: string]: any } {
    const context: { [key: string]: any } = {};

    // Add rule parameters to context
    ruleParameters.forEach((param, index) => {
      if (param.name) {
        context[param.name] = param.value;
      } else {
        // Default naming: input1, input2, input3, etc.
        context[`input${index + 1}`] = param.value;
      }
    });

    // Add scoped parameters
    Object.assign(context, scopedParams);

    // Add custom types/functions
    Object.assign(context, this.settings.customTypes || {});
    Object.assign(context, customTypes);

    // Add utility functions
    context._ = _; // Lodash utilities
    
    // Add common string methods that might be used in expressions
    context.ToLower = (str: string) => str?.toLowerCase?.() || '';
    context.ToUpper = (str: string) => str?.toUpperCase?.() || '';
    context.Contains = (str: string, search: string) => str?.includes?.(search) || false;
    context.StartsWith = (str: string, search: string) => str?.startsWith?.(search) || false;
    context.EndsWith = (str: string, search: string) => str?.endsWith?.(search) || false;
    
    // Add array utility functions
    context.includes = (arr: any[], item: any) => Array.isArray(arr) ? arr.includes(item) : false;
    context.length = (arr: any[] | string) => arr?.length || 0;
    
    // Add constants that might be needed
    context.Infinity = Infinity;
    context.NaN = NaN;

    return context;
  }

  /**
   * Converts C# expression syntax to JavaScript expression syntax
   */
  private convertCSharpToJavaScript(expression: string): string {
    let jsExpression = expression;

    // Convert C# operators to expr-eval compatible operators
    jsExpression = jsExpression.replace(/\bAND\b/gi, ' and ');
    jsExpression = jsExpression.replace(/\bOR\b/gi, ' or ');
    jsExpression = jsExpression.replace(/\bNOT\b/gi, 'not ');
    
    // Convert && to 'and' and || to 'or' for expr-eval
    jsExpression = jsExpression.replace(/&&/g, ' and ');
    jsExpression = jsExpression.replace(/\|\|/g, ' or ');

    // Convert C# string methods to function calls that we'll provide in context
    jsExpression = jsExpression.replace(/(\w+)\.ToLower\(\)/g, 'ToLower($1)');
    jsExpression = jsExpression.replace(/(\w+)\.ToUpper\(\)/g, 'ToUpper($1)');
    jsExpression = jsExpression.replace(/(\w+)\.Contains\(/g, 'Contains($1, ');

    // Convert === to == for expr-eval (it uses == for comparison)
    jsExpression = jsExpression.replace(/===/g, '==');
    jsExpression = jsExpression.replace(/!==/g, '!=');

    // Handle null checks
    jsExpression = jsExpression.replace(/\bnull\b/g, 'null');

    return jsExpression;
  }

  /**
   * Evaluates scoped parameters in the correct order
   */
  public evaluateScopedParams(
    scopedParams: ScopedParam[], 
    ruleParameters: RuleParameter[],
    existingScopedParams: { [key: string]: any } = {}
  ): { [key: string]: any } {
    const evaluated: { [key: string]: any } = { ...existingScopedParams };

    // Evaluate scoped params in order, allowing later ones to reference earlier ones
    for (const param of scopedParams) {
      try {
        const value = this.evaluate(param.expression, ruleParameters, evaluated);
        evaluated[param.name] = value;
      } catch (error) {
        if (!this.settings.ignoreException) {
          throw new Error(`Failed to evaluate scoped parameter '${param.name}': ${error instanceof Error ? error.message : String(error)}`);
        }
        evaluated[param.name] = null;
      }
    }

    return evaluated;
  }
}