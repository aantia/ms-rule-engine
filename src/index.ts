// Core classes
export { RulesEngine } from './core/RulesEngine';
export { ExpressionEvaluator } from './core/ExpressionEvaluator';

// Models and interfaces
export {
  ActionContext,
  RuleAction,
  RuleActions,
  ScopedParam,
  RuleOperator,
  RuleExpressionType,
  Rule,
  Workflow,
  RuleParameter,
  ActionResult,
  RuleResult,
  ReSettings,
  NestedRuleExecutionMode,
  ActionBase
} from './models';

// Built-in actions
export {
  OutputExpressionAction,
  EvaluateRuleAction,
  LogAction,
  NotificationAction,
  DatabaseAction,
  BuiltInActions
} from './actions/BuiltInActions';

// Version
export const VERSION = '1.0.0';