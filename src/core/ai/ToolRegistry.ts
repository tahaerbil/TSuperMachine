import type { Tool, ToolDefinition } from './types';

class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    register(tool: Tool) {
        if (this.tools.has(tool.definition.name)) {
            console.warn(`Tool ${tool.definition.name} is already registered. Overwriting.`);
        }
        this.tools.set(tool.definition.name, tool);
    }

    getTool(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    getDefinitions(): ToolDefinition[] {
        return Array.from(this.tools.values()).map(t => t.definition);
    }

    async executeTool(name: string, args: unknown): Promise<unknown> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool ${name} not found`);
        }
        try {
            return await tool.execute(args);
        } catch (error) {
            console.error(`Error executing tool ${name}:`, error);
            throw error;
        }
    }
}

export const toolRegistry = new ToolRegistry();
