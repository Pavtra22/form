import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TOOLS } from './tools';
import { useBuilderStore } from '../../store/useBuilderStore';

export function Sidebar() {
  // We use the store to ensure the sidebar stays in sync with the active state
  const { activePageId } = useBuilderStore();

  return (
    <div className="bg-white border-b border-gray-200 flex items-center h-14 px-4 w-full shadow-sm">
      <div className="flex items-center gap-2 mr-6 border-r pr-4 border-gray-200">
        <h2 className="font-bold text-gray-700 text-xs uppercase tracking-widest">
          Component Tools
        </h2>
      </div>

      {/* Note: isDropDisabled={true} prevents elements from being 
          dropped BACK into the toolbar. 
      */}
      <Droppable 
        droppableId="SIDEBAR" 
        isDropDisabled={true} 
        direction="horizontal"
        type="ELEMENT"
      >
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex items-center gap-3 transition-colors ${
              snapshot.isDraggingOver ? 'bg-gray-50' : ''
            }`}
          >
            {TOOLS.map((tool, index) => (
              <Draggable 
                key={tool.id} 
                draggableId={tool.id} 
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    title={tool.label}
                    className={`
                      p-2.5 rounded-lg border flex items-center justify-center cursor-grab transition-all
                      ${snapshot.isDragging 
                        ? 'bg-blue-600 border-blue-600 shadow-xl scale-110 z-[100]' 
                        : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm'}
                    `}
                  >
                    <tool.icon 
                      className={`w-5 h-5 ${
                        snapshot.isDragging ? 'text-white' : 'text-gray-600'
                      }`} 
                    />
                    
                    {/* Optional: Show label only when dragging for clarity */}
                    {snapshot.isDragging && (
                      <span className="ml-2 text-xs font-bold text-white whitespace-nowrap">
                        {tool.label}
                      </span>
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase">
          Targeting:
        </span>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
           Page ID: {activePageId.split('-')[0]}...
        </span>
      </div>
    </div>
  );
}