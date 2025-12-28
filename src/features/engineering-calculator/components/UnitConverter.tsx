import React, { useState, useCallback, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { unitCategories, convertUnit } from '../data/units';

export const UnitConverter: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState(unitCategories[0].name);
    const [fromUnit, setFromUnit] = useState('');
    const [toUnit, setToUnit] = useState('');
    const [fromValue, setFromValue] = useState('');
    const [toValue, setToValue] = useState('');

    // Get current category
    const category = useMemo(() =>
        unitCategories.find(c => c.name === selectedCategory) || unitCategories[0],
        [selectedCategory]
    );

    // Initialize units when category changes
    React.useEffect(() => {
        if (category.units.length >= 2) {
            setFromUnit(category.units[0].id);
            setToUnit(category.units[1].id);
        }
        setFromValue('');
        setToValue('');
    }, [category]);

    // Convert when input changes
    const handleFromValueChange = useCallback((value: string) => {
        setFromValue(value);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && fromUnit && toUnit) {
            const result = convertUnit(numValue, fromUnit, toUnit, selectedCategory);
            setToValue(result !== null ? result.toPrecision(8).replace(/\.?0+$/, '') : 'Error');
        } else {
            setToValue('');
        }
    }, [fromUnit, toUnit, selectedCategory]);

    const handleToValueChange = useCallback((value: string) => {
        setToValue(value);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && fromUnit && toUnit) {
            const result = convertUnit(numValue, toUnit, fromUnit, selectedCategory);
            setFromValue(result !== null ? result.toPrecision(8).replace(/\.?0+$/, '') : 'Error');
        } else {
            setFromValue('');
        }
    }, [fromUnit, toUnit, selectedCategory]);

    // Swap units
    const handleSwap = useCallback(() => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
        setFromValue(toValue);
        setToValue(fromValue);
    }, [fromUnit, toUnit, fromValue, toValue]);

    // Handle unit selection change
    const handleFromUnitChange = useCallback((unitId: string) => {
        setFromUnit(unitId);
        // Recalculate
        const numValue = parseFloat(fromValue);
        if (!isNaN(numValue)) {
            const result = convertUnit(numValue, unitId, toUnit, selectedCategory);
            setToValue(result !== null ? result.toPrecision(8).replace(/\.?0+$/, '') : 'Error');
        }
    }, [fromValue, toUnit, selectedCategory]);

    const handleToUnitChange = useCallback((unitId: string) => {
        setToUnit(unitId);
        // Recalculate
        const numValue = parseFloat(fromValue);
        if (!isNaN(numValue)) {
            const result = convertUnit(numValue, fromUnit, unitId, selectedCategory);
            setToValue(result !== null ? result.toPrecision(8).replace(/\.?0+$/, '') : 'Error');
        }
    }, [fromValue, fromUnit, selectedCategory]);

    return (
        <div className="unit-converter">
            {/* Category selector */}
            <select
                className="unit-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
            >
                {unitCategories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                        {cat.name} ({cat.nameEN})
                    </option>
                ))}
            </select>

            {/* Conversion row */}
            <div className="unit-row">
                <input
                    type="number"
                    className="unit-input"
                    value={fromValue}
                    onChange={(e) => handleFromValueChange(e.target.value)}
                    placeholder="0"
                    onMouseDown={(e) => e.stopPropagation()}
                />
                <select
                    className="unit-select"
                    value={fromUnit}
                    onChange={(e) => handleFromUnitChange(e.target.value)}
                >
                    {category.units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                            {unit.symbol}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleSwap}
                    className="p-2 rounded hover:bg-gray-200 transition-colors"
                    title="Swap"
                >
                    <RefreshCw size={16} />
                </button>

                <input
                    type="number"
                    className="unit-input"
                    value={toValue}
                    onChange={(e) => handleToValueChange(e.target.value)}
                    placeholder="0"
                    onMouseDown={(e) => e.stopPropagation()}
                />
                <select
                    className="unit-select"
                    value={toUnit}
                    onChange={(e) => handleToUnitChange(e.target.value)}
                >
                    {category.units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                            {unit.symbol}
                        </option>
                    ))}
                </select>
            </div>

            {/* Quick conversion info */}
            {fromValue && toValue && (
                <div className="text-sm text-center" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                    {fromValue} {category.units.find(u => u.id === fromUnit)?.symbol} = {toValue} {category.units.find(u => u.id === toUnit)?.symbol}
                </div>
            )}
        </div>
    );
};
