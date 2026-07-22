import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4" onClick={onCancel}>
      <div
        className="bg-dungeon-900 border border-amber-800 rounded-xl w-full max-w-sm shadow-2xl p-5 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 shrink-0 ${danger ? 'text-red-400' : 'text-amber-500'}`} />
          <h3 className="text-amber-400 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h3>
        </div>
        <p className="text-stone-300 text-sm">{message}</p>
        <div className="flex gap-2 justify-end mt-1">
          <button onClick={onCancel} className="text-stone-500 hover:text-stone-300 text-sm px-3 py-1.5">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              danger ? 'bg-red-700 hover:bg-red-600 text-red-50' : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
