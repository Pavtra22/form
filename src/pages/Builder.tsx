import { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from '@tanstack/react-router';
import axios from 'axios';
import { Save, Home, Loader2 } from 'lucide-react';

import { Sidebar } from '../components/builder/Sidebar';
import { Canvas } from '../components/builder/Canvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { PreviewPanel } from '../components/builder/PreviewPanel';
import { Resizer } from '../components/builder/Resizer';
import { TOOLS } from '../components/builder/tools';
import { useBuilderStore } from '../store/useBuilderStore';
import type { ElementType, FormPage, FormElement } from '../types';
import { generateFormHTML } from '../utils/formHtmlGenerator';

export function Builder() {
  const { 
      addElement, 
      reorderElements, 
      reorderPages,
      pages, 
      setForm
  } = useBuilderStore();
  
  const params = useParams({ strict: false });
  const formId = params.formId;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [isLoading, setIsLoading] = useState(!!formId);
  const [isSaving, setIsSaving] = useState(false);
  
  const [widths, setWidths] = useState({ sidebar: 350, props: 300 });
  const resizingRef = useRef<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!formId) return;
    const fetchForm = async () => {
        try {
            const res = await axios.get(`/api/forms/${formId}`);
            const data = res.data;
            setFormName(data.name);
            const raw = JSON.parse(data.elements);
            let loadedPages: FormPage[] = [];

            if (Array.isArray(raw) && raw.length > 0 && raw[0].elements) {
                loadedPages = raw;
            } else if (Array.isArray(raw)) {
                loadedPages = [{ id: uuidv4(), title: 'Step 1', elements: raw as FormElement[] }];
            } else {
                loadedPages = [{ id: uuidv4(), title: 'Step 1', elements: [] }];
            }
            setForm(loadedPages);
        } catch (e) {
            console.error("Failed to parse form elements", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchForm();
  }, [formId, setForm]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'PAGE') {
      reorderPages(source.index, destination.index);
      return;
    }

    if (source.droppableId === 'SIDEBAR') {
      const tool = TOOLS[source.index];
      const targetPageId = destination.droppableId; 

      addElement(destination.index, {
        id: uuidv4(),
        type: tool.type as ElementType,
        label: tool.label,
        required: false,
        placeholder: '',
      }, targetPageId);
      return;
    }

    if (source.droppableId === destination.droppableId) {
      reorderElements(source.index, destination.index, destination.droppableId);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    const screenWidth = window.innerWidth;

    if (resizingRef.current === 'sidebar') {
      if (e.clientX > 250 && e.clientX < 500) {
        setWidths(prev => ({ ...prev, sidebar: e.clientX }));
      }
    } else if (resizingRef.current === 'props') {
      const newWidth = screenWidth - e.clientX;
      if (newWidth > 250 && newWidth < 500) {
        setWidths(prev => ({ ...prev, props: newWidth }));
      }
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const startResizing = (panel: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = panel;
    setIsResizing(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setIsSaving(true);
    try {
        const payload = { name: formName, elements: JSON.stringify(pages) };
        if (formId) {
            await axios.put(`/api/forms/${formId}`, payload);
        } else {
            await axios.post('/api/forms', payload);
        }
        setIsModalOpen(false);
        navigate({ to: '/forms' });
    } catch (error) {
        console.error("Save failed", error);
        alert("Failed to save. Is backend running?");
    } finally {
        setIsSaving(false);
    }
  };

  const previewSrc = generateFormHTML(formName || "Preview Form", pages);

  if (isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-50">
              <Loader2 size={32} className="animate-spin text-blue-600" />
          </div>
      );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen w-full flex-col bg-gray-50 overflow-hidden">
        
        <header className="flex items-center justify-between border-b px-6 py-3 bg-white shadow-sm z-30 shrink-0 h-16">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-800">{formId ? 'Edit Form' : 'New Form'}</h1>
                <input 
                    type="text" value={formName} onChange={e => setFormName(e.target.value)}
                    placeholder="Form Name" className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                />
            </div>
            <div className="flex gap-2">
                <button onClick={() => navigate({ to: '/forms' })} className="flex items-center gap-2 text-gray-600 px-4 py-2 hover:bg-gray-100 rounded text-sm font-medium transition-colors">
                    <Home size={16} /> My Forms
                </button>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                    <Save size={16} /> {formId ? "Update" : "Save"}
                </button>
            </div>
        </header>

        <div className="w-full bg-white border-b z-20">
            <Sidebar />
        </div>

        <main className={`flex flex-1 overflow-hidden relative ${isResizing ? 'pointer-events-none' : ''}`}>
          
          <div style={{ width: widths.sidebar }} className="flex flex-col border-r bg-gray-100 h-full overflow-hidden shrink-0">
             <Canvas />
          </div>
          <Resizer onMouseDown={startResizing('sidebar')} />

          <div className="flex-1 bg-white h-full overflow-hidden flex flex-col relative">
             <div className="flex items-center justify-center p-2 bg-gray-50 border-b text-xs font-bold text-gray-400 uppercase tracking-widest">
                Live Form Preview
             </div>
             <div className="flex-1 overflow-y-auto p-4 bg-gray-200/50">
                <div className="w-full h-full shadow-2xl bg-white rounded-lg overflow-hidden">
                    <PreviewPanel width="100%" previewSrc={previewSrc} />
                </div>
             </div>
          </div>

          <Resizer onMouseDown={startResizing('props')} />
          <div style={{ width: widths.props }} className="flex flex-col border-l bg-white h-full overflow-hidden shrink-0">
            <PropertiesPanel />
          </div>

        </main>
        
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                    <h2 className="text-lg font-bold mb-4">Confirm {formId ? 'Update' : 'Save'}</h2>
                    <p className="mb-4 text-gray-600">Save <strong>{formName || "Untitled Form"}</strong>?</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 transition-colors">
                            {isSaving && <Loader2 size={16} className="animate-spin" />}
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </DragDropContext>
  );
}