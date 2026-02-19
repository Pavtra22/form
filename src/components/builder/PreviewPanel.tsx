import { ExternalLink } from 'lucide-react';

interface PreviewPanelProps {
  width: number | string;
  previewSrc: string;
  formId?: string;
}

export function PreviewPanel({ width, previewSrc, formId }: PreviewPanelProps) {
  return (
    <div 
      style={{ width }}
      className="flex flex-col bg-white h-full overflow-hidden shrink-0 transition-[width] duration-0"
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
                        href={`/public/forms/${formId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-500 hover:text-blue-600 p-1"
                        title="Open in new tab"
                    >
                        <ExternalLink size={16} />
                    </a>
                )}
            </div>
        </div>

        {/* Iframe Content Section */}
        {/* Changed min-h-[600px] to h-full to allow the parent's scrollable container to manage visibility */}
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