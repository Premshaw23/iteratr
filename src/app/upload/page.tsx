'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { Upload, ChevronLeft, X, Loader, Check, Copy, AlertCircle } from 'lucide-react'

type UploadType = 'learning_goals' | 'notes' | 'code_snippets' | 'interview_prep' | 'other'

const UPLOAD_TYPES: { id: UploadType; label: string; description: string }[] = [
  { id: 'learning_goals', label: 'Learning Goals', description: 'Your study objectives' },
  { id: 'notes', label: 'Study Notes', description: 'Important concepts & notes' },
  { id: 'code_snippets', label: 'Code Snippets', description: 'Useful code examples' },
  { id: 'interview_prep', label: 'Interview Prep', description: 'Interview strategies & tips' },
  { id: 'other', label: 'Other', description: 'Miscellaneous data' },
]

interface Upload {
  id: string
  type: UploadType
  title: string
  tags: string[]
  is_public: boolean
  created_at: string
}

interface UploadError {
  message: string
  timestamp: number
}

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [uploadType, setUploadType] = useState<UploadType>('learning_goals')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<UploadError | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loadingUploads, setLoadingUploads] = useState(false)
  const [copied, setCopied] = useState<string>('')

  // Fetch uploads on mount or session change
  const fetchUploads = useCallback(async () => {
    setLoadingUploads(true)
    try {
      const res = await fetch('/api/user/upload?limit=20', { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`)
      const data = await res.json()
      setUploads(Array.isArray(data.uploads) ? data.uploads : [])
    } catch (error) {
      console.error('Failed to fetch uploads:', error)
      setUploads([])
    } finally {
      setLoadingUploads(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchUploads()
    }
  }, [status, router, fetchUploads])

  // Clear errors after 5 seconds
  useEffect(() => {
    if (!uploadError) return
    const timer = setTimeout(() => setUploadError(null), 5000)
    return () => clearTimeout(timer)
  }, [uploadError])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (!uploadSuccess) return
    const timer = setTimeout(() => setUploadSuccess(false), 3000)
    return () => clearTimeout(timer)
  }, [uploadSuccess])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)

    if (!title.trim()) {
      setUploadError({ message: '⚠️ Title is required', timestamp: Date.now() })
      return
    }

    if (!content.trim()) {
      setUploadError({ message: '⚠️ Content is required', timestamp: Date.now() })
      return
    }

    if (content.length > 1048576) {
      setUploadError({ message: '⚠️ Content exceeds 1MB limit', timestamp: Date.now() })
      return
    }

    setUploading(true)
    const startTime = Date.now()

    try {
      const res = await fetch('/api/user/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000), // 15 second timeout
        body: JSON.stringify({
          type: uploadType,
          title: title.trim(),
          content: content.trim(),
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          isPublic,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(errorData.error || `Upload failed: ${res.status}`)
      }

      const data = await res.json()

      // Show success
      setUploadSuccess(true)
      setTitle('')
      setContent('')
      setTags('')
      setIsPublic(false)

      // Refresh uploads list
      await fetchUploads()
    } catch (error: any) {
      const message = error.name === 'AbortError'
        ? '❌ Upload timeout (took too long)'
        : `❌ ${error.message || 'Upload failed'}`
      setUploadError({ message, timestamp: Date.now() })
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this upload? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/user/upload?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setUploads((prev) => prev.filter((u) => u.id !== id))
    } catch (error: any) {
      setUploadError({ message: `❌ Delete failed: ${error.message}`, timestamp: Date.now() })
    }
  }

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size={32} className="animate-spin text-brand" />
          <p className="text-mid text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-muted hover:text-dark mb-4 flex items-center gap-1 transition"
          >
            <ChevronLeft size={16} /> Dashboard
          </button>
          <h1 className="text-3xl font-bold text-dark">Private Data Upload</h1>
          <p className="text-sm text-mid mt-2">
            Upload and manage your learning materials privately.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleUpload} className="bg-white border border-border rounded-2xl p-6 space-y-6">
              {/* Error Alert */}
              {uploadError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900 font-medium">{uploadError.message}</p>
                </div>
              )}

              {/* Upload Type */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">
                  Upload Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {UPLOAD_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setUploadType(t.id)}
                      disabled={uploading}
                      className={`text-left p-3 rounded-lg border transition ${
                        uploadType === t.id
                          ? 'border-brand bg-brand-light'
                          : 'border-border hover:border-brand'
                      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <p className={`text-sm font-medium ${uploadType === t.id ? 'text-brand' : 'text-dark'}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. System Design Interview Notes"
                  disabled={uploading}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-brand disabled:opacity-50"
                  maxLength={255}
                />
                <p className="text-xs text-muted mt-1">{title.length} / 255</p>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Content *
                  </label>
                  <span className={`text-xs ${content.length > 1048576 ? 'text-red-600 font-bold' : 'text-muted'}`}>
                    {(content.length / 1024).toFixed(1)} / 1024 KB
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your notes, code, or study material here..."
                  disabled={uploading}
                  rows={8}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-dark bg-white resize-none focus:outline-none focus:border-brand placeholder:text-muted font-mono disabled:opacity-50"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">
                  Tags <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. algorithms, dynamic-programming, leetcode"
                  disabled={uploading}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-dark bg-white focus:outline-none focus:border-brand disabled:opacity-50"
                />
              </div>

              {/* Privacy */}
              <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                <input
                  type="checkbox"
                  id="public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={uploading}
                  className="w-4 h-4 accent-brand cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="public" className="text-sm text-dark cursor-pointer">
                  Make public (shareable link)
                </label>
              </div>

              {/* Upload Button */}
              <button
                type="submit"
                disabled={uploading || !title.trim() || !content.trim()}
                className="w-full bg-brand text-white font-semibold py-3 rounded-lg hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {uploading ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Upload Data
                  </>
                )}
              </button>

              {/* Success Message */}
              {uploadSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-in">
                  <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 text-sm">✅ Upload successful!</p>
                    <p className="text-xs text-green-700 mt-1">Your data has been saved privately.</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Recent Uploads */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-2xl p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-dark mb-4">Recent Uploads</h2>

              {loadingUploads ? (
                <div className="flex justify-center py-8">
                  <Loader size={20} className="animate-spin text-brand" />
                </div>
              ) : uploads.length === 0 ? (
                <p className="text-sm text-muted text-center py-8">No uploads yet</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="p-3 bg-surface rounded-lg text-sm group hover:bg-slate-100 transition">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark truncate">{upload.title}</p>
                          <p className="text-xs text-muted mt-1">
                            {new Date(upload.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(upload.id)}
                          className="text-red-500 hover:text-red-700 transition flex-shrink-0 opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded">
                          {upload.type}
                        </span>
                        {upload.is_public && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            Public
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(upload.id)}
                        className="text-xs text-muted hover:text-brand transition flex items-center gap-1"
                      >
                        <Copy size={12} />
                        {copied === upload.id ? 'Copied!' : 'Copy ID'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
