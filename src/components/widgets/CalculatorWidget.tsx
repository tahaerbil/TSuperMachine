import React, { useState } from 'react';
import { evaluate } from 'mathjs';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CalculatorWidget: React.FC = () => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<{ expression: string; result: string }[]>([]);
    const { t } = useTranslation();

    const handleCalculate = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        try {
            const result = evaluate(input);
            setHistory(prev => [...prev, { expression: input, result: String(result) }]);
            setInput('');
        } catch (error) {
            setHistory(prev => [...prev, { expression: input, result: 'Error' }]);
        }
    };

    return (
        <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-sm">
                {history.map((item, index) => (
                    <div key={index} className="flex flex-col border-b pb-2 last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="text-right opacity-70" style={{ color: 'var(--color-text)' }}>{item.expression}</div>
                        <div className="font-bold text-right" style={{ color: 'var(--color-text)' }}>= {item.result}</div>
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="text-center opacity-50 mt-4" style={{ color: 'var(--color-text)' }}>
                        {t('app.widgets.calculator.empty')}
                    </div>
                )}
            </div>
            <form onSubmit={handleCalculate} className="p-2 border-t flex gap-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <input
                    type="text"
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                        backgroundColor: 'var(--color-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text)'
                    }}
                    placeholder={t('app.widgets.calculator.placeholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                />
                <button
                    type="submit"
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};
