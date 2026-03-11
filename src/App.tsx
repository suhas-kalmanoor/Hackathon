import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { 
  Code2, 
  AlertCircle, 
  Zap, 
  Activity, 
  Play, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

// Types
interface Issue {
  line: string;
  message: string;
  severity: 'Error' | 'Warning' | 'Info';
}

interface Optimization {
  title: string;
  description: string;
  optimizedCode: string;
}

interface ComplexityData {
  n: number;
  operations: number;
}

interface AnalysisResult {
  issues: Issue[];
  optimizations: Optimization[];
  timeComplexity: string;
  spaceComplexity: string;
  complexityGraphData: ComplexityData[];
}

export default function App() {
  const [code, setCode] = useState(`function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}`);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'issues' | 'optimizations' | 'complexity'>('issues');

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Analyze the following code. Identify any errors or potential bugs. Suggest optimizations. Determine the time and space complexity. Provide data points for a time complexity graph (where 'n' is input size and 'operations' is the estimated number of operations for that n).
        
Code:
\`\`\`
${code}
\`\`\`
`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              issues: {
                type: Type.ARRAY,
                description: "List of errors, warnings, or info about the code.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    line: { type: Type.STRING, description: "Line number or range (e.g., '10', '12-15')" },
                    message: { type: Type.STRING, description: "Description of the issue" },
                    severity: { type: Type.STRING, description: "Must be 'Error', 'Warning', or 'Info'" }
                  }
                }
              },
              optimizations: {
                type: Type.ARRAY,
                description: "List of suggested optimizations.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    optimizedCode: { type: Type.STRING, description: "The optimized code snippet" }
                  }
                }
              },
              timeComplexity: { type: Type.STRING, description: "e.g., 'O(N)', 'O(N^2)'" },
              spaceComplexity: { type: Type.STRING, description: "e.g., 'O(1)', 'O(N)'" },
              complexityGraphData: {
                type: Type.ARRAY,
                description: "Data points to plot the time complexity graph. Provide 5-10 points.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    n: { type: Type.NUMBER },
                    operations: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      });

      if (response.text) {
        const parsedResult = JSON.parse(response.text) as AnalysisResult;
        setResult(parsedResult);
        if (parsedResult.issues && parsedResult.issues.length > 0) setActiveTab('issues');
        else if (parsedResult.optimizations && parsedResult.optimizations.length > 0) setActiveTab('optimizations');
        else setActiveTab('complexity');
      } else {
        setError("Failed to generate analysis.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'Info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Error': return 'bg-red-50 border-red-200 text-red-800';
      case 'Warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'Info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">AI Code Reviewer</h1>
            <p className="text-xs text-zinc-500 font-medium">Powered by Gemini 3.1 Pro</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !code.trim()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-[1600px] mx-auto w-full">
        
        {/* Left Column: Code Editor */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden h-[calc(100vh-8rem)]">
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700">Source Code</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 p-4 font-mono text-sm bg-zinc-900 text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Paste your code here..."
            spellCheck="false"
          />
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden h-[calc(100vh-8rem)]">
          
          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!result && !isAnalyzing && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-zinc-300" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Ready to Analyze</h3>
              <p className="text-sm max-w-sm">Paste your code on the left and click "Analyze Code" to get AI-powered feedback, optimizations, and complexity analysis.</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <p className="text-sm font-medium text-zinc-600 animate-pulse">Analyzing code structure and complexity...</p>
            </div>
          )}

          {result && !isAnalyzing && (
            <>
              {/* Tabs */}
              <div className="flex items-center border-b border-zinc-200 bg-zinc-50/50 px-2 pt-2">
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'issues' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}`}
                >
                  <AlertCircle className="w-4 h-4" />
                  Issues
                  {result.issues && result.issues.length > 0 && (
                    <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs ml-1">
                      {result.issues.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('optimizations')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'optimizations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}`}
                >
                  <Zap className="w-4 h-4" />
                  Optimizations
                  {result.optimizations && result.optimizations.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-xs ml-1">
                      {result.optimizations.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('complexity')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'complexity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}`}
                >
                  <Activity className="w-4 h-4" />
                  Complexity
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
                <AnimatePresence mode="wait">
                  
                  {/* Issues Tab */}
                  {activeTab === 'issues' && (
                    <motion.div
                      key="issues"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {(!result.issues || result.issues.length === 0) ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-zinc-200 border-dashed">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                          <h3 className="text-lg font-medium text-zinc-900">Looks Good!</h3>
                          <p className="text-sm text-zinc-500">No major errors or issues found in the code.</p>
                        </div>
                      ) : (
                        result.issues.map((issue, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(issue.severity)}`}>
                            <div className="flex items-start gap-3">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">{issue.severity}</span>
                                  {issue.line && (
                                    <span className="text-xs bg-white/50 px-2 py-0.5 rounded-md font-mono border border-current/10">
                                      Line {issue.line}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm opacity-90">{issue.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}

                  {/* Optimizations Tab */}
                  {activeTab === 'optimizations' && (
                    <motion.div
                      key="optimizations"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {(!result.optimizations || result.optimizations.length === 0) ? (
                        <div className="text-center p-8 text-zinc-500">
                          No specific optimizations suggested.
                        </div>
                      ) : (
                        result.optimizations.map((opt, idx) => (
                          <div key={idx} className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                {opt.title}
                              </h3>
                              <p className="text-sm text-zinc-600 mt-1">{opt.description}</p>
                            </div>
                            {opt.optimizedCode && (
                              <div className="p-4 bg-zinc-900 text-zinc-100 overflow-x-auto">
                                <pre className="text-sm font-mono">
                                  <code>{opt.optimizedCode}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}

                  {/* Complexity Tab */}
                  {activeTab === 'complexity' && (
                    <motion.div
                      key="complexity"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Time Complexity</span>
                          <span className="text-3xl font-mono font-bold text-indigo-600">{result.timeComplexity || 'N/A'}</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center">
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Space Complexity</span>
                          <span className="text-3xl font-mono font-bold text-emerald-600">{result.spaceComplexity || 'N/A'}</span>
                        </div>
                      </div>

                      {result.complexityGraphData && result.complexityGraphData.length > 0 && (
                        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-500" />
                            Operations vs Input Size (n)
                          </h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={result.complexityGraphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                                <XAxis 
                                  dataKey="n" 
                                  stroke="#a1a1aa" 
                                  fontSize={12} 
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(value) => `n=${value}`}
                                />
                                <YAxis 
                                  stroke="#a1a1aa" 
                                  fontSize={12} 
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                                />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                  formatter={(value: number) => [value, 'Operations']}
                                  labelFormatter={(label) => `Input Size (n): ${label}`}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="operations" 
                                  stroke="#4f46e5" 
                                  strokeWidth={3}
                                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                                  activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 0 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
