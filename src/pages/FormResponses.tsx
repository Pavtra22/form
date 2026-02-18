import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Loader2, ArrowLeft, Download, FileText } from 'lucide-react';
import type { FormPage, FormElement } from '../types';

interface Submission {
  id: number;
  data: string; // JSON string from DB
  created_at: string;
}

interface FormDefinition {
  id: number;
  name: string;
  elements: string; // JSON string of pages or elements
}

export function FormResponses() {
  const { formId } = useParams({ strict: false });
  const navigate = useNavigate();

  // 1. Fetch Form Definition (The "Source of Truth" for column order)
  const { data: formDef, isLoading: isLoadingForm } = useQuery({
    queryKey: ['form', formId],
    queryFn: async () => {
      const res = await axios.get<FormDefinition>(`/api/forms/${formId}`);
      return res.data;
    }
  });

  // 2. Fetch Submissions
  const { data: submissions, isLoading: isLoadingSubs } = useQuery({
    queryKey: ['submissions', formId],
    queryFn: async () => {
      const res = await axios.get<Submission[]>(`/api/forms/${formId}/submissions`);
      return res.data;
    }
  });

  if (isLoadingForm || isLoadingSubs) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // --- Helper: Extract Ordered Elements from Schema ---
  let orderedElements: FormElement[] = [];
  if (formDef?.elements) {
    try {
      const rawElements = JSON.parse(formDef.elements);
      // Handle both legacy flat array and multi-page format
      if (Array.isArray(rawElements) && rawElements.length > 0 && rawElements[0].elements) {
        // Multi-page: flatten all pages into a single ordered array
        (rawElements as FormPage[]).forEach(page => {
          orderedElements.push(...page.elements);
        });
      } else if (Array.isArray(rawElements)) {
        // Legacy flat array
        orderedElements = rawElements as FormElement[];
      }
    } catch (e) {
      console.error("Error parsing form definition", e);
    }
  }

  // 3. Parse Submission Data
  const parsedSubmissions = submissions?.map(sub => {
    try {
      return {
        ...sub,
        parsedData: JSON.parse(sub.data) as Record<string, any>,
      };
    } catch (e) {
      console.error("Failed to parse submission data", sub.id, e);
      return { ...sub, parsedData: {} };
    }
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate({ to: '/forms' })}
              className="p-2 hover:bg-gray-200 rounded-full transition"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Form Responses</h1>
              <p className="text-sm text-gray-500">
                Form: <span className="font-semibold">{formDef?.name}</span> • {parsedSubmissions.length} submissions
              </p>
            </div>
          </div>
          
          <button 
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            onClick={() => alert("Export feature coming soon!")}
          >
            <Download size={18} /> Export CSV
          </button>
        </div>

        {parsedSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium">No responses yet</h3>
            <p className="text-gray-500 text-sm mt-1">Share your form link to start collecting data.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap w-20 bg-gray-50/50 sticky left-0 z-10 border-r">#</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap w-40 border-r">Date</th>
                    {/* Fixed Order: Render headers based on schema elements */}
                    {orderedElements.map(el => (
                      <th key={el.id} className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">
                        {el.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedSubmissions.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 text-gray-500 sticky left-0 bg-white border-r">
                        {parsedSubmissions.length - idx}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap border-r">
                        {new Date(sub.created_at).toLocaleString()}
                      </td>
                      {/* Fixed Order: Render data cells matching the header IDs */}
                      {orderedElements.map(el => {
                        const val = sub.parsedData[el.id];
                        let displayVal: React.ReactNode = val;

                        // Logic for Video or complex objects
                        if (el.type === 'video' && typeof val === 'string') {
                          displayVal = (
                            <a 
                              href={val} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-blue-600 underline hover:text-blue-800 flex items-center gap-1"
                            >
                              View Video ↗
                            </a>
                          );
                        } else if (val && typeof val === 'object') {
                          displayVal = JSON.stringify(val);
                        }

                        return (
                          <td key={`${sub.id}-${el.id}`} className="px-6 py-4 text-gray-800">
                            {displayVal || <span className="text-gray-300 italic">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}