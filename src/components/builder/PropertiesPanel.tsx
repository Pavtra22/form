import { useBuilderStore } from '../../store/useBuilderStore';
import { X, Plus, Trash2, Settings2, GitBranch, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { LogicRule, LogicCondition, ConditionOperator } from '../../types';

export function PropertiesPanel() {
  const { 
    selectedElement, 
    updateElement, 
    setSelectedElement,
    pages,
    activePageId,
    addLogicRule,
    removeLogicRule,
    updateLogicRule,
    addConditionToRule,
    removeConditionFromRule
  } = useBuilderStore();

  const [activeTab, setActiveTab] = useState<'props' | 'logic'>('props');

  // Logic State
  const activePage = pages.find(p => p.id === activePageId);
  const eligibleElements = activePage?.elements.filter(el => 
    el.type === 'stars' || el.type === 'select'
  ) || [];

  // Temporary state for a new rule creation
  const [newRuleTarget, setNewRuleTarget] = useState('');

  // Helper for operator labels (re-added if needed for display, otherwise remove)
  // const getOperatorLabel = (op: ConditionOperator) => { ... } // Removed as unused if not used in JSX

  // Helper to add a new condition to an existing rule
  const handleAddCondition = (ruleId: string) => {
      if (eligibleElements.length === 0) return;
      const firstEl = eligibleElements[0];
      const newCond: LogicCondition = {
          id: uuidv4(),
          triggerElementId: firstEl.id,
          operator: 'equals',
          value: ''
      };
      addConditionToRule(activePageId, ruleId, newCond);
  };

  // Helper to update a specific condition inside a rule
  const handleUpdateCondition = (rule: LogicRule, condId: string, updates: Partial<LogicCondition>) => {
      const newConditions = rule.conditions.map(c => 
          c.id === condId ? { ...c, ...updates } : c
      );
      updateLogicRule(activePageId, rule.id, { conditions: newConditions });
  };

  const handleCreateRule = () => {
      if (!newRuleTarget) return;
      const newRule: LogicRule = {
          id: uuidv4(),
          targetPageId: newRuleTarget,
          matchType: 'AND',
          conditions: [] // Start empty, user adds conditions
      };
      addLogicRule(activePageId, newRule);
      setNewRuleTarget('');
      // Automatically add first condition placeholder
      setTimeout(() => handleAddCondition(newRule.id), 0);
  };

  // --- Element Property Helpers ---
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
        {/* Header Tabs */}
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
                selectedElement ? renderPropertiesForm() : renderEmptyState()
            ) : (
                renderLogicTab()
            )}
        </div>
    </div>
  );

  function renderEmptyState() {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center px-4">
            <Settings2 size={48} className="mb-4 opacity-20" />
            <p>Select an element on the canvas to edit its properties.</p>
        </div>
      );
  }

  function renderPropertiesForm() {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center pb-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Edit {selectedElement?.type}</h2>
                <button onClick={() => setSelectedElement(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Label</label>
                    <input
                        type="text"
                        value={selectedElement!.label}
                        onChange={(e) => updateElement(selectedElement!.id, { label: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {selectedElement?.type !== 'stars' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Placeholder</label>
                        <input
                            type="text"
                            value={selectedElement!.placeholder || ''}
                            onChange={(e) => updateElement(selectedElement!.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                )}

                {/* Dropdown Options */}
                {selectedElement?.type === 'select' && (
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Options</label>
                            <button onClick={addOption} className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 font-medium">
                                <Plus size={12} /> Add
                            </button>
                        </div>
                        <div className="space-y-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {(!selectedElement.options || selectedElement.options.length === 0) && (
                                <p className="text-xs text-gray-400 italic text-center py-2">No options added.</p>
                            )}
                            {selectedElement.options?.map((opt, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <GripVertical size={12} className="text-gray-300" />
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
                        </div>
                    </label>
                </div>
            </div>
        </div>
      );
  }

  function renderLogicTab() {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
            <div className="pb-4 border-b">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <GitBranch size={20} className="text-purple-500" />
                    Logic Flows
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Define navigation rules for <strong>{activePage?.title}</strong>.
                </p>
            </div>

            {/* List of Logic Rules */}
            <div className="space-y-4">
                {activePage?.logicRules?.map((rule) => {
                    return (
                        <div key={rule.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden group">
                            {/* Rule Header */}
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <span className="font-bold text-xs uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">JUMP TO</span>
                                    {/* Editable Target Page */}
                                    <select 
                                        className="font-medium truncate max-w-[150px] bg-transparent border-b border-dashed border-gray-400 focus:outline-none focus:border-purple-500"
                                        value={rule.targetPageId}
                                        onChange={(e) => updateLogicRule(activePageId, rule.id, { targetPageId: e.target.value })}
                                    >
                                        {pages.filter(p => p.id !== activePageId).map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <button onClick={() => removeLogicRule(activePageId, rule.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Conditions List */}
                            <div className="p-3 space-y-2">
                                {rule.conditions.map((cond, cIdx) => {
                                    const triggerEl = activePage.elements.find(e => e.id === cond.triggerElementId);
                                    
                                    return (
                                        <div key={cond.id} className="flex flex-col gap-2 relative pl-4 border-l-2 border-purple-200">
                                            {cIdx > 0 && (
                                                <div className="absolute -left-[19px] top-0 bg-purple-50 text-[10px] font-bold text-purple-600 px-1 rounded border border-purple-200">
                                                    {rule.matchType}
                                                </div>
                                            )}
                                            
                                            {/* Logic Row */}
                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                {/* 1. Trigger */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500 font-medium">IF ANSWER TO</span>
                                                    <button onClick={() => removeConditionFromRule(activePageId, rule.id, cond.id)} className="text-red-400 hover:text-red-600">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                                <select 
                                                    className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-purple-500 outline-none"
                                                    value={cond.triggerElementId}
                                                    onChange={(e) => handleUpdateCondition(rule, cond.id, { triggerElementId: e.target.value, value: '' })}
                                                >
                                                    {eligibleElements.length > 0 ? (
                                                        eligibleElements.map(el => (
                                                            <option key={el.id} value={el.id}>{el.label}</option>
                                                        ))
                                                    ) : (
                                                        <option value="" disabled>No inputs available</option>
                                                    )}
                                                </select>

                                                {/* 2. Operator & Value */}
                                                <div className="flex gap-2">
                                                    {triggerEl?.type === 'select' ? (
                                                        // Dropdown specific Logic
                                                        <div className="w-full flex gap-2">
                                                            <div className="w-1/3 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs flex items-center justify-center text-gray-500">
                                                                is
                                                            </div>
                                                            <select 
                                                                className="w-2/3 border border-gray-300 rounded px-2 py-1 bg-white text-xs" 
                                                                value={cond.value}
                                                                onChange={(e) => handleUpdateCondition(rule, cond.id, { value: e.target.value })}
                                                            >
                                                                <option value="" disabled>Select Option</option>
                                                                {triggerEl.options?.map((opt, i) => (
                                                                    <option key={i} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        // Standard Logic (Stars, etc)
                                                        <>
                                                            <select 
                                                                className="w-1/3 border border-gray-300 rounded px-2 py-1 bg-white text-xs"
                                                                value={cond.operator}
                                                                onChange={(e) => handleUpdateCondition(rule, cond.id, { operator: e.target.value as ConditionOperator })}
                                                            >
                                                                <option value="equals">=</option>
                                                                <option value="not_equals">≠</option>
                                                                <option value="greater_than">&gt;</option>
                                                                <option value="less_than">&lt;</option>
                                                            </select>
                                                            <input 
                                                                className="w-2/3 border border-gray-300 rounded px-2 py-1 bg-white text-xs" 
                                                                value={cond.value}
                                                                onChange={(e) => handleUpdateCondition(rule, cond.id, { value: e.target.value })}
                                                                placeholder="Value"
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add Condition Button */}
                                <div className="pt-2">
                                    <button 
                                        onClick={() => handleAddCondition(rule.id)}
                                        className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                                    >
                                        <Plus size={12} /> AND condition
                                    </button>
                                </div>
                            </div>

                            {/* Match Type Toggle (Only if >1 condition) */}
                            {rule.conditions.length > 1 && (
                                <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Match:</span>
                                    <div className="flex bg-white rounded border border-gray-300 overflow-hidden">
                                        <button 
                                            onClick={() => updateLogicRule(activePageId, rule.id, { matchType: 'AND' })}
                                            className={`px-2 py-0.5 text-[10px] font-bold ${rule.matchType === 'AND' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            ALL (AND)
                                        </button>
                                        <div className="w-px bg-gray-300"></div>
                                        <button 
                                            onClick={() => updateLogicRule(activePageId, rule.id, { matchType: 'OR' })}
                                            className={`px-2 py-0.5 text-[10px] font-bold ${rule.matchType === 'OR' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            ANY (OR)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Create New Rule Section */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Create New Logic Jump</label>
                    <div className="flex gap-2">
                        <select 
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            value={newRuleTarget}
                            onChange={e => setNewRuleTarget(e.target.value)}
                        >
                            <option value="">Select Target Page...</option>
                            {pages.filter(p => p.id !== activePageId).map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        <button 
                            onClick={handleCreateRule}
                            disabled={!newRuleTarget}
                            className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }
}