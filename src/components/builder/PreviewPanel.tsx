import { EyeOff, ExternalLink } from 'lucide-react';

interface PreviewPanelProps {
  width: number | string;
  previewSrc: string;
  onClose?: () => void; // Made optional since it's now always visible in the center
  formId?: string;
  hideCloseButton?: boolean; // Added to support the fixed center layout
}

export function PreviewPanel({ width, previewSrc, onClose, formId, hideCloseButton }: PreviewPanelProps) {
  return (
    <div 
      style={{ width }} 
      className="flex flex-col bg-white h-full overflow-hidden shrink-0 shadow-sm transition-[width] duration-0 border border-gray-200 rounded-lg"
    >
        {/* Header Section */}
        <div className="p-3 border-b bg-gray-50 flex justify-between items-center shrink-0 h-12">
            <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-700 text-sm">Live Preview</h3>
                <span className="text-[10px] text-gray-500 border border-gray-200 bg-white px-1.5 py-0.5 rounded shadow-sm">
                    HTML5
                </span>
            </div>
            <div className="flex items-center gap-2">
                {formId && (
                    <a 
                        href={`http://localhost:8080/public/forms/${formId}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-gray-400 hover:text-blue-600 p-1 transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink size={16} />
                    </a>
                )}
                
                {!hideCloseButton && onClose && (
                    <button 
                      onClick={onClose} 
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-gray-100"
                      title="Close Preview"
                    >
                        <EyeOff size={16} />
                    </button>
                )}
            </div>
        </div>

        {/* Iframe Content Section */}
        <div className="flex-1 bg-white relative h-full w-full">
            <iframe 
                srcDoc={previewSrc} 
                title="Form Preview" 
                className="w-full h-full border-0 block"
                sandbox="allow-scripts"
            />
        </div>
    </div>
  );
}