'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  Upload,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  RefreshCw,
  FileText,
  Send,
  Undo2,
  X,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'

interface Bank {
  id: string
  original_filename: string
  file_size: number
  encryption_algorithm: string
  key_version: number
  row_count: number
  status: 'draft' | 'published' | 'archived' | string
  published_at: string | null
  created_at: string
}

interface DecryptedQuestion {
  subject: string
  question_text: string
  difficulty: string
  explanation?: string
  options: Array<{ text: string; is_correct: boolean }>
}

export function SecureQuestionBankPanel({ subjects }: { subjects: Array<{ id: string; name: string }> }) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [subjectId, setSubjectId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Bank | null>(null)
  const [questions, setQuestions] = useState<DecryptedQuestion[] | null>(null)
  const [decrypting, setDecrypting] = useState(false)
  const [revealAnswers, setRevealAnswers] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/question-banks')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load encrypted banks')
      setBanks(data.banks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load encrypted banks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error('Choose a CSV or XLSX question-bank file first.')
      return
    }
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (subjectId) formData.append('subject_id', subjectId)

      const res = await fetch('/api/admin/question-banks', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(Array.isArray(data.errors) ? data.errors.join('\n') : data.error || 'Upload failed')
        throw new Error(data.error || 'Upload failed')
      }
      toast.success(`Encrypted bank stored — ${data.bank?.row_count ?? 0} questions.`)
      setFile(null)
      const input = document.getElementById('question-bank-file') as HTMLInputElement | null
      if (input) input.value = ''
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDecrypt(bank: Bank) {
    setViewing(bank)
    setQuestions(null)
    setRevealAnswers(false)
    setDecrypting(true)
    try {
      const res = await fetch(`/api/admin/question-banks/${bank.id}?action=decrypt`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Decryption failed')
      setQuestions(data.questions || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Decryption failed')
      setViewing(null)
    } finally {
      setDecrypting(false)
    }
  }

  async function handleAction(bank: Bank, action: 'publish' | 'unpublish') {
    setBusyId(bank.id)
    try {
      const res = await fetch(`/api/admin/question-banks/${bank.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      toast.success(data.message || 'Done')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="glass-card p-5 sm:p-6 space-y-5 border-blue-200/40">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-200/40 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Secure Encrypted Question Banks</h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Upload CSV or XLSX files. Contents are encrypted with AES-256-GCM on the server and stored in a
              private bucket. Only admins can decrypt them; practice publishing never exposes correct answers.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="h-3.5 w-3.5" /> Server-side keys only
        </span>
      </div>

      <form onSubmit={handleUpload} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end p-4 rounded-xl bg-slate-50/70 border border-slate-200">
        <div>
          <label htmlFor="question-bank-file" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Question-bank file (CSV / XLSX, max 10 MB)
          </label>
          <input
            id="question-bank-file"
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:px-3 file:py-2 file:text-xs file:font-semibold hover:file:bg-blue-700"
          />
        </div>
        <div>
          <label htmlFor="default-subject" className="block text-xs font-semibold text-slate-600 mb-1.5">
            Default subject (optional)
          </label>
          <select
            id="default-subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="form-input text-xs py-2 w-full sm:w-48"
          >
            <option value="">Use file column</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={uploading} className="btn-primary text-xs px-4 py-2.5">
          {uploading
            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Encrypting…</>
            : <><Upload className="h-3.5 w-3.5" /> Encrypt &amp; Upload</>}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 whitespace-pre-line flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /> Loading encrypted banks…
          </div>
        ) : banks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            No encrypted question banks uploaded yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">File</th>
                <th className="py-2.5 px-3">Questions</th>
                <th className="py-2.5 px-3">Encryption</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Uploaded</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banks.map((bank) => (
                <tr key={bank.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate max-w-[220px]">{bank.original_filename}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{Math.ceil(bank.file_size / 1024)} KB</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{bank.row_count}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Lock className="h-3 w-3" /> {bank.encryption_algorithm} · v{bank.key_version}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      bank.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {bank.status === 'published' ? 'Published practice' : 'Draft (private)'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{formatDateTime(bank.created_at)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDecrypt(bank)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                        title="Decrypt and view (admin only)"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {bank.status === 'published' ? (
                        <button
                          type="button"
                          disabled={busyId === bank.id}
                          onClick={() => handleAction(bank, 'unpublish')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-[11px] font-semibold disabled:opacity-50"
                        >
                          <Undo2 className="h-3.5 w-3.5" /> Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === bank.id}
                          onClick={() => handleAction(bank, 'publish')}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold disabled:opacity-50"
                        >
                          <Send className="h-3.5 w-3.5" /> Publish practice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase">Admin decrypted view</span>
                <h3 className="text-lg font-bold text-slate-900">{viewing.original_filename}</h3>
                <p className="text-xs text-slate-500">{questions?.length ?? 0} questions · decrypted on the server only</p>
              </div>
              <button onClick={() => setViewing(null)} className="p-1 text-slate-500 hover:text-slate-900" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRevealAnswers((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                {revealAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {revealAnswers ? 'Hide correct answers' : 'Reveal correct answers'}
              </button>
              {viewing.status === 'published' && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Public practice is live (answers withheld)
                </span>
              )}
            </div>

            {decrypting ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-blue-600" /> Decrypting…
              </div>
            ) : (
              <ol className="space-y-4">
                {(questions ?? []).map((q, idx) => (
                  <li key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{idx + 1}. {q.question_text}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-600 font-semibold mt-1">{q.subject}</p>
                    <ul className="mt-2 space-y-1">
                      {q.options.map((o, oi) => (
                        <li
                          key={oi}
                          className={`text-xs px-2 py-1 rounded ${
                            revealAnswers && o.is_correct
                              ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}. {o.text}
                          {revealAnswers && o.is_correct && ' ✓'}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <p className="mt-2 text-[11px] text-slate-500 italic">{q.explanation}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
