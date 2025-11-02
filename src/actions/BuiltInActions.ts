import { ActionBase, ActionContext, RuleParameter } from '../models';

/**
 * Built-in action that evaluates an expression and returns the result
 */
export class OutputExpressionAction extends ActionBase {
  async run(context: ActionContext, _ruleParameters: RuleParameter[]): Promise<any> {
    const expression = context.expression;
    if (!expression) {
      throw new Error('OutputExpression action requires an "expression" in context');
    }

    // This would need access to the expression evaluator
    // In practice, this action is handled directly in the RulesEngine class
    // This class is here for reference and custom action patterns
    return null;
  }
}

/**
 * Built-in action that evaluates another rule
 */
export class EvaluateRuleAction extends ActionBase {
  async run(context: ActionContext, _ruleParameters: RuleParameter[]): Promise<any> {
    const workflowName = context.workflowName;
    const ruleName = context.ruleName;
    
    if (!workflowName || !ruleName) {
      throw new Error('EvaluateRule action requires "workflowName" and "ruleName" in context');
    }

    // This would need access to the rules engine instance
    // In practice, this action is handled directly in the RulesEngine class
    // This class is here for reference and custom action patterns
    return null;
  }
}

/**
 * Example custom action for logging
 */
export class LogAction extends ActionBase {
  async run(context: ActionContext, ruleParameters: RuleParameter[]): Promise<any> {
    const message = context.message || 'Rule executed';
    const level = context.level || 'info';
    
    console.log(`[${level.toUpperCase()}] ${message}`, {
      parameters: ruleParameters.map(p => ({ name: p.name, value: p.value })),
      context
    });

    return { logged: true, message, level };
  }
}

/**
 * Example custom action for sending notifications
 */
export class NotificationAction extends ActionBase {
  async run(context: ActionContext, _ruleParameters: RuleParameter[]): Promise<any> {
    const recipient = context.recipient;
    const message = context.message;
    const type = context.type || 'email';

    if (!recipient || !message) {
      throw new Error('NotificationAction requires "recipient" and "message" in context');
    }

    // Mock notification sending
    console.log(`Sending ${type} notification to ${recipient}: ${message}`);
    
    // In a real implementation, you would integrate with your notification service
    // await this.notificationService.send(type, recipient, message);

    return {
      sent: true,
      recipient,
      message,
      type,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Example custom action for database operations
 */
export class DatabaseAction extends ActionBase {
  async run(context: ActionContext, ruleParameters: RuleParameter[]): Promise<any> {
    const operation = context.operation;
    const table = context.table;
    const data = context.data;

    if (!operation || !table) {
      throw new Error('DatabaseAction requires "operation" and "table" in context');
    }

    // Mock database operation
    console.log(`Performing ${operation} on table ${table}`, { data, parameters: ruleParameters });

    // In a real implementation, you would integrate with your database
    // const result = await this.databaseService.execute(operation, table, data);

    return {
      operation,
      table,
      success: true,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Factory functions for built-in actions
 */
export const BuiltInActions = {
  OutputExpression: () => new OutputExpressionAction(),
  EvaluateRule: () => new EvaluateRuleAction(),
  Log: () => new LogAction(),
  Notification: () => new NotificationAction(),
  Database: () => new DatabaseAction()
};