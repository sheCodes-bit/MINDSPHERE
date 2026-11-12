'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Archive,
  RefreshCw,
  Eye,
  CheckCircle2,
  Trash2,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { DIFFICULTY_LABELS } from '@/config/constants'
import { SecureQuestionBankPanel } from '@/components/admin/SecureQuestionBankPanel'

export default function AdminQuestionBankPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [statusFilter, setStatusFilter] = useState('published')

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState<any | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [subjectId, setSubjectId] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [explanation, setExplanation] = useState('')
  const [options, setOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ])
  const [saving, setSaving] = useState(false)

  // Import state
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState<any | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [subjectsRes, questionsRes] = await Promise.all([
        fetch('/api/admin/subjects'),
        fetch(`/api/admin/questions?subject_id=${selectedSubject}&difficulty=${selectedDifficulty}&status=${statusFilter}&search=${encodeURIComponent(search)}`),
      ])

      const sData = await subjectsRes.json()
      const qData = await questionsRes.json()

      setSubjects(sData.subjects || [])
      setQuestions(qData.questions || [])
      setSubjectId(prev => prev || (sData.subjects?.[0]?.id || ''))
    } catch {
      toast.error('Failed to load question bank')
    } finally {
      setLoading(false)
    }
  }, [selectedSubject, selectedDifficulty, statusFilter, search])

  useEffect(() => {
    loadData()
  }, [loadData])

  function handleOpenCreate() {
    setEditingId(null)
    setQuestionText('')
    setExplanation('')
    setDifficulty('medium')
    setOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ])
    setIsFormOpen(true)
  }

  function handleOpenEdit(q: any) {
    setEditingId(q.id)
    setSubjectId(q.subject_id)
    setQuestionText(q.question_text)
    setDifficulty(q.difficulty)
    setExplanation(q.explanation || '')
    const mapped = (q.question_options || []).map((o: any) => ({
      text: o.option_text,
      isCorrect: o.is_correct,
    }))
    setOptions(mapped.length >= 2 ? mapped : [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ])
    setIsFormOpen(true)
  }

  function handleOptionChange(index: number, text: string) {
    const updated = [...options]
    updated[index].text = text
    setOptions(updated)
  }

  function handleSetCorrect(index: number) {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }))
    setOptions(updated)
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectId) {
      toast.error('Please select a subject')
      return
    }

    const hasFilledOptions = options.filter(o => o.text.trim().length > 0)
    if (hasFilledOptions.length < 2) {
      toast.error('At least 2 options are required')
      return
    }

    const correctIdx = options.findIndex(o => o.isCorrect)
    if (correctIdx === -1) {
      toast.error('Mark exactly one option as the correct answer')
      return
    }

    setSaving(true)
    try {
      const payload = {
        subject_id: subjectId,
        question_text: questionText,
        question_type: 'mcq_single',
        difficulty,
        explanation: explanation || undefined,
        status: 'published',
        options: options.map((o, idx) => ({
          option_text: o.text.trim(),
          option_order: idx,
          is_correct: o.isCorrect,
        })),
      }

      const url = editingId ? `/api/admin/questions/${editingId}` : '/api/admin/questions'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save question')
      }

      toast.success(editingId ? 'Question updated' : 'Question created')
      setIsFormOpen(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving question')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchiveToggle(id: string, currentStatus: string) {
    const action = currentStatus === 'archived' ? 'restore' : 'archive'
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Status change failed')
      toast.success(`Question ${action}d`)
      loadData()
    } catch {
      toast.error('Failed to change question status')
    }
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!importText.trim()) {
      toast.error('Please paste CSV or JSON content')
      return
    }

    setImporting(true)
    setImportReport(null)
    try {
      const isJson = importText.trim().startsWith('[') || importText.trim().startsWith('{')
      const headers: Record<string, string> = {
        'Content-Type': isJson ? 'application/json' : 'text/csv',
      }

      const res = await fetch('/api/admin/questions/import', {
        method: 'POST',
        headers,
        body: importText,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')

      setImportReport(data.report)
      toast.success(`Import complete: ${data.report.successCount} added, ${data.report.skippedDuplicates} duplicates skipped`)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  function downloadSampleCSV() {
    const sample = `Subject,Question,Difficulty,Option A,Option B,Option C,Option D,Correct Option,Explanation
Programming Fundamentals,"What is the time complexity of linear search?",easy,"O(1)","O(log n)","O(n)","O(n^2)",C,"Linear search scans elements one by one."
Database Systems,"Which SQL clause filters groups after aggregation?",medium,"WHERE","HAVING","GROUP BY","ORDER BY",B,"HAVING filters aggregated grouped records."
Data Structures & Algorithms,"Which data structure uses LIFO ordering?",easy,"Queue","Stack","Heap","Tree",B,"Stack operates on Last-In First-Out."`

    const blob = new Blob([sample], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vspark_question_import_sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Question Bank</h1>
          <p className="text-xs text-slate-500 mt-1">
            Author and snapshot MCQs across the 7 official subjects, import batches, and manage question versions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="btn-ghost text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" /> Import
          </button>

          <a
            href={`/api/admin/questions/export?subject_id=${selectedSubject}&format=csv`}
            download
            className="btn-ghost text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>

          <button
            onClick={handleOpenCreate}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-glow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New Question
          </button>
        </div>
      </div>

      {/* Encrypted uploads + admin-only decrypt/publish controls */}
      <SecureQuestionBankPanel subjects={subjects} />

      {/* Filters Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search question text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="form-input pl-8 text-xs py-2 w-full"
            />
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="form-input text-xs py-2 w-full bg-slate-50"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="form-input text-xs py-2 w-full bg-slate-50"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input text-xs py-2 w-full bg-slate-50"
            >
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="all">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No questions found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-white/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Options</th>
                  <th className="py-3 px-4">Ver</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {questions.map((q) => {
                  const opts = q.question_options || []
                  const correctOpt = opts.find((o: any) => o.is_correct)

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3 px-4 text-blue-600 font-semibold whitespace-nowrap">
                        {q.subjects?.name || '—'}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p className="font-medium text-slate-900 line-clamp-2">{q.question_text}</p>
                        {correctOpt && (
                          <span className="text-[11px] text-emerald-600/90 font-mono mt-0.5 block">
                            ✓ {correctOpt.option_text}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          q.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : q.difficulty === 'hard'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-100 text-amber-600 border border-amber-200'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {opts.length} options
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        v{q.version}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                            title="Preview question"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(q)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                            title="Edit question"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveToggle(q.id, q.status)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-amber-600"
                            title={q.status === 'archived' ? 'Restore' : 'Archive'}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authoring & Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit MCQ Question' : 'Author New MCQ Question'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-500 hover:text-slate-900 text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="form-input text-xs w-full bg-slate-50"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="form-input text-xs w-full bg-slate-50"
                  >
                    <option value="easy">Easy (+1 pt)</option>
                    <option value="medium">Medium (+1 pt)</option>
                    <option value="hard">Hard (+1 pt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Question Text (Minimum 5 characters)
                </label>
                <textarea
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the complete question problem statement..."
                  className="form-input text-xs w-full h-24 font-sans"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-600 mb-1">
                  Answer Options (Select the single correct answer radio button)
                </label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.isCorrect}
                      onChange={() => handleSetCorrect(i)}
                      className="h-4 w-4 accent-indigo-600 cursor-pointer"
                      title="Mark as correct answer"
                    />
                    <span className="font-mono text-slate-500 w-4 font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      required={i < 2}
                      value={opt.text}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className={`form-input text-xs flex-1 ${opt.isCorrect ? 'border-blue-200/60 bg-blue-50/20' : ''}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Explanation / Solution Walkthrough
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the marked answer is correct..."
                  className="form-input text-xs w-full h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {saving ? 'Saving...' : editingId ? 'Update & Snapshot' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs uppercase font-bold text-blue-600">
                {previewQuestion.subjects?.name} • {previewQuestion.difficulty}
              </span>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {previewQuestion.question_text}
              </p>
            </div>

            <div className="space-y-2">
              {(previewQuestion.question_options || []).map((o: any, idx: number) => (
                <div
                  key={o.id}
                  className={`p-3 rounded-lg border text-xs flex items-center gap-3 ${
                    o.is_correct
                      ? 'border-emerald-500/50 bg-emerald-50 text-emerald-200'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600'
                  }`}
                >
                  <span className="font-mono font-bold w-4">{String.fromCharCode(65 + idx)}</span>
                  <span className="flex-1">{o.option_text}</span>
                  {o.is_correct && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                </div>
              ))}
            </div>

            {previewQuestion.explanation && (
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200 text-xs text-slate-500">
                <strong className="block text-slate-700 mb-1">Explanation:</strong>
                {previewQuestion.explanation}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="btn-ghost text-xs px-4 py-2"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Import Questions (CSV / JSON)
              </h2>
              <button
                onClick={() => {
                  setIsImportOpen(false)
                  setImportReport(null)
                }}
                className="text-slate-500 hover:text-slate-900 text-base p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Paste valid CSV rows with headers <code>Subject, Question, Difficulty, Option A, Option B, Option C, Option D, Correct Option, Explanation</code> or JSON array.
            </p>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-600 underline"
              >
                <FileText className="h-3.5 w-3.5" /> Download CSV Template
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste CSV lines or JSON array here..."
                className="form-input text-xs w-full h-44 font-mono leading-relaxed"
                required
              />

              {importReport && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-600">Successfully Imported: {importReport.successCount}</span>
                    <span className="text-amber-600">Skipped Duplicates: {importReport.skippedDuplicates}</span>
                  </div>
                  {importReport.errors?.length > 0 && (
                    <div className="text-red-600 space-y-1 pt-2 border-t border-slate-200">
                      <span className="font-bold">Errors ({importReport.errors.length}):</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {importReport.errors.slice(0, 5).map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false)
                    setImportReport(null)
                  }}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="btn-primary text-xs px-5 py-2 shadow-glow-sm"
                >
                  {importing ? 'Processing...' : 'Run Import Validation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
