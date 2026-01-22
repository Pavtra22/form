import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { useBuilderStore } from '../../store/useBuilderStore';
import { TOOLS } from './tools';
import { v4 as uuidv4 } from 'uuid';
import type { ElementType } from '../../types';

interface SidebarProps {
  variant?: 'desktop' | 'mobile';
}

export function Sidebar({ variant = 'desktop' }: SidebarProps) {
  const { addElement, elements } = useBuilderStore();

  const handleAddDirectly = (tool: typeof TOOLS[0]) => {
    addElement(elements.length, {
      id: uuidv4(),
      type: tool.type as ElementType,
      label: tool.label,
      required: false,
      placeholder: '',
    });
  };

  // --- MOBILE: Horizontal Scroll Bar (Now DND Enabled) ---
  if (variant === 'mobile') {
    return (
      <div className="w-full h-24 bg-white border-t border-gray-200 flex items-center z-50">
        <Droppable droppableId="SIDEBAR_MOBILE" isDropDisabled={true} direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex items-center gap-4 px-4 overflow-x-auto w-full h-full no-scrollbar"
            >
              {TOOLS.map((tool, index) => (
                <Draggable key={tool.id} draggableId={`mobile-${tool.id}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style }}
                      onClick={() => handleAddDirectly(tool)}
                      className={`
                        flex flex-col items-center justify-center min-w-[70px] h-20 rounded-lg active:scale-95 transition-transform
                        ${snapshot.isDragging ? 'opacity-50 ring-2 ring-blue-500 bg-blue-50' : ''}
                      `}
                    >
                      <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-1">
                        <tool.icon size={20} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 leading-tight text-center w-full truncate">
                        {tool.label}
                      </span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }

  // --- DESKTOP: Full Fixed Sidebar ---
  return (
    <div className="flex flex-col bg-white h-full w-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="font-bold text-gray-700">Components</h2>
        <p className="text-xs text-gray-500">Drag to add</p>
      </div>

      <Droppable droppableId="SIDEBAR" isDropDisabled={true}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex-1 overflow-y-auto p-3 space-y-3"
          >
            {TOOLS.map((tool, index) => (
              <Draggable key={tool.id} draggableId={tool.id} index={index}>
                {(provided, snapshot) => (
                  <>
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style }}
                      onClick={() => handleAddDirectly(tool)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-grab transition-all relative group
                        ${snapshot.isDragging 
                            ? 'bg-blue-50 border-blue-500 shadow-lg' 
                            : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-sm'}
                      `}
                    >
                      <tool.icon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{tool.label}</span>
                      
                      <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600">
                        <Plus size={16} />
                      </div>
                    </div>

                    {snapshot.isDragging && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 opacity-50">
                         <tool.icon className="w-5 h-5 text-gray-400" />
                         <span className="text-sm font-medium text-gray-400">{tool.label}</span>
                      </div>
                    )}
                  </>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}