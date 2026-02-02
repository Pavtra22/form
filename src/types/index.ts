export type ElementType = 'text' | 'email' | 'phone' | 'textarea' | 'date' | 'select' | 'stars' | 'video';
export interface FormElement {
  id: string; 
  type: ElementType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select dropdowns
}

export type LogicOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than';

export interface PageLogic {
  id: string;             // Unique ID for the rule
  triggerElementId: string;
  operator: LogicOperator;
  value: string;
  targetPageId: string;
}

export interface FormPage {
  id: string;
  title: string;
  elements: FormElement[];
  conditions?: PageLogic[]; // NEW: Logic rules for this page
}