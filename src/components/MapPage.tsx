import { useRef, useState } from 'react'
import { Map, Upload, Loader2, ArrowLeft } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'
import { updateCampaign } from '../lib/firestore'
import { useCampaignStore } from '../store/useCampaignStore'

interface Props {
  onBack: () => void
}

export function MapPage({ onBack }: Props) {
  const campaign = useCampaignStore((s) => s.campaign)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }
    setError(null)
    setUploading(true)
    try {
      const storageRef = ref(storage, 'campaign/map')
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updateCampaign({ mapImageUrl: url })
    } catch {
      setError('Upload failed. Check your Firebase Storage rules.')
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-dungeon-900">
      {/* Sub-header */}
      <div className="border-b border-amber-900/50 px-4 md:px-6 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-stone-500 hover:text-amber-400 transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Map className="w-5 h-5 text-amber-500" />
        <h2 className="text-amber-400 font-semibold" style={{ fontFamily: 'Cinzel, serif' }}>
          The story so far...
        </h2>
        <div className="ml-auto">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-amber-800 text-amber-400 hover:bg-amber-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading ? 'Uploading...' : 'Upload map'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 overflow-auto p-4 md:p-6 flex items-center justify-center">
        {error && (
          <p className="absolute top-20 left-1/2 -translate-x-1/2 text-red-400 text-sm bg-red-950/60 border border-red-800 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {campaign?.mapImageUrl ? (
          <div
            className="w-full h-full flex items-center justify-center"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <img
              src={campaign.mapImageUrl}
              alt="Campaign map"
              className="max-w-full max-h-full object-contain rounded-xl border border-amber-900/40 shadow-2xl"
            />
          </div>
        ) : (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-amber-900/50 rounded-2xl w-full max-w-lg h-64 cursor-pointer hover:border-amber-700 transition-colors group"
          >
            <Map className="w-12 h-12 text-amber-900 group-hover:text-amber-700 transition-colors" />
            <div className="text-center">
              <p className="text-stone-500 text-sm">No map uploaded yet</p>
              <p className="text-stone-600 text-xs mt-1">Click or drag an image here to upload</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
