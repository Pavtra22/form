import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { FileText, Plus, Loader2, ExternalLink, Copy, Check, Trash2, MessageSquare, Edit } from 'lucide-react';
import { useState } from 'react';

// Define the shape of data coming from Go API
interface ApiForm {
    id: number;
    name: string;
    elements: string; 
    created_at: string;
}

export function MyForms() {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Forms
  const { data: forms, isLoading, isError } = useQuery({
    queryKey: ['forms'],
    queryFn: async () => {
        // Ensure this points to your Go backend port
        const res = await axios.get<ApiForm[]>('http://localhost:8080/api/forms');
        return res.data;
    }
  });

  // Delete Form Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`http://localhost:8080/api/forms/${id}`);
    },
    onSuccess: () => {
      // Refetch the forms list after successful delete
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
    onError: (err) => {
      alert("Failed to delete form. Please try again.");
      console.error(err);
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const copyLink = (id: number) => {
      const url = `http://localhost:8080/public/forms/${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  if (isError) return <div className="text-center mt-20 text-red-500">Failed to load forms. Is the backend running?</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Forms</h1>
          <Link to="/" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus size={20} /> Create New Form
          </Link>
        </div>

        {(!forms || forms.length === 0) ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No forms yet</h3>
                <p className="text-gray-500 mt-1">Create your first form to start collecting data.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                <div key={form.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all flex flex-col relative group">
                    
                    {/* Delete Button (Visible on Hover) */}
                    <button 
                        onClick={() => handleDelete(form.id)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="Delete Form"
                    >
                        <Trash2 size={18} />
                    </button>

                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <span className="text-xs text-gray-400 mt-1">{new Date(form.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 mb-2 pr-8 truncate">{form.name}</h3>
                    
                    {/* PUBLIC LINK SECTION */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4 mb-4">
                        <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">Public Link</p>
                        <div className="flex items-center gap-2">
                            <input 
                                readOnly 
                                value={`http://localhost:8080/public/forms/${form.id}`} 
                                className="flex-1 text-xs bg-white border border-gray-300 rounded px-2 py-1 text-gray-600 truncate focus:outline-none"
                            />
                            <button 
                                onClick={() => copyLink(form.id)}
                                className="text-gray-500 hover:text-blue-600 transition"
                                title="Copy Link"
                            >
                                {copiedId === form.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </button>
                        </div>
                        <a 
                            href={`http://localhost:8080/public/forms/${form.id}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full mt-3 bg-white border border-blue-600 text-blue-600 text-sm font-medium py-1.5 rounded hover:bg-blue-50 transition"
                        >
                            Open Form <ExternalLink size={14} />
                        </a>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto">
                        <button 
                            onClick={() => navigate({ to: '/forms/$formId/responses', params: { formId: form.id.toString() } })}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition font-medium text-sm"
                        >
                            <MessageSquare size={16} />
                            Responses
                        </button>
                        <button
                            onClick={() => navigate({ to: '/builder/$formId', params: { formId: form.id.toString() } })}
                            className="px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                            title="Edit Form"
                        >
                            <Edit size={18} />
                        </button>
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}