import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FormElement, FormPage, LogicRule, LogicCondition } from '../types';

interface BuilderStore {
  pages: FormPage[];
  activePageId: string;
  selectedElement: FormElement | null;

  // Page Actions
  addPage: () => void;
  removePage: (id: string) => void;
  setActivePage: (id: string) => void;
  updatePageTitle: (id: string, title: string) => void;
  reorderPages: (startIndex: number, endIndex: number) => void;
  
  // Logic Rule Actions
  addLogicRule: (pageId: string, rule: LogicRule) => void;
  updateLogicRule: (pageId: string, ruleId: string, updates: Partial<LogicRule>) => void;
  removeLogicRule: (pageId: string, ruleId: string) => void;
  
  // Condition Actions (within a rule)
  addConditionToRule: (pageId: string, ruleId: string, condition: LogicCondition) => void;
  removeConditionFromRule: (pageId: string, ruleId: string, conditionId: string) => void;

  // Element Actions
  addElement: (index: number, element: FormElement, pageId?: string) => void;
  removeElement: (id: string) => void;
  reorderElements: (startIndex: number, endIndex: number, pageId?: string) => void;
  setSelectedElement: (element: FormElement | null) => void;
  updateElement: (id: string, updates: Partial<FormElement>) => void;
  setForm: (pages: FormPage[]) => void;
}

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
    if (state.pages.length <= 1) return state;
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

  reorderPages: (startIndex, endIndex) => set((state) => {
    const newPages = [...state.pages];
    const [removed] = newPages.splice(startIndex, 1);
    newPages.splice(endIndex, 0, removed);
    return { pages: newPages };
  }),

  // --- LOGIC RULES ---
  addLogicRule: (pageId, rule) => set((state) => ({
    pages: state.pages.map(p => {
      if (p.id !== pageId) return p;
      return { ...p, logicRules: [...(p.logicRules || []), rule] };
    })
  })),

  updateLogicRule: (pageId, ruleId, updates) => set((state) => ({
    pages: state.pages.map(p => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        logicRules: (p.logicRules || []).map(r => r.id === ruleId ? { ...r, ...updates } : r)
      };
    })
  })),

  removeLogicRule: (pageId, ruleId) => set((state) => ({
    pages: state.pages.map(p => {
      if (p.id !== pageId) return p;
      return { ...p, logicRules: (p.logicRules || []).filter(r => r.id !== ruleId) };
    })
  })),

  addConditionToRule: (pageId, ruleId, condition) => set((state) => ({
    pages: state.pages.map(p => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        logicRules: (p.logicRules || []).map(r => {
          if (r.id !== ruleId) return r;
          return { ...r, conditions: [...r.conditions, condition] };
        })
      };
    })
  })),

  removeConditionFromRule: (pageId, ruleId, conditionId) => set((state) => ({
    pages: state.pages.map(p => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        logicRules: (p.logicRules || []).map(r => {
          if (r.id !== ruleId) return r;
          return { ...r, conditions: r.conditions.filter(c => c.id !== conditionId) };
        })
      };
    })
  })),

  setForm: (pages) => set({ pages, activePageId: pages[0]?.id || "" }),

  // --- ELEMENT OPERATIONS ---
  addElement: (index, element, pageId) => set((state) => {
    // If pageId is provided, use it; otherwise fallback to activePageId
    const targetPageId = pageId || state.activePageId;
    const pageIndex = state.pages.findIndex(p => p.id === targetPageId);
    if (pageIndex === -1) return state;
    
    const newPages = [...state.pages];
    const newElements = [...newPages[pageIndex].elements];
    newElements.splice(index, 0, element);
    newPages[pageIndex] = { ...newPages[pageIndex], elements: newElements };
    
    return { 
      pages: newPages, 
      selectedElement: element,
      activePageId: targetPageId // Ensure the page with new element becomes active
    };
  }),

  removeElement: (id) => set((state) => {
    const newPages = state.pages.map(page => ({
      ...page,
      elements: page.elements.filter(el => el.id !== id)
    }));
    return { pages: newPages, selectedElement: null };
  }),

  reorderElements: (startIndex, endIndex, pageId) => set((state) => {
    const targetPageId = pageId || state.activePageId;
    const pageIndex = state.pages.findIndex(p => p.id === targetPageId);
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
    const newPages = state.pages.map(page => ({
      ...page,
      elements: page.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    }));

    // Also update selectedElement if it's the one being modified
    const updatedSelected = state.selectedElement?.id === id 
      ? { ...state.selectedElement, ...updates } 
      : state.selectedElement;

    return { 
        pages: newPages, 
        selectedElement: updatedSelected
    };
  }),
}));