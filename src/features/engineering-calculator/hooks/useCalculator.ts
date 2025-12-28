import { useState, useCallback, useMemo } from 'react';
import { evaluate, format } from 'mathjs';
import { convertUnit, unitCategories } from '../data/units';

export interface CalculationResult {
    id: string;
    expression: string;
    result: string;
    isError: boolean;
    timestamp: Date;
}

interface UseCalculatorOptions {
    onCalculation?: (result: CalculationResult) => void;
}

/**
 * Custom hook for calculator logic
 * Supports math.js expressions and custom engineering functions
 */
export const useCalculator = (options?: UseCalculatorOptions) => {
    const [history, setHistory] = useState<CalculationResult[]>([]);
    const [input, setInput] = useState('');

    // Custom scope with engineering constants and functions - memoized
    const customScope = useMemo(() => ({
        // Constants
        pi: Math.PI,
        e: Math.E,
        g: 9.80665, // gravity
        R: 8.314, // gas constant

        // Custom functions
        stress: (force: number, area: number) => force / area,
        strain: (deltaL: number, L: number) => deltaL / L,
        reynolds: (rho: number, v: number, D: number, mu: number) => (rho * v * D) / mu,

        // Unit conversion helper
        convert: (value: number, from: string, to: string) => {
            const result = convertUnit(value, from, to);
            return result ?? NaN;
        },
    }), []);

    const calculate = useCallback((expression: string) => {
        if (!expression.trim()) return;

        const id = Date.now().toString();
        let result: CalculationResult;

        try {
            // Evaluate the expression with custom scope
            const evalResult = evaluate(expression, customScope);

            // Format the result nicely
            const formattedResult = typeof evalResult === 'number'
                ? format(evalResult, { precision: 8, notation: 'auto' })
                : String(evalResult);

            result = {
                id,
                expression,
                result: formattedResult,
                isError: false,
                timestamp: new Date(),
            };
        } catch (error) {
            result = {
                id,
                expression,
                result: error instanceof Error ? error.message : 'Error',
                isError: true,
                timestamp: new Date(),
            };
        }

        setHistory(prev => [...prev, result]);
        setInput('');
        options?.onCalculation?.(result);

        return result;
    }, [customScope, options]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const removeFromHistory = useCallback((id: string) => {
        setHistory(prev => prev.filter(item => item.id !== id));
    }, []);

    const insertFormula = useCallback((formula: string) => {
        setInput(prev => prev + formula);
    }, []);

    return {
        input,
        setInput,
        history,
        calculate,
        clearHistory,
        removeFromHistory,
        insertFormula,
        unitCategories,
        convertUnit,
    };
};
