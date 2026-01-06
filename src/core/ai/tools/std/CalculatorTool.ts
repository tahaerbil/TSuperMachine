import type { Tool, ToolDefinition } from '../../types';
import { evaluate } from 'mathjs';

export const CalculatorTool: Tool = {
    definition: {
        name: 'calculate',
        description: 'Evaluates a mathematical expression. Use this for any math questions.',
        parameters: {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: 'The math expression to evaluate, e.g., "sin(45 deg) * 5"'
                }
            },
            required: ['expression']
        }
    } as ToolDefinition,

    async execute(args: unknown): Promise<unknown> {
        const { expression } = args as { expression: string };
        try {
            const result = evaluate(expression);
            return { success: true, result: result.toString() };
        } catch (error) {
            return { success: false, error: `Error evaluating expression: ${error}` };
        }
    }
};

