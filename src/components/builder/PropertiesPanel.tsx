import { useBuilderStore } from '../../store/useBuilderStore';
import { X } from 'lucide-react';

export function PropertiesPanel() {
  const { selectedElement, updateElement, setSelectedElement } = useBuilderStore();

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col items-center justify-center text-center">
        <p className="text-gray-400 font-medium">No element selected</p>
        <p className="text-sm text-gray-400 mt-2">Click on a field in the canvas to edit its properties.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-l border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <h2 className="font-bold text-gray-700">Edit Properties</h2>
        <button onClick={() => setSelectedElement(null)} className="text-gray-500 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Label Edit */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Label</label>
          <input
            type="text"
            value={selectedElement.label}
            onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Required Field</label>
          <input
            type="checkbox"
            checked={selectedElement.required}
            onChange={(e) => updateElement(selectedElement.id, { required: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>

        {/* Placeholder (Only for text inputs) */}
        {['text', 'email', 'phone', 'textarea'].includes(selectedElement.type) && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Placeholder</label>
            <input
              type="text"
              placeholder="e.g. Enter your name..."
              value={selectedElement.placeholder || ''}
              onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}