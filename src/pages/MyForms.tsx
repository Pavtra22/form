import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { FileText, Plus, Loader2, ExternalLink, Copy, Check, Trash2, MessageSquare, Settings } from 'lucide-react';
import { useState } from 'react';

interface ApiForm {
    id: number;
    name: string;
    elements: string; 
    created_at: string;
}

export function MyForms() {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [baseUrl, setBaseUrl] = useState("http://localhost:8080");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: forms, isLoading, isError } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
        const res = await axios.get<ApiForm[]>('http://localhost:8080/api/forms');
        return res.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`http://localhost:8080/api/forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
    onError: (err) => {
      alert("Failed to delete form. Please try again.");
      console.error(err);
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this form?")) {
      deleteMutation.mutate(id);
    }
  };

  const copyLink = (id: number) => {
      const cleanBase = baseUrl.replace(/\/$/, "");
      const url = `${cleanBase}/public/forms/${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (isError) return <div className="text-center mt-20 text-red-500">Failed to load forms. Is the backend running?</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">My Forms</h1>
          <div className="flex gap-2 w-full md:w-auto">
             <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-lg border transition ${isSettingsOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                title="Configure Public URL"
             >
                 <Settings size={20} />
             </button>
             <Link to="/" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <Plus size={20} /> Create New Form
             </Link>
          </div>
        </div>

        {/* Domain Configuration Panel */}
        {isSettingsOpen && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-8">
                <label className="block text-sm font-semibold text-blue-900 mb-2">Public Link Domain</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:8080"
                        className="flex-1 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button onClick={() => setBaseUrl("http://localhost:8080")} className="text-xs text-blue-600 hover:underline px-2">Reset</button>
                </div>
            </div>
        )}

        {(!forms || forms.length === 0) ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <FileText size={32} className="mx-auto text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No forms yet</h3>
                <p className="text-gray-500 mt-1">Create your first form to start collecting data.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                <div key={form.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all flex flex-col relative group">
                    <button onClick={() => handleDelete(form.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10"><Trash2 size={18} /></button>
                    <div className="mb-4">
                        <FileText size={24} className="text-blue-600 mb-2" />
                        <span className="text-xs text-gray-400">{new Date(form.created_at).toLocaleDateString()}</span>
                        <h3 className="font-bold text-lg text-gray-800 truncate">{form.name}</h3>
                    </div>
                    
                    {/* Public Link - Stacked on Mobile */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-auto mb-4">
                        <div className="flex gap-2 mb-2">
                            <input readOnly value={`${baseUrl.replace(/\/$/, "")}/public/forms/${form.id}`} className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-600 truncate" />
                            
                            {/* Uses copiedId state to switch icons */}
                            <button 
                                onClick={() => copyLink(form.id)} 
                                className="text-gray-500 hover:text-blue-600 transition-colors w-6 flex items-center justify-center"
                                title="Copy"
                            >
                                {copiedId === form.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                        </div>
                        <a href={`${baseUrl.replace(/\/$/, "")}/public/forms/${form.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border border-blue-600 text-blue-600 text-sm font-medium py-1.5 rounded hover:bg-blue-50">
                            Open <ExternalLink size={14} />
                        </a>
                    </div>

                    <button onClick={() => navigate({ to: '/forms/$formId/responses', params: { formId: form.id.toString() } })} className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 text-sm">
                        <MessageSquare size={16} /> Responses
                    </button>
                </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}