'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileText, Check, Loader2 } from 'lucide-react'

interface UploadedDoc {
  id: string
  filename: string
  created_at: string
}

interface DocumentUploadProps {
  country: string
  accentColor: string
}

export default function DocumentUpload({ country, accentColor }: DocumentUploadProps) {
  const [documents, setDocuments] = useState<UploadedDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      setError(null)
      setSuccess(false)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('country', country)

        const res = await fetch('/api/ocr/extract', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Upload failed (${res.status})`)
        }

        const data = await res.json()
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev])
        }
        setSuccess(true)
        setTimeout(() => setSuccess(false), 4000)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [country]
  )

  const handleDelete = useCallback((docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  return (
    <div className="px-3 py-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 border border-dashed border-white/10 hover:border-white/20 text-white/50 hover:text-white/70"
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Extracting content...</span>
          </>
        ) : (
          <>
            <Upload size={16} />
            <span>Upload Document</span>
          </>
        )}
      </button>

      {/* Success message */}
      {success && (
        <div className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-emerald-500/10">
          <Check size={12} className="text-emerald-400" />
          <span className="text-[11px] text-emerald-400">
            Document processed — prescriptions will now reference your uploaded content
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 px-2 py-1.5 rounded-md bg-red-500/10">
          <span className="text-[11px] text-red-400">{error}</span>
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <ul className="mt-3 space-y-1">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-white/40 hover:bg-white/[0.03] group"
            >
              <FileText size={13} style={{ color: accentColor }} />
              <span className="text-[11px] truncate flex-1">{doc.filename}</span>
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white/30 hover:text-red-400" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
