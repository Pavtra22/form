import { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, EyeOff, Save, Home, Loader2, Plus, Trash2, FileText } from 'lucide-react';

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
  const { 
      addElement, 
      reorderElements, 
      pages, 
      activePageId, 
      setActivePage, 
      addPage, 
      removePage,
      updatePageTitle 
  } = useBuilderStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const [widths, setWidths] = useState({ sidebar: 250, props: 300, preview: 400 });
  const resizingRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // --- Resizing Logic ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const panel = resizingRef.current;
    const screenWidth = window.innerWidth;
    const minCanvasWidth = 300;

    if (panel === 'sidebar') {
      const newWidth = e.clientX;
      const rightSideWidth = widths.props + (showPreview ? widths.preview : 0);
      const remainingForCanvas = screenWidth - newWidth - rightSideWidth;
      if (newWidth > 180 && newWidth < 500 && remainingForCanvas > minCanvasWidth) {
        setWidths(prev => ({ ...prev, sidebar: newWidth }));
      }
    } else if (panel === 'props') {
      const previewWidth = showPreview ? widths.preview : 0;
      const newWidth = screenWidth - e.clientX - previewWidth;
      const canvasWidth = e.clientX - widths.sidebar;
      if (newWidth > 200 && newWidth < 600 && canvasWidth > minCanvasWidth) {
        setWidths(prev => ({ ...prev, props: newWidth }));
      }
    } else if (panel === 'preview') {
      const newWidth = screenWidth - e.clientX;
      const canvasWidth = e.clientX - widths.sidebar - widths.props;
      if (newWidth > 300 && newWidth < 900 && canvasWidth > minCanvasWidth) {
        setWidths(prev => ({ ...prev, preview: newWidth }));
      }
    }
  }, [showPreview, widths.sidebar, widths.props, widths.preview]);

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
      // CHANGE: Use relative path /api/forms. The Vite proxy sends this to port 8080.
      return axios.post('/api/forms', newForm);
    },
    onSuccess: () => {
      setIsModalOpen(false);
      navigate({ to: '/forms' });
    },
    onError: (error) => {
        console.error("Save failed", error);
        alert("Failed to save. Is backend running?");
    }
  });

  const handleSave = () => {
    if (!formName.trim()) return;
    const formJson = JSON.stringify(pages);
    saveMutation.mutate({ name: formName, elements: formJson });
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    // Reorder within active page
    if (source.droppableId === 'CANVAS' && destination.droppableId === 'CANVAS') {
      reorderElements(source.index, destination.index);
    }
    // Add new element to active page
    if (source.droppableId === 'SIDEBAR' && destination.droppableId === 'CANVAS') {
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

  const previewSrc = generateFormHTML(formName || "Preview Form", pages);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen w-full flex-col bg-gray-50 overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b px-6 py-3 bg-white shadow-sm z-30 shrink-0 h-16">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-800">Form Builder</h1>
                <input 
                    type="text" value={formName} onChange={e => setFormName(e.target.value)}
                    placeholder="Form Name" className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                />
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 px-3 py-2 rounded text-sm border bg-white hover:bg-gray-50">
                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />} {showPreview ? "Hide" : "Preview"}
                </button>
                
                <div className="h-full w-px bg-gray-300 mx-2"></div>

                <button onClick={() => navigate({ to: '/forms' })} className="flex items-center gap-2 text-gray-600 px-3 py-2 hover:bg-gray-100 rounded text-sm">
                    <Home size={16} /> My Forms
                </button>

                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                    {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saveMutation.isPending ? "Saving..." : "Save"}
                </button>
            </div>
        </header>

        <main className={`flex flex-1 overflow-hidden relative ${isResizing ? 'pointer-events-none cursor-col-resize' : ''}`}>
          
          {/* Sidebar */}
          <div style={{ width: widths.sidebar }} className="flex flex-col border-r bg-white h-full overflow-hidden shrink-0">
             <Sidebar />
          </div>
          <Resizer onMouseDown={startResizing('sidebar')} />

          {/* Canvas Area with Page Tabs */}
          <div className="flex-1 bg-gray-100 h-full overflow-hidden min-w-[300px] flex flex-col relative">
             
             {/* --- Page Management Bar --- */}
             <div className="flex items-center gap-1 p-2 bg-white border-b overflow-x-auto">
                {pages.map((page) => (
                    <button
                        key={page.id}
                        onClick={() => setActivePage(page.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
                            ${activePageId === page.id 
                                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        <FileText size={14} />
                        <span className="whitespace-nowrap">{page.title}</span>
                    </button>
                ))}
                
                <button 
                    onClick={addPage}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded ml-2"
                    title="Add Page"
                >
                    <Plus size={16} />
                </button>
             </div>

             {/* Page Title Editor */}
             <div className="bg-gray-50 px-8 py-4 flex justify-between items-center">
                 <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Page Title:</span>
                     <input 
                        type="text"
                        value={pages.find(p => p.id === activePageId)?.title || ""}
                        onChange={(e) => updatePageTitle(activePageId, e.target.value)}
                        className="bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 text-gray-700 font-medium w-full"
                     />
                 </div>
                 {pages.length > 1 && (
                     <button onClick={() => removePage(activePageId)} className="text-red-400 hover:text-red-600 p-2" title="Delete Page">
                         <Trash2 size={18} />
                     </button>
                 )}
             </div>

             {/* Canvas */}
             <Canvas />
          </div>

          <Resizer onMouseDown={startResizing('props')} />
          <div style={{ width: widths.props }} className="flex flex-col border-l bg-white h-full overflow-hidden shrink-0 z-10">
            <PropertiesPanel />
          </div>

          {showPreview && (
            <>
                <Resizer onMouseDown={startResizing('preview')} />
                <PreviewPanel width={widths.preview} previewSrc={previewSrc} onClose={() => setShowPreview(false)} />
            </>
          )}

        </main>
        
        {/* Modal Logic */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-96">
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