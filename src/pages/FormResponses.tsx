import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import axios from 'axios';
import { Loader2, ArrowLeft, Video, Calendar, Download, Trash2, FileSpreadsheet } from 'lucide-react';
import { formResponsesRoute } from '../router';

interface Submission {
  id: number;
  data: string; // JSON string from DB
  created_at: string;
}

interface ParsedSubmission {
  id: number;
  answers: Record<string, string | number | boolean | object>;
  created_at: string;
}

export function FormResponses() {
  const { formId } = formResponsesRoute.useParams();
  const queryClient = useQueryClient();

  // 1. Fetch Submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', formId],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:8080/api/forms/${formId}/submissions`);
      // Parse the JSON data string for each submission
      return res.data.map((sub: Submission) => ({
        ...sub,
        answers: JSON.parse(sub.data),
      })) as ParsedSubmission[];
    },
  });

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`http://localhost:8080/api/submissions/${id}`);
    },
    onSuccess: () => {
      // Refresh the list after deletion
      queryClient.invalidateQueries({ queryKey: ['submissions', formId] });
    },
    onError: () => alert("Failed to delete submission")
  });

  // 3. Export to CSV Logic
  const handleExport = () => {
    if (!submissions || submissions.length === 0) return;

    // Get all unique question keys
    const allKeys = Array.from(new Set(submissions.flatMap(s => Object.keys(s.answers))));
    
    // Create Header Row
    const headers = ['ID', 'Submitted At', ...allKeys];
    
    // Create Data Rows
    const rows = submissions.map(sub => {
      const date = new Date(sub.created_at).toLocaleString();
      const answerValues = allKeys.map(key => {
        const val = sub.answers[key];
        // If it's a string with a comma, wrap in quotes to avoid breaking CSV
        const safeVal = String(val || '').replace(/"/g, '""'); 
        return `"${safeVal}"`;
      });
      return [sub.id, `"${date}"`, ...answerValues].join(',');
    });

    // Combine and Download
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `form-${formId}-responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const allKeys = Array.from(new Set(submissions?.flatMap(s => Object.keys(s.answers)) || []));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/forms" className="text-gray-500 hover:text-gray-800 transition">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Form Responses</h1>
              <p className="text-gray-500 text-sm mt-1">{submissions?.length || 0} total submissions</p>
            </div>
          </div>

          <button 
            onClick={handleExport}
            disabled={!submissions || submissions.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <FileSpreadsheet size={20} />
            Export CSV
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs border-b">
                <tr>
                  <th className="px-6 py-4 w-20">ID</th>
                  <th className="px-6 py-4 w-48">Submitted At</th>
                  {allKeys.map(key => (
                    <th key={key} className="px-6 py-4 min-w-[150px]">
                      {key}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions?.length === 0 ? (
                  <tr>
                    <td colSpan={allKeys.length + 3} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <Download size={24} className="opacity-50"/>
                        </div>
                        <p>No submissions yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissions?.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition group">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">#{sub.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-700">
                           <Calendar size={14} className="text-gray-400"/>
                           {new Date(sub.created_at).toLocaleString()}
                        </div>
                      </td>
                      {allKeys.map((key) => {
                        const val = sub.answers[key];
                        // Check if value looks like a video URL
                        const isVideo = typeof val === 'string' && (val.includes('/uploads/') || val.startsWith('http'));

                        return (
                          <td key={key} className="px-6 py-4 max-w-xs truncate">
                            {isVideo ? (
                              <a 
                                href={val} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md text-xs font-medium transition border border-blue-100"
                              >
                                <Video size={14} /> Watch Video
                              </a>
                            ) : (
                              <span className="text-gray-700" title={String(val)}>{String(val)}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => {
                                if(confirm('Are you sure you want to delete this submission?')) {
                                    deleteMutation.mutate(sub.id);
                                }
                            }}
                            className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                            title="Delete Submission"
                        >
                            <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}