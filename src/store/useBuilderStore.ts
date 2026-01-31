import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FormElement, FormPage, PageLogic } from '../types';

interface BuilderStore {
  pages: FormPage[];
  activePageId: string;
  selectedElement: FormElement | null;

  // Page Actions
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;
  updatePageTitle: (id: string, title: string) => void;
  
  // Logic Actions
  addCondition: (pageId: string, condition: PageLogic) => void;
  removeCondition: (pageId: string, conditionId: string) => void;

  // Element Actions (Target the Active Page)
  addElement: (index: number, element: FormElement) => void;
  removeElement: (id: string) => void;
  reorderElements: (startIndex: number, endIndex: number) => void;
  setSelectedElement: (element: FormElement | null) => void;
  updateElement: (id: string, updates: Partial<FormElement>) => void;
  setForm: (pages: FormPage[]) => void;
}

// Initial State helper
const initialPageId = uuidv4();

export const useBuilderStore = create<BuilderStore>((set) => ({
  pages: [{ id: initialPageId, title: "Page 1", elements: [] }],
  activePageId: initialPageId,
  selectedElement: null,

  // --- PAGE OPERATIONS ---
  addPage: () => set((state) => {
    const newPage = { id: uuidv4(), title: `Page ${state.pages.length + 1}`, elements: [] };
    return { pages: [...state.pages, newPage], activePageId: newPage.id };
  }),

  removePage: (id) => set((state) => {
    if (state.pages.length <= 1) return state; // Prevent deleting last page
    const newPages = state.pages.filter(p => p.id !== id);
    return { 
        pages: newPages, 
        activePageId: state.activePageId === id ? newPages[0].id : state.activePageId 
    };
  }),

  setActivePage: (id) => set({ activePageId: id }),

  updatePageTitle: (id, title) => set((state) => ({
    pages: state.pages.map(p => p.id === id ? { ...p, title } : p)
  })),

  // --- LOGIC OPERATIONS ---
  addCondition: (pageId, condition) => set((state) => {
    const newPages = state.pages.map(p => {
      if (p.id !== pageId) return p;
      const existingConditions = p.conditions || [];
      return { ...p, conditions: [...existingConditions, condition] };
    });
    return { pages: newPages };
  }),

  removeCondition: (pageId, conditionId) => set((state) => {
    const newPages = state.pages.map(p => {
      if (p.id !== pageId) return p;
      const existingConditions = p.conditions || [];
      return { ...p, conditions: existingConditions.filter(c => c.id !== conditionId) };
    });
    return { pages: newPages };
  }),

  setForm: (pages) => set({ pages, activePageId: pages[0]?.id || "" }),

  // --- ELEMENT OPERATIONS (On Active Page) ---
  addElement: (index, element) => set((state) => {
    const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
    if (pageIndex === -1) return state;

    const newPages = [...state.pages];
    const newElements = [...newPages[pageIndex].elements];
    newElements.splice(index, 0, element);
    newPages[pageIndex] = { ...newPages[pageIndex], elements: newElements };
    
    return { pages: newPages, selectedElement: element };
  }),

  removeElement: (id) => set((state) => {
    const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
    if (pageIndex === -1) return state;

    const newPages = [...state.pages];
    newPages[pageIndex] = {
      ...newPages[pageIndex],
      elements: newPages[pageIndex].elements.filter(el => el.id !== id)
    };
    return { pages: newPages, selectedElement: null };
  }),

  reorderElements: (startIndex, endIndex) => set((state) => {
    const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
    if (pageIndex === -1) return state;

    const newPages = [...state.pages];
    const newElements = [...newPages[pageIndex].elements];
    const [removed] = newElements.splice(startIndex, 1);
    newElements.splice(endIndex, 0, removed);
    newPages[pageIndex] = { ...newPages[pageIndex], elements: newElements };

    return { pages: newPages };
  }),

  setSelectedElement: (element) => set({ selectedElement: element }),

  updateElement: (id, updates) => set((state) => {
    const pageIndex = state.pages.findIndex(p => p.id === state.activePageId);
    if (pageIndex === -1) return state;

    const newPages = [...state.pages];
    const newElements = newPages[pageIndex].elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    newPages[pageIndex] = { ...newPages[pageIndex], elements: newElements };

    return { 
        pages: newPages, 
        selectedElement: state.selectedElement?.id === id ? { ...state.selectedElement, ...updates } : state.selectedElement 
    };
  }),
}));