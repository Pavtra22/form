import { Type, Mail, Phone, Calendar, Star, ChevronDown, AlignLeft ,Video } from 'lucide-react';

export const TOOLS = [
  { id: 'tool-text', type: 'text', label: 'Text Input', icon: Type },
  { id: 'tool-email', type: 'email', label: 'Email', icon: Mail },
  { id: 'tool-phone', type: 'phone', label: 'Phone', icon: Phone },
  { id: 'tool-textarea', type: 'textarea', label: 'Long Text', icon: AlignLeft },
  { id: 'tool-date', type: 'date', label: 'Date Picker', icon: Calendar },
  { id: 'tool-select', type: 'select', label: 'Dropdown', icon: ChevronDown },
  { id: 'tool-stars', type: 'stars', label: 'Review Stars', icon: Star },
  { id: 'tool-video', type: 'video', label: 'Video Recorder', icon: Video },
];