import { RulesEngine, RuleParameter, Workflow, ReSettings } from '../src/index';

describe('RulesEngine', () => {
  let rulesEngine: RulesEngine;
  let sampleWorkflow: Workflow;

  beforeEach(() => {
    sampleWorkflow = {
      workflowName: 'TestWorkflow',
      rules: [
        {
          ruleName: 'SimpleRule',
          expression: 'input1.value > 10'
        },
        {
          ruleName: 'ComplexRule',
          expression: 'input1.value > 5 and input2.status == "active"'
        }
      ]
    };
    rulesEngine = new RulesEngine([sampleWorkflow]);
  });

  describe('Constructor', () => {
    it('should create a rules engine with workflows', () => {
      expect(rulesEngine).toBeInstanceOf(RulesEngine);
      expect(rulesEngine.getWorkflowNames()).toContain('TestWorkflow');
    });

    it('should accept custom settings', () => {
      const settings: ReSettings = {
        ignoreException: true,
        isExpressionCaseSensitive: true
      };
      const customEngine = new RulesEngine([sampleWorkflow], settings);
      expect(customEngine).toBeInstanceOf(RulesEngine);
    });
  });

  describe('executeAllRulesAsync', () => {
    it('should execute all rules successfully', async () => {
      const input1 = { value: 15 };
      const input2 = { status: 'active' };

      const results = await rulesEngine.executeAllRulesAsync(
        'TestWorkflow',
        new RuleParameter('input1', input1),
        new RuleParameter('input2', input2)
      );

      expect(results).toHaveLength(2);
      expect(results[0].rule.ruleName).toBe('SimpleRule');
      expect(results[0].isSuccess).toBe(true);
      expect(results[1].rule.ruleName).toBe('ComplexRule');
      expect(results[1].isSuccess).toBe(true);
    });

    it('should handle rule failures', async () => {
      const input1 = { value: 5 }; // Fails SimpleRule
      const input2 = { status: 'inactive' }; // Fails ComplexRule

      const results = await rulesEngine.executeAllRulesAsync(
        'TestWorkflow',
        new RuleParameter('input1', input1),
        new RuleParameter('input2', input2)
      );

      expect(results).toHaveLength(2);
      expect(results[0].isSuccess).toBe(false);
      expect(results[1].isSuccess).toBe(false);
    });

    it('should throw error for non-existent workflow', async () => {
      await expect(
        rulesEngine.executeAllRulesAsync('NonExistentWorkflow')
      ).rejects.toThrow("Workflow 'NonExistentWorkflow' not found");
    });
  });

  describe('executeRuleAsync', () => {
    it('should execute a specific rule by name', async () => {
      const input1 = { value: 15 };

      const result = await rulesEngine.executeRuleAsync(
        'TestWorkflow',
        'SimpleRule',
        new RuleParameter('input1', input1)
      );

      expect(result).not.toBeNull();
      expect(result!.rule.ruleName).toBe('SimpleRule');
      expect(result!.isSuccess).toBe(true);
    });

    it('should throw error for non-existent rule', async () => {
      await expect(
        rulesEngine.executeRuleAsync('TestWorkflow', 'NonExistentRule')
      ).rejects.toThrow("Rule 'NonExistentRule' not found");
    });
  });

  describe('Scoped Parameters', () => {
    it('should handle global parameters', async () => {
      const workflowWithGlobalParams: Workflow = {
        workflowName: 'GlobalParamsTest',
        globalParams: [
          {
            name: 'threshold',
            expression: '100'
          }
        ],
        rules: [
          {
            ruleName: 'ThresholdCheck',
            expression: 'input1.value > threshold'
          }
        ]
      };

      const engine = new RulesEngine([workflowWithGlobalParams]);
      const result = await engine.executeRuleAsync(
        'GlobalParamsTest',
        'ThresholdCheck',
        new RuleParameter('input1', { value: 150 })
      );

      expect(result!.isSuccess).toBe(true);
    });

    it('should handle local parameters', async () => {
      const workflowWithLocalParams: Workflow = {
        workflowName: 'LocalParamsTest',
        rules: [
          {
            ruleName: 'LocalParamRule',
            localParams: [
              {
                name: 'doubledValue',
                expression: 'input1.value * 2'
              }
            ],
            expression: 'doubledValue > 20'
          }
        ]
      };

      const engine = new RulesEngine([workflowWithLocalParams]);
      const result = await engine.executeRuleAsync(
        'LocalParamsTest',
        'LocalParamRule',
        new RuleParameter('input1', { value: 15 })
      );

      expect(result!.isSuccess).toBe(true);
    });
  });

  describe('Actions', () => {
    it('should execute OutputExpression action on success', async () => {
      const workflowWithActions: Workflow = {
        workflowName: 'ActionsTest',
        rules: [
          {
            ruleName: 'ActionRule',
            expression: 'input1.value > 10',
            actions: {
              onSuccess: {
                name: 'OutputExpression',
                context: {
                  expression: 'input1.value * 2'
                }
              }
            }
          }
        ]
      };

      const engine = new RulesEngine([workflowWithActions]);
      const result = await engine.executeRuleAsync(
        'ActionsTest',
        'ActionRule',
        new RuleParameter('input1', { value: 15 })
      );

      expect(result!.isSuccess).toBe(true);
      expect(result!.actionResult?.output).toBe(30);
    });

    it('should execute action on failure', async () => {
      const workflowWithActions: Workflow = {
        workflowName: 'FailureActionsTest',
        rules: [
          {
            ruleName: 'FailureActionRule',
            expression: 'input1.value > 100',
            actions: {
              onFailure: {
                name: 'OutputExpression',
                context: {
                  expression: '"Rule failed"'
                }
              }
            }
          }
        ]
      };

      const engine = new RulesEngine([workflowWithActions]);
      const result = await engine.executeRuleAsync(
        'FailureActionsTest',
        'FailureActionRule',
        new RuleParameter('input1', { value: 5 })
      );

      expect(result!.isSuccess).toBe(false);
      expect(result!.actionResult?.output).toBe('Rule failed');
    });
  });

  describe('Nested Rules', () => {
    it('should handle nested rules with AND operator', async () => {
      const nestedWorkflow: Workflow = {
        workflowName: 'NestedTest',
        rules: [
          {
            ruleName: 'ParentRule',
            operator: 'And' as any,
            rules: [
              {
                ruleName: 'Child1',
                expression: 'input1.value > 10'
              },
              {
                ruleName: 'Child2',
                expression: 'input1.value < 50'
              }
            ]
          }
        ]
      };

      const engine = new RulesEngine([nestedWorkflow]);
      const result = await engine.executeRuleAsync(
        'NestedTest',
        'ParentRule',
        new RuleParameter('input1', { value: 25 })
      );

      expect(result!.isSuccess).toBe(true);
      expect(result!.childResults).toHaveLength(2);
      expect(result!.childResults![0].isSuccess).toBe(true);
      expect(result!.childResults![1].isSuccess).toBe(true);
    });

    it('should handle nested rules with OR operator', async () => {
      const nestedWorkflow: Workflow = {
        workflowName: 'NestedOrTest',
        rules: [
          {
            ruleName: 'ParentOrRule',
            operator: 'Or' as any,
            rules: [
              {
                ruleName: 'Child1',
                expression: 'input1.value > 100'  // Will fail
              },
              {
                ruleName: 'Child2',
                expression: 'input1.value > 10'   // Will succeed
              }
            ]
          }
        ]
      };

      const engine = new RulesEngine([nestedWorkflow]);
      const result = await engine.executeRuleAsync(
        'NestedOrTest',
        'ParentOrRule',
        new RuleParameter('input1', { value: 25 })
      );

      expect(result!.isSuccess).toBe(true);
      expect(result!.childResults![0].isSuccess).toBe(false);
      expect(result!.childResults![1].isSuccess).toBe(true);
    });
  });

  describe('Custom Types', () => {
    it('should support custom types in expressions', async () => {
      const customUtils = {
        IsEven: (num: number) => num % 2 === 0,
        StringLength: (str: string) => str.length
      };

      const customTypesWorkflow: Workflow = {
        workflowName: 'CustomTypesTest',
        rules: [
          {
            ruleName: 'EvenNumberRule',
            expression: 'customUtils.IsEven(input1.number)'
          },
          {
            ruleName: 'StringLengthRule',
            expression: 'customUtils.StringLength(input1.text) > 5'
          }
        ]
      };

      const settings: ReSettings = {
        customTypes: { customUtils }
      };

      const engine = new RulesEngine([customTypesWorkflow], settings);
      
      const results = await engine.executeAllRulesAsync(
        'CustomTypesTest',
        new RuleParameter('input1', { number: 10, text: 'Hello World' })
      );

      expect(results[0].isSuccess).toBe(true);  // 10 is even
      expect(results[1].isSuccess).toBe(true);  // 'Hello World' length > 5
    });
  });

  describe('Error Handling', () => {
    it('should handle expression evaluation errors', async () => {
      const errorWorkflow: Workflow = {
        workflowName: 'ErrorTest',
        rules: [
          {
            ruleName: 'ErrorRule',
            expression: 'input1.nonExistentProperty.someMethod()'
          }
        ]
      };

      const engine = new RulesEngine([errorWorkflow]);
      
      const result = await engine.executeRuleAsync(
        'ErrorTest',
        'ErrorRule',
        new RuleParameter('input1', { value: 10 })
      );

      expect(result!.isSuccess).toBe(false);
      expect(result!.exceptionMessage).toBeDefined();
    });

    it('should ignore exceptions when configured', async () => {
      const errorWorkflow: Workflow = {
        workflowName: 'IgnoreErrorTest',
        rules: [
          {
            ruleName: 'ErrorRule',
            expression: 'input1.nonExistentProperty.someMethod()'
          }
        ]
      };

      const settings: ReSettings = {
        ignoreException: true
      };

      const engine = new RulesEngine([errorWorkflow], settings);
      
      const result = await engine.executeRuleAsync(
        'IgnoreErrorTest',
        'ErrorRule',
        new RuleParameter('input1', { value: 10 })
      );

      expect(result!.isSuccess).toBe(false);
      // Should not throw exception
    });
  });

  describe('Workflow Management', () => {
    it('should add new workflows', () => {
      const newWorkflow: Workflow = {
        workflowName: 'NewWorkflow',
        rules: [
          {
            ruleName: 'NewRule',
            expression: 'true'
          }
        ]
      };

      rulesEngine.addOrUpdateWorkflow(newWorkflow);
      expect(rulesEngine.getWorkflowNames()).toContain('NewWorkflow');
    });

    it('should remove workflows', () => {
      const removed = rulesEngine.removeWorkflow('TestWorkflow');
      expect(removed).toBe(true);
      expect(rulesEngine.getWorkflowNames()).not.toContain('TestWorkflow');
    });

    it('should get workflow by name', () => {
      const workflow = rulesEngine.getWorkflow('TestWorkflow');
      expect(workflow).toBeDefined();
      expect(workflow!.workflowName).toBe('TestWorkflow');
    });
  });
});