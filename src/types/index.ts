export type ElementType = 'text' | 'email' | 'phone' | 'textarea' | 'date' | 'select' | 'stars'| 'video';

export interface FormElement {
  id: string; // Unique ID for every instance on the canvas
  type: ElementType;
  label: string;
  required: boolean;
  placeholder?: string;
}