/*
 * Multimodal chat input bar supporting text, image/PDF file uploads,
 * live webcam capture, Google Search grounding toggle, and voice STT.
 */

import {
  Camera,
  FileText,
  Globe,
  Paperclip,
  Send,
  Square,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_BYTES,
} from '../../config/constants';
import { useUiStore } from '../../store/uiStore';
import type { Attachment } from '../../types';
import { formatFileSize, generateId } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { VoiceButton } from './VoiceButton';

interface InputBarProps {
  isStreaming: boolean;
  isListening: boolean;
  micAmplitude: number;
  interimTranscript: string;
  searchEnabled: boolean;
  onToggleSearch: () => void;
  onToggleVoice: () => void;
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function InputBar({
  isStreaming,
  isListening,
  micAmplitude,
  interimTranscript,
  searchEnabled,
  onToggleSearch,
  onToggleVoice,
  onSend,
  onStop,
}: InputBarProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const addToast = useUiStore((s) => s.addToast);

  useEffect(() => {
    if (interimTranscript) {
      setText(interimTranscript);
    }
  }, [interimTranscript]);

  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        addToast({
          title: 'Camera unavailable',
          description: 'Please allow camera access in browser permissions.',
          variant: 'warning',
        });
        setCameraOpen(false);
      });

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOpen, addToast]);

  const handleFilePick = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (
        !ALLOWED_ATTACHMENT_TYPES.includes(
          file.type as (typeof ALLOWED_ATTACHMENT_TYPES)[number]
        )
      ) {
        addToast({
          title: 'Unsupported file type',
          description: 'Upload PNG, JPEG, WEBP, GIF images or PDF documents.',
          variant: 'warning',
        });
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        addToast({
          title: 'File too large',
          description: `${file.name} exceeds the 8 MB limit.`,
          variant: 'warning',
        });
        continue;
      }
      const dataBase64 = await readFileAsBase64(file);
      const previewUrl = file.type.startsWith('image/')
        ? `data:${file.type};base64,${dataBase64}`
        : undefined;
      setAttachments((prev) => [
        ...prev,
        {
          id: generateId('att'),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataBase64,
          previewUrl,
        },
      ]);
    }
    e.target.value = '';
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const base64 = dataUrl.split(',')[1] ?? '';

    setAttachments((prev) => [
      ...prev,
      {
        id: generateId('cam'),
        name: `camera-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        size: Math.round((base64.length * 3) / 4),
        dataBase64: base64,
        previewUrl: dataUrl,
      },
    ]);
    setCameraOpen(false);
  };

  const submitMessage = () => {
    if (isStreaming) return;
    if (!text.trim() && attachments.length === 0) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className="nova-surface-elevated rounded-2xl p-3 space-y-2.5">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative flex items-center gap-2 rounded-xl nova-surface px-2.5 py-1.5 text-xs"
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <FileText className="w-4 h-4 text-[var(--accent)]" />
              )}
              <div className="max-w-[140px] truncate">
                <div className="truncate font-medium">{att.name}</div>
                <div className="text-[11px] text-[var(--nova-text-muted)]">
                  {formatFileSize(att.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((p) => p.id !== att.id))
                }
                aria-label={`Remove ${att.name}`}
                className="p-1 text-[var(--nova-text-muted)] hover:text-rose-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="Ask NOVA anything, attach an image or PDF, or use voice…"
        className="w-full resize-none bg-transparent px-1.5 py-1 text-sm text-[var(--nova-text)] placeholder:text-[var(--nova-text-muted)] focus:outline-none"
      />

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--nova-border)]">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => void handleFilePick(e)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach image or PDF"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-500/10 transition-colors nova-accent-ring cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            aria-label="Capture photo from camera"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-500/10 transition-colors nova-accent-ring cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleSearch}
            aria-pressed={searchEnabled}
            style={
              searchEnabled
                ? {
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }
                : undefined
            }
            className={`min-h-[40px] px-3 flex items-center gap-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors nova-accent-ring cursor-pointer ${
              searchEnabled
                ? ''
                : 'text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-500/10'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Search</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <VoiceButton
            isListening={isListening}
            micAmplitude={micAmplitude}
            onToggle={onToggleVoice}
          />
          {isStreaming ? (
            <Button variant="danger" size="sm" onClick={onStop}>
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={!text.trim() && attachments.length === 0}
              onClick={submitMessage}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        title="Camera Capture"
        description="Take a photo to ask NOVA visual questions."
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCameraOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCapturePhoto}>
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
