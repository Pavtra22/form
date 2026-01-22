import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useBuilderStore } from '../../store/useBuilderStore';
import { Trash2, GripVertical } from 'lucide-react';
import type { FormElement } from '../../types';
import { VideoRecorder } from '../form-elements/VideoRecorder';

// Helper component to render specific form inputs
const RenderField = ({ element }: { element: FormElement }) => {
  const baseClass = "w-full p-2 border border-gray-300 rounded mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 pointer-events-none"; // pointer-events-none prevents inputs from stealing focus during drag
  const placeholder = element.placeholder || "";

  switch (element.type) {
    case 'text':
    case 'email':
    case 'phone':
      return <input type="text" className={baseClass} placeholder={placeholder || "Short answer text"} readOnly />;
    case 'textarea':
      return <textarea className={baseClass} rows={3} placeholder={placeholder || "Long answer text"} readOnly />;
    case 'select':
      return (
        <div className="w-full p-2 border border-gray-300 rounded mt-1 bg-gray-50 text-gray-500">
          Dropdown options...
        </div>
      );
    case 'date':
      return <input type="date" className={baseClass} readOnly />;
    case 'stars':
        return <div className="flex gap-1 text-yellow-400 text-xl mt-1">★★★★★</div>;
    case 'video':
         return <VideoRecorder />;
    default:
      return null;
  }
};

export function Canvas() {
  const { elements, removeElement, selectedElement, setSelectedElement } = useBuilderStore();

  return (
    // Clicking the background deselects the current item
    <div 
      className="flex-1 bg-gray-100 p-8 h-full overflow-y-auto" 
      onClick={() => setSelectedElement(null)}
    >
      <Droppable droppableId="CANVAS">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              max-w-2xl mx-auto min-h-[600px] p-8 rounded-xl shadow-sm border-2 border-dashed transition-colors pb-32
              ${snapshot.isDraggingOver ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-300'}
            `}
            // Prevent deselecting when clicking inside the white canvas box
            onClick={(e) => e.stopPropagation()} 
          >
            {elements.length === 0 && (
              <div className="text-center text-gray-400 mt-20 pointer-events-none">
                <p className="text-lg">Drop components here</p>
              </div>
            )}

            {elements.map((el, index) => (
              <Draggable key={el.id} draggableId={el.id} index={index}>
                {(provided, snapshot) => {
                   const isSelected = selectedElement?.id === el.id;
                   return (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{ ...provided.draggableProps.style }}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop click from bubbling to parent
                        setSelectedElement(el);
                      }}
                      className={`
                        relative group mb-4 p-4 rounded-lg border bg-white transition-all cursor-pointer
                        ${isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-gray-200 hover:border-blue-300'}
                        ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 z-50 opacity-90' : ''}
                      `}
                    >
                      <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                             {/* Drag Handle - Only this icon initiates drag */}
                             <div 
                               {...provided.dragHandleProps} 
                               className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                             >
                               <GripVertical size={16} />
                             </div>
                             
                             <label className="text-sm font-medium text-gray-700">
                               {el.label}
                               {el.required && <span className="text-red-500 ml-1">*</span>}
                             </label>
                          </div>
                          
                          {/* Delete Button - Visible on hover or selection */}
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                removeElement(el.id);
                            }} 
                            className={`text-gray-400 hover:text-red-500 transition-opacity p-1 rounded hover:bg-red-50
                              ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                            `}
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                      
                      <div className="pl-8">
                        <RenderField element={el} />
                      </div>
                    </div>
                   );
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}