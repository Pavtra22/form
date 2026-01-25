import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { 
  Loader2, ArrowLeft, Video, Calendar, Trash2, 
  FileSpreadsheet, Tag as TagIcon, X, Plus, Star 
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { formResponsesRoute } from '../router';

interface ParsedSubmission {
  id: number;
  answers: Record<string, any>;
  tags: string[]; // Parsed from JSON string
  created_at: string;
}

export function FormResponses() {
  const { formId } = formResponsesRoute.useParams();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', formId],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:8080/api/forms/${formId}/submissions`);
      return res.data.map((sub: any) => ({
        ...sub,
        answers: JSON.parse(sub.data),
        tags: sub.tags ? JSON.parse(sub.tags) : []
      })) as ParsedSubmission[];
    },
  });

  const tagMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: number; tags: string[] }) => {
      await axios.put(`http://localhost:8080/api/submissions/${id}/tags`, { tags });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions', formId] })
  });

  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    submissions?.forEach(s => s.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    if (filter === 'All') return submissions;
    if (filter === 'Untagged') return submissions.filter(s => s.tags.length === 0);
    return submissions.filter(s => s.tags.includes(filter));
  }, [submissions, filter]);

  const handleExport = () => {
    const headers = ['ID', 'Date', 'Name', 'Roll No', 'Institution', 'Review', 'Rating', 'Tags'];
    const rows = filteredSubmissions.map(s => [
      s.id, s.created_at, s.answers['Name'] || '', s.answers['Roll No'] || '',
      s.answers['Institution Name'] || '', s.answers['Queries'] || '',
      s.answers['Rating'] || 0, s.tags.join('; ')
    ].join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `responses-export.csv`;
    link.click();
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <Link to="/forms" className="p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft size={24} /></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Form Responses</h1>
              <p className="text-sm text-gray-500">Form ID: {formId}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select 
              className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">Filter by tags: All</option>
              <option value="Untagged">Untagged</option>
              {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="bg-white border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm">Tagged reviews</button>
            <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
              <FileSpreadsheet size={18} /> EXPORT AS CSV
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b text-gray-600 font-semibold">
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? filteredSubmissions.map(s => s.id) : [])} /></th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Submitted At</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Institution Name</th>
                <th className="px-4 py-3 w-64">Queries / Review</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(sub.id)} onChange={() => {}} /></td>
                  <td className="px-4 py-4 text-gray-400 font-mono text-xs">#{sub.id}</td>
                  <td className="px-4 py-4 text-gray-600">{new Date(sub.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-4 font-medium text-gray-900">{sub.answers['Name'] || '—'}</td>
                  <td className="px-4 py-4 text-gray-600">{sub.answers['Roll No'] || '—'}</td>
                  <td className="px-4 py-4 text-gray-600">{sub.answers['Institution Name'] || '—'}</td>
                  <td className="px-4 py-4 text-gray-600 italic truncate max-w-xs">"{sub.answers['Queries'] || sub.answers['Review'] || 'No text provided'}"</td>
                  <td className="px-4 py-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < (sub.answers['Rating'] || 0) ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {Object.values(sub.answers).some(val => typeof val === 'string' && val.includes('/uploads/')) && (
                      <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] bg-red-50 px-2 py-1 rounded border border-red-100 w-fit">
                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> REC
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 items-center">
                      {sub.tags.length > 0 ? sub.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] border border-blue-100">
                          {tag}
                          <button onClick={() => tagMutation.mutate({ id: sub.id, tags: sub.tags.filter(t => t !== tag) })} className="hover:text-red-500"><X size={10}/></button>
                        </span>
                      )) : <span className="text-gray-300 text-[11px]">Untagged</span>}
                      <button 
                        onClick={() => {
                          const tag = prompt("Enter new tag:");
                          if (tag) tagMutation.mutate({ id: sub.id, tags: [...sub.tags, tag] });
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 border border-dashed rounded-full"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}