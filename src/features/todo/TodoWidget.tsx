import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/store';
import { Plus, Trash2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

interface TodoWidgetProps {
    id: string;
    initialTodos?: TodoItem[];
}

export const TodoWidget: React.FC<TodoWidgetProps> = ({ id, initialTodos = [] }) => {
    const [todos, setTodos] = useState<TodoItem[]>(initialTodos);
    const [newTodoText, setNewTodoText] = useState('');
    const { updateWidget } = useStore();
    const { t } = useTranslation();

    // Save to store whenever todos change
    useEffect(() => {
        updateWidget(id, { data: { todos } });
    }, [todos, id, updateWidget]);

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoText.trim()) return;

        const newTodo: TodoItem = {
            id: crypto.randomUUID(),
            text: newTodoText,
            completed: false,
            createdAt: Date.now()
        };

        setTodos([...todos, newTodo]);
        setNewTodoText('');
    };

    const toggleTodo = (todoId: string) => {
        setTodos(todos.map(todo =>
            todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (todoId: string) => {
        setTodos(todos.filter(todo => todo.id !== todoId));
    };

    const completedCount = todos.filter(t => t.completed).length;

    return (
        <div className="w-full h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
            {/* Header with stats */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-text)' }}>
                        {completedCount} / {todos.length} {t('app.widgets.todo.completed') || 'completed'}
                    </span>
                    {todos.length > 0 && (
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(completedCount / todos.length) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Todo list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {todos.length === 0 && (
                    <div className="text-center mt-8" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
                        {t('app.widgets.todo.empty') || 'No tasks yet. Add one below!'}
                    </div>
                )}
                {todos.map(todo => (
                    <div
                        key={todo.id}
                        className="group flex items-center gap-3 p-3 rounded-lg border transition-colors"
                        style={{
                            borderColor: 'var(--color-border)',
                            backgroundColor: 'var(--color-surface)'
                        }}
                    >
                        <button
                            onClick={() => toggleTodo(todo.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${todo.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-green-400'
                                }`}
                        >
                            {todo.completed && <Check size={14} className="text-white" />}
                        </button>
                        <span
                            className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
                                }`}
                        >
                            {todo.text}
                        </span>
                        <button
                            onClick={() => deleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add new todo */}
            <form onSubmit={addTodo} className="p-3 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        placeholder={t('app.widgets.todo.placeholder') || 'Add a new task...'}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <button
                        type="submit"
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};
