import React, { useState, useMemo } from 'react';
import { materials, materialCategories, type Material } from '../data/materials';

interface MaterialSelectorProps {
    onSelect?: (material: Material) => void;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({ onSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('steel');
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

    // Filter materials by category
    const filteredMaterials = useMemo(() => {
        return Object.entries(materials).filter(
            ([, mat]) => mat.category === selectedCategory
        );
    }, [selectedCategory]);

    // Get selected material data
    const selectedMaterialData = selectedMaterial ? materials[selectedMaterial] : null;

    const handleSelect = (key: string, material: Material) => {
        setSelectedMaterial(key);
        onSelect?.(material);
    };

    return (
        <div className="p-4">
            {/* Category tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {materialCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${selectedCategory === cat.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Material grid */}
            <div className="material-grid">
                {filteredMaterials.map(([key, mat]) => (
                    <div
                        key={key}
                        className={`material-card ${selectedMaterial === key ? 'selected' : ''}`}
                        onClick={() => handleSelect(key, mat)}
                    >
                        <div className="material-name">{mat.name}</div>
                        <div className="material-props">
                            <div className="material-prop">
                                <span>E:</span>
                                <span>{mat.elasticModulus} GPa</span>
                            </div>
                            <div className="material-prop">
                                <span>σy:</span>
                                <span>{mat.yieldStrength} MPa</span>
                            </div>
                            <div className="material-prop">
                                <span>ρ:</span>
                                <span>{mat.density} kg/m³</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Selected material details */}
            {selectedMaterialData && (
                <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                        {selectedMaterialData.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Elastisite Modülü (E):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.elasticModulus} GPa</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Kayma Modülü (G):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.shearModulus} GPa</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Akma Dayanımı (σy):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.yieldStrength} MPa</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Çekme Dayanımı (σu):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.tensileStrength} MPa</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Yoğunluk (ρ):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.density} kg/m³</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Poisson Oranı (ν):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.poissonsRatio}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Isıl İletkenlik (k):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.thermalConductivity} W/(m·K)</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Isıl Genleşme (α):</span>
                            <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.thermalExpansion}×10⁻⁶ /K</span>
                        </div>
                        {selectedMaterialData.meltingPoint && (
                            <div className="flex justify-between col-span-2">
                                <span style={{ color: 'var(--color-text)', opacity: 0.7 }}>Erime Noktası:</span>
                                <span style={{ color: 'var(--color-text)' }}>{selectedMaterialData.meltingPoint} °C</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
