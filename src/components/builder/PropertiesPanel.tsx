import { useBuilderStore } from '../../store/useBuilderStore';
import { X, Plus, Trash2, CornerDownRight, Settings2, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PageLogic, LogicOperator } from '../../types';

export function PropertiesPanel() {
  const { 
    selectedElement, 
    updateElement, 
    setSelectedElement,
    pages,
    activePageId,
    addCondition,
    removeCondition
  } = useBuilderStore();

  const [activeTab, setActiveTab] = useState<'props' | 'logic'>('props');

  // Logic State Local
  const activePage = pages.find(p => p.id === activePageId);
  const eligibleElements = activePage?.elements.filter(el => 
    el.type === 'stars' || el.type === 'select'
  ) || [];

  const [newLogic, setNewLogic] = useState<Partial<PageLogic>>({
    operator: 'equals',
    value: ''
  });

  const getOperatorLabel = (op: LogicOperator) => {
      switch(op) {
          case 'equals': return '=';
          case 'not_equals': return '≠';
          case 'greater_than': return '>';
          case 'less_than': return '<';
          default: return op;
      }
  };

  // Helper to get the trigger element object so we can check its type (select vs stars)
  const selectedTriggerElement = activePage?.elements.find(el => el.id === newLogic.triggerElementId);

  function handleAddLogic() {
    if (!newLogic.triggerElementId || !newLogic.targetPageId || !newLogic.value) return;
    
    // For dropdowns, force operator to 'equals' if not set
    const operator = selectedTriggerElement?.type === 'select' ? 'equals' : (newLogic.operator as LogicOperator);

    addCondition(activePageId, {
        id: uuidv4(),
        triggerElementId: newLogic.triggerElementId!,
        operator: operator,
        value: newLogic.value!,
        targetPageId: newLogic.targetPageId!
    });
    setNewLogic({ operator: 'equals', value: '' }); // Reset
  }

  // Helper to add a new option to a select element
  const addOption = () => {
      if (!selectedElement) return;
      const currentOptions = selectedElement.options || [];
      const newOption = `Option ${currentOptions.length + 1}`;
      updateElement(selectedElement.id, { options: [...currentOptions, newOption] });
  };

  const removeOption = (index: number) => {
      if (!selectedElement || !selectedElement.options) return;
      const newOptions = [...selectedElement.options];
      newOptions.splice(index, 1);
      updateElement(selectedElement.id, { options: newOptions });
  };

  const updateOption = (index: number, val: string) => {
      if (!selectedElement || !selectedElement.options) return;
      const newOptions = [...selectedElement.options];
      newOptions[index] = val;
      updateElement(selectedElement.id, { options: newOptions });
  };

  return (
    <div className="flex flex-col h-full bg-white">
        {/* Custom Tab Header */}
        <div className="flex p-2 bg-gray-50 border-b gap-1">
            <button 
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all
                    ${activeTab === 'props' 
                        ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                onClick={() => setActiveTab('props')}
            >
                <Settings2 size={16} /> Properties
            </button>
            <button 
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all
                    ${activeTab === 'logic' 
                        ? 'bg-white text-purple-600 shadow-sm border border-gray-200' 
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
                onClick={() => setActiveTab('logic')}
            >
                <GitBranch size={16} /> Logic
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'props' ? (
                selectedElement ? (
                    renderPropertiesForm()
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center px-4">
                        <Settings2 size={48} className="mb-4 opacity-20" />
                        <p>Select an element on the canvas to edit its properties.</p>
                    </div>
                )
            ) : (
                renderLogicTab()
            )}
        </div>
    </div>
  );

  function renderPropertiesForm() {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Edit Element</h2>
                <button 
                onClick={() => setSelectedElement(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                <X size={20} />
                </button>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Label Question
                    </label>
                    <input
                        type="text"
                        value={selectedElement!.label}
                        onChange={(e) => updateElement(selectedElement!.id, { label: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. What is your name?"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        Placeholder Text
                    </label>
                    <input
                        type="text"
                        value={selectedElement!.placeholder || ''}
                        onChange={(e) => updateElement(selectedElement!.id, { placeholder: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. Type here..."
                    />
                </div>

                {/* --- OPTIONS EDITOR (Only for Select) --- */}
                {selectedElement?.type === 'select' && (
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex justify-between items-center">
                            Dropdown Options
                            <button onClick={addOption} className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
                                <Plus size={12} /> Add
                            </button>
                        </label>
                        <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            {(!selectedElement.options || selectedElement.options.length === 0) && (
                                <p className="text-xs text-gray-400 italic text-center py-2">No options added yet.</p>
                            )}
                            {selectedElement.options?.map((opt, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <input 
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(idx, e.target.value)}
                                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
                                    />
                                    <button onClick={() => removeOption(idx)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                        <input
                            type="checkbox"
                            checked={selectedElement!.required}
                            onChange={(e) => updateElement(selectedElement!.id, { required: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                            <span className="block text-sm font-medium text-gray-900 group-hover:text-blue-700">Required Field</span>
                            <span className="block text-xs text-gray-500">User must fill this out</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
      );
  }

  function renderLogicTab() {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="pb-4 border-b">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <GitBranch size={20} className="text-purple-500" />
                    Page Logic
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Redirect users based on their answers on <strong>{activePage?.title}</strong>.
                </p>
            </div>

            {/* Existing Conditions List */}
            <div className="space-y-3">
                {activePage?.conditions && activePage.conditions.length > 0 ? (
                    activePage.conditions.map(cond => {
                        const triggerEl = activePage.elements.find(e => e.id === cond.triggerElementId);
                        const targetPage = pages.find(p => p.id === cond.targetPageId);
                        
                        return (
                            <div key={cond.id} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-xs">IF</span>
                                        <span className="truncate max-w-[120px]" title={triggerEl?.label}>"{triggerEl?.label}"</span>
                                    </div>
                                    <div className="flex items-center gap-2 pl-4">
                                        <span className="font-mono font-bold text-purple-600 bg-purple-50 px-1.5 rounded text-xs">{getOperatorLabel(cond.operator)}</span>
                                        <span className="font-medium text-gray-800">"{cond.value}"</span>
                                    </div>
                                    <div className="flex items-center gap-2 pl-4 pt-1">
                                        <CornerDownRight size={14} className="text-purple-400" />
                                        <span className="text-xs uppercase font-bold text-gray-400">JUMP TO</span>
                                        <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-xs">
                                            {targetPage?.title || 'Unknown Page'}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeCondition(activePageId, cond.id)}
                                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-sm text-gray-400">No logic rules yet.</p>
                    </div>
                )}
            </div>

            {/* Add New Logic Form */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                    <Plus size={14} /> Add New Rule
                </h4>
                
                {/* 1. IF Trigger */}
                <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1.5">If answer to:</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onChange={e => {
                                setNewLogic({ ...newLogic, triggerElementId: e.target.value, value: '' }); 
                            }}
                            value={newLogic.triggerElementId || ''}
                        >
                            <option value="">Select Question...</option>
                            {eligibleElements.length > 0 ? (
                                eligibleElements.map(el => (
                                    <option key={el.id} value={el.id}>{el.label} ({el.type})</option>
                                ))
                            ) : (
                                <option disabled>No valid inputs (Add Stars/Dropdown)</option>
                            )}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                {/* 2. Operator & Value */}
                {selectedTriggerElement?.type === 'select' ? (
                    // --- DROPDOWN SPECIFIC UI ---
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-xs font-medium text-gray-700 block mb-1.5">Condition:</label>
                            <div className="w-full bg-gray-100 border border-gray-300 text-gray-500 py-2 px-2 rounded-md text-sm cursor-not-allowed">
                                Equals (=)
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-gray-700 block mb-1.5">Value:</label>
                            <select 
                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                onChange={e => setNewLogic({...newLogic, value: e.target.value})}
                                value={newLogic.value}
                            >
                                <option value="">Select Option...</option>
                                {selectedTriggerElement.options?.map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ) : (
                    // --- STARS / DEFAULT UI ---
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1.5">Condition:</label>
                            <select 
                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                onChange={e => setNewLogic({...newLogic, operator: e.target.value as LogicOperator})}
                                value={newLogic.operator}
                            >
                                <option value="equals">Equals (=)</option>
                                <option value="not_equals">Not Equals (≠)</option>
                                <option value="greater_than">Greater than (&gt;)</option>
                                <option value="less_than">Less than (&lt;)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1.5">Value:</label>
                            <input 
                                type="text" 
                                className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g. 5"
                                value={newLogic.value || ''}
                                onChange={e => setNewLogic({...newLogic, value: e.target.value})}
                            />
                        </div>
                    </div>
                )}

                {/* 3. Target Page */}
                <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1.5">Then jump to:</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onChange={e => setNewLogic({...newLogic, targetPageId: e.target.value})}
                            value={newLogic.targetPageId || ''}
                        >
                            <option value="">Select Page...</option>
                            {pages.filter(p => p.id !== activePageId).map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleAddLogic}
                    disabled={!newLogic.triggerElementId || !newLogic.targetPageId || !newLogic.value}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                    <Plus size={16} /> Add Logic Rule
                </button>
            </div>
        </div>
      );
  }
}