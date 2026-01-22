import { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, EyeOff, Save, Home, Loader2, X } from 'lucide-react';

import { Sidebar } from '../components/builder/Sidebar';
import { Canvas } from '../components/builder/Canvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { PreviewPanel } from '../components/builder/PreviewPanel';
import { Resizer } from '../components/builder/Resizer';
import { TOOLS } from '../components/builder/tools';
import { useBuilderStore } from '../store/useBuilderStore';
import type { ElementType } from '../types';
import { generateFormHTML } from '../utils/formHtmlGenerator';

export function Builder() {
  const { addElement, reorderElements, elements, selectedElement, setSelectedElement } = useBuilderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  
  // Layout State
  const [showPreview, setShowPreview] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Panel Widths (Desktop)
  const [widths, setWidths] = useState({ 
    props: 300, 
    preview: 400 
  });
  
  const resizingRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // --- Resizing Logic (Desktop Only) ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const panel = resizingRef.current;
    const screenWidth = window.innerWidth;
    const minCanvasWidth = 300;
    const sidebarFixed = 256; 

    if (panel === 'props') {
      const previewWidth = showPreview ? widths.preview : 0;
      const newWidth = screenWidth - e.clientX - previewWidth;
      const canvasWidth = e.clientX - sidebarFixed;
      if (newWidth > 200 && newWidth < 600 && canvasWidth > minCanvasWidth) {
        setWidths(prev => ({ ...prev, props: newWidth }));
      }
    }
    else if (panel === 'preview') {
      const newWidth = screenWidth - e.clientX;
      const canvasWidth = e.clientX - sidebarFixed - widths.props;
      if (newWidth > 300 && newWidth < 900 && canvasWidth > minCanvasWidth) {
        setWidths(prev => ({ ...prev, preview: newWidth }));
      }
    }
  }, [showPreview, widths.props, widths.preview]); 

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const startResizing = (panel: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); 
    resizingRef.current = panel;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // --- Data Logic ---
  const saveMutation = useMutation({
    mutationFn: async (newForm: { name: string; elements: string }) => {
      return axios.post('http://localhost:8080/api/forms', newForm);
    },
    onSuccess: () => {
      setIsModalOpen(false);
      navigate({ to: '/forms' });
    },
    onError: (error) => {
        console.error("Save failed", error);
        alert("Failed to save form. Is the backend running?");
    }
  });

  const handleSave = () => {
    if (!formName.trim()) return;
    const elementsJson = JSON.stringify(elements);
    saveMutation.mutate({ name: formName, elements: elementsJson });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // 1. Reordering in Canvas
    if (source.droppableId === 'CANVAS' && destination.droppableId === 'CANVAS') {
      reorderElements(source.index, destination.index);
    }

    // 2. Dragging from Sidebar (Desktop OR Mobile)
    if ((source.droppableId === 'SIDEBAR' || source.droppableId === 'SIDEBAR_MOBILE') && destination.droppableId === 'CANVAS') {
      const tool = TOOLS[source.index];
      addElement(destination.index, {
        id: uuidv4(),
        type: tool.type as ElementType,
        label: tool.label,
        required: false,
        placeholder: '',
      });
    }
  };

  const previewSrc = generateFormHTML(formName || "Preview Form", elements);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen w-full flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b px-4 py-3 bg-white shadow-sm z-30 shrink-0 gap-3 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
             <div className="flex items-center gap-2">
                 <button 
                    onClick={() => navigate({ to: '/forms' })} 
                    className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded"
                 >
                    <Home size={20} />
                 </button>
                 <h1 className="text-lg font-bold text-gray-800 truncate">Builder</h1>
             </div>
             <input 
                type="text" 
                placeholder="Form Name" 
                className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                value={formName}
                onChange={e => setFormName(e.target.value)}
             />
          </div>
          
          <div className="flex gap-2 justify-end">
            <button 
              onClick={() => setShowPreview(!showPreview)} 
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors border ${showPreview ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? "Hide" : "Preview"}
            </button>
            
            <button onClick={() => navigate({ to: '/forms' })} className="hidden md:flex items-center gap-2 text-gray-600 px-3 py-2 hover:bg-gray-100 rounded text-sm">
                <Home size={16} /> My Forms
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                disabled={elements.length === 0 || saveMutation.isPending}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className={`flex flex-1 overflow-hidden relative ${isResizing ? 'pointer-events-none cursor-col-resize' : ''}`}>
          
          {/* 1. Sidebar (Desktop Only) */}
          <div className="hidden md:flex flex-col border-r bg-white h-full overflow-hidden shrink-0 z-20 w-64">
             <Sidebar variant="desktop" />
          </div>

          {/* 2. Mobile Sidebar (AOD Bottom Bar) */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 h-24 bg-white border-t border-gray-200 z-40 pb-safe">
             <Sidebar variant="mobile" />
          </div>

          {/* 3. Canvas */}
          <div className="flex-1 bg-gray-100 h-full overflow-hidden min-w-[300px] flex flex-col relative pb-24 md:pb-0"> 
             <Canvas />
          </div>

          {/* 4. Properties Panel */}
          <div className="hidden md:block">
            <Resizer onMouseDown={startResizing('props')} />
          </div>
          
          <div 
            style={{ width: window.innerWidth < 768 ? '100%' : widths.props }} 
            className={`
                flex flex-col border-l bg-white h-full overflow-hidden shrink-0 z-50
                md:relative md:z-10
                ${selectedElement ? 'fixed inset-x-0 bottom-0 h-[50vh] md:h-full border-t md:border-t-0 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] md:shadow-none animate-in slide-in-from-bottom' : 'hidden md:flex'}
            `}
          >
            <div className="md:hidden flex justify-between items-center p-3 border-b bg-gray-50">
                <span className="font-bold text-gray-700 text-sm">Edit Field Properties</span>
                <button onClick={() => setSelectedElement(null)} className="p-1 bg-gray-200 rounded-full"><X size={16}/></button>
            </div>
            <PropertiesPanel />
          </div>

          {/* 5. Preview Panel */}
          {showPreview && (
            <>
                <div className="hidden md:block">
                    <Resizer onMouseDown={startResizing('preview')} />
                </div>
                {/* Desktop Preview */}
                <div className="hidden md:block">
                    <PreviewPanel 
                        width={widths.preview} 
                        previewSrc={previewSrc} 
                        onClose={() => setShowPreview(false)} 
                    />
                </div>
                {/* Mobile Preview Modal (Fix for "Preview not available") */}
                <div className="md:hidden fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-right">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                        <h2 className="font-bold text-lg">Live Preview</h2>
                        <button onClick={() => setShowPreview(false)} className="p-2 bg-gray-200 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="flex-1 w-full h-full relative">
                        <iframe 
                            srcDoc={previewSrc} 
                            className="absolute inset-0 w-full h-full border-0" 
                            title="Mobile Preview"
                        />
                    </div>
                </div>
            </>
          )}

        </main>

        {/* Modal for Final Save Confirmation */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                    <h2 className="text-lg font-bold mb-4">Confirm Save</h2>
                    <p className="mb-4 text-gray-600">Are you ready to save <strong>{formName || "Untitled Form"}</strong>?</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Confirm Save
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </DragDropContext>
  );
}