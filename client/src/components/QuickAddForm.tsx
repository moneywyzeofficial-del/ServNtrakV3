import * as React from "react"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PhoneInput } from "@/components/PhoneInput"
import { apiRequest } from "@/lib/queryClient"

const COUNTRY_CODES = [
  { label: "PT +351", value: "+351" },
  { label: "BR +55", value: "+55" },
  { label: "GB +44", value: "+44" },
  { label: "FR +33", value: "+33" },
  { label: "DE +49", value: "+49" },
  { label: "ES +34", value: "+34" },
  { label: "IT +39", value: "+39" },
  { label: "NL +31", value: "+31" },
  { label: "BE +32", value: "+32" },
  { label: "CH +41", value: "+41" },
  { label: "US +1", value: "+1" },
]

export interface QuickAddFormPrefill {
  name?: string
  phone?: string
  countryCode?: string
  email?: string
}

interface QuickAddFormProps {
  prefill?: QuickAddFormPrefill
  onSuccess: (client: { id: number; name: string }) => void
  onCancel: () => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any
  }
}

export function QuickAddForm({ prefill, onSuccess, onCancel }: QuickAddFormProps) {
  const [name, setName] = React.useState(prefill?.name ?? "")
  const [phone, setPhone] = React.useState(prefill?.phone ?? "")
  const [countryCode, setCountryCode] = React.useState(prefill?.countryCode ?? "+351")
  const [email, setEmail] = React.useState(prefill?.email ?? "")
  const [listening, setListening] = React.useState(false)
  const [extracting, setExtracting] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = React.useRef<any>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (prefill) {
      if (prefill.name !== undefined) setName(prefill.name)
      if (prefill.phone !== undefined) setPhone(prefill.phone)
      if (prefill.countryCode !== undefined) setCountryCode(prefill.countryCode)
      if (prefill.email !== undefined) setEmail(prefill.email)
    }
  }, [prefill])

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/clients/quick-add", {
        name: name.trim(),
        phone: phone.trim() || null,
        countryCode: countryCode || "+351",
        email: email.trim() || null,
      })
      return res.json()
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] })
      onSuccess({ id: client.id, name: client.name })
      toast({ title: "Cliente criado", description: client.name })
    },
    onError: () => {
      toast({ title: "Erro ao criar cliente", variant: "destructive" })
    },
  })

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      toast({ title: "Reconhecimento de voz não suportado neste dispositivo", variant: "destructive" })
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = "pt-PT"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      toast({ title: "Erro no microfone", variant: "destructive" })
    }

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setExtracting(true)
      try {
        const res = await apiRequest("POST", "/api/ai/extract-client", { text: transcript })
        if (!res.ok) throw new Error()
        const data: { name: string; phone: string | null; countryCode: string | null; email: string | null } = await res.json()
        if (data.name) setName(data.name)
        if (data.phone) setPhone(data.phone)
        if (data.countryCode) setCountryCode(data.countryCode)
        if (data.email) setEmail(data.email)
      } catch {
        toast({ title: "Não foi possível extrair os dados do cliente", variant: "destructive" })
      } finally {
        setExtracting(false)
      }
    }

    recognition.start()
  }

  const optional = <span className="ml-1 text-xs text-muted-foreground font-normal">(Opcional)</span>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Novo Cliente</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleVoice}
          disabled={extracting}
          className="gap-1.5"
        >
          {extracting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : listening ? (
            <MicOff className="h-4 w-4 text-destructive" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {extracting ? "A processar..." : listening ? "Parar" : "Ditado"}
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor="qaf-name">Nome</Label>
        <Input
          id="qaf-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do cliente"
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="qaf-phone">Telefone {optional}</Label>
        <div className="flex gap-2">
          <select
            id="qaf-country"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="h-10 rounded-xl border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <PhoneInput
            value={phone}
            onChange={(v) => setPhone(v)}
            placeholder="912 345 678"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="qaf-email">Email {optional}</Label>
        <Input
          id="qaf-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          type="email"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!name.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Guardar
        </Button>
      </div>
    </div>
  )
}
