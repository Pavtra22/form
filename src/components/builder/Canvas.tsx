import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useBuilderStore } from '../../store/useBuilderStore';
import { Trash2, GripVertical, ChevronDown, ChevronRight, PlusCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import type { FormElement } from '../../types';
import { VideoRecorder } from '../form-elements/VideoRecorder';

/**
 * Helper component to render specific form inputs in a read-only preview state.
 * Prevents input interaction during the design process to avoid interfering with drag-and-drop.
 */
const RenderField = ({ element }: { element: FormElement }) => {
  const baseClass = "w-full p-2 border border-gray-300 rounded mt-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 pointer-events-none"; 
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
        <select className="w-full p-2 border border-gray-300 rounded mt-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 pointer-events-none">
          <option value="" disabled selected>Select an option</option>
          {element.options && element.options.length > 0 ? (
            element.options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))
          ) : (
            <>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </>
          )}
        </select>
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
  const { 
    pages, 
    removeElement, 
    selectedElement, 
    setSelectedElement, 
    removePage, 
    updatePageTitle, 
    addPage 
  } = useBuilderStore();

  // State to manage which page accordions are expanded
  const [expandedPages, setExpandedPages] = useState<string[]>(pages.map(p => p.id));

  /**
   * Toggles the visibility of a page's content accordion.
   */
  const togglePage = (id: string) => {
    setExpandedPages(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div 
      className="flex-1 bg-gray-50 p-8 h-full overflow-y-auto" 
      onClick={() => setSelectedElement(null)}
    >
      {/* Outer Droppable for reordering the pages themselves */}
      <Droppable droppableId="CANVAS_PAGES" type="PAGE">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="max-w-3xl mx-auto space-y-6 pb-40"
          >
            {pages.map((page, pageIndex) => (
              <Draggable key={page.id} draggableId={page.id} index={pageIndex}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-shadow ${
                      snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-400' : 'border-gray-200'
                    }`}
                  >
                    {/* Page Accordion Header and Drag Handle */}
                    <div 
                      className="flex items-center justify-between p-4 bg-gray-50 border-b group cursor-pointer"
                      onClick={() => togglePage(page.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          {...provided.dragHandleProps} 
                          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1"
                          onClick={(e) => e.stopPropagation()} // Stop accordion toggle when dragging
                        >
                          <GripVertical size={20} />
                        </div>
                        
                        <div className="text-blue-500">
                          {expandedPages.includes(page.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>

                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                           <FileText size={16} className="text-gray-400" />
                           <input 
                              type="text"
                              value={page.title}
                              onChange={(e) => updatePageTitle(page.id, e.target.value)}
                              className="bg-transparent font-bold text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 transition-colors w-full"
                           />
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removePage(page.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Page"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Accordion Body: Droppable area for form elements within this specific page */}
                    {expandedPages.includes(page.id) && (
                      <Droppable droppableId={page.id} type="ELEMENT">
                        {(elemProvided, elemSnapshot) => (
                          <div
                            ref={elemProvided.innerRef}
                            {...elemProvided.droppableProps}
                            className={`p-6 min-h-[150px] transition-colors ${
                              elemSnapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-white'
                            }`}
                          >
                            {page.elements.length === 0 && (
                              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                                <p>Drag components here</p>
                              </div>
                            )}

                            {page.elements.map((el, elIndex) => (
                              <Draggable key={el.id} draggableId={el.id} index={elIndex}>
                                {(elProvided, elSnapshot) => {
                                  const isSelected = selectedElement?.id === el.id;
                                  return (
                                    <div
                                      ref={elProvided.innerRef}
                                      {...elProvided.draggableProps}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedElement(el);
                                      }}
                                      className={`
                                        relative group mb-4 p-4 rounded-lg border bg-white transition-all cursor-pointer
                                        ${isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-gray-200 hover:border-blue-300'}
                                        ${elSnapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 z-50' : ''}
                                      `}
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          <div 
                                            {...elProvided.dragHandleProps} 
                                            className="text-gray-300 hover:text-gray-500 p-1 cursor-grab"
                                          >
                                            <GripVertical size={14} />
                                          </div>
                                          <label className="text-sm font-medium text-gray-700">
                                            {el.label} {el.required && <span className="text-red-500">*</span>}
                                          </label>
                                        </div>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                                          className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Remove Element"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <div className="pl-6"><RenderField element={el} /></div>
                                    </div>
                                  );
                                }}
                              </Draggable>
                            ))}
                            {elemProvided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {/* Global Add Page Button */}
            <button
              onClick={addPage}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <PlusCircle size={20} />
              <span>Add New Page</span>
            </button>
          </div>
        )}
      </Droppable>
    </div>
  );
}