import { useState, useRef } from "react"
import { Mic, MicOff, Send, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface VoiceToTextProps {
  onFinalText: (text: string) => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any
  }
}

export default function VoiceToText({ onFinalText }: VoiceToTextProps) {
  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const [sending, setSending] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const SR = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null

  if (!SR) {
    return <p className="text-destructive text-sm">O seu browser não suporta reconhecimento de voz.</p>
  }

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = "pt-PT"
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let result = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          result += event.results[i][0].transcript + " "
        }
      }
      if (result) setTranscript(prev => (prev + result).trim())
    }

    recognition.start()
  }

  const handleSend = async () => {
    if (!transcript.trim()) return
    setSending(true)
    try {
      await onFinalText(transcript.trim())
      setTranscript("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-background shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Relatório de Voz</h3>
        <Button
          type="button"
          variant={listening ? "destructive" : "default"}
          onClick={toggleListening}
          className="gap-1.5"
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {listening ? "Parar" : "Falar"}
        </Button>
      </div>

      <Textarea
        value={transcript}
        onChange={e => setTranscript(e.target.value)}
        placeholder="O que ditar aparecerá aqui..."
        className="bg-muted min-h-[100px]"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!transcript.trim() || sending}
          onClick={() => setTranscript("")}
          className="gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Limpar
        </Button>

        <Button
          type="button"
          disabled={!transcript.trim() || listening || sending}
          onClick={handleSend}
          className="flex-1"
        >
          {sending
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <Send className="mr-2 h-4 w-4" />}
          Enviar para Assistente IA
        </Button>
      </div>
    </div>
  )
}
