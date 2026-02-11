export type ElementType = 'text' | 'email' | 'phone' | 'textarea' | 'date' | 'select' | 'stars' | 'video' | 'hidden';

export interface FormElement {
  id: string; 
  type: ElementType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select dropdowns
}

export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than';

export interface LogicCondition {
  id: string;
  triggerElementId: string;
  operator: ConditionOperator;
  value: string;
}

export interface LogicRule {
  id: string;
  targetPageId: string;
  matchType: 'AND' | 'OR'; // Match ALL (AND) or ANY (OR) of the conditions
  conditions: LogicCondition[];
}

export interface FormPage {
  id: string;
  title: string;
  elements: FormElement[];
  logicRules?: LogicRule[]; // Replaces the simple 'conditions' array
} 