import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
  time: string;
}

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "bot",
    text: "Olá Tiago! 👋 Sou o teu assistente da Peralta Gardens. O que precisas?",
    time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<{role: string, content: string}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Drag state ─────────────────────────────────────────────
  const [pos, setPos] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 160 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    didDrag.current = false;
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    didDrag.current = true;
    const BUTTON_SIZE = 56;
    const newX = Math.min(
      Math.max(0, e.clientX - dragOffset.current.x),
      window.innerWidth - BUTTON_SIZE
    );
    const newY = Math.min(
      Math.max(0, e.clientY - dragOffset.current.y),
      window.innerHeight - BUTTON_SIZE
    );
    setPos({ x: newX, y: newY });
  };

  const onPointerUp = () => {
    dragging.current = false;
    // Só abre/fecha se não arrastou
    if (!didDrag.current) {
      setIsOpen(prev => !prev);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getTime = () =>
    new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setInput("");
    setIsLoading(true);

    const userMsg: Message = { role: "user", text: msg, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    const newHistory = [...history, { role: "user", content: msg }];

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg, history: newHistory.slice(-10) })
      });
      const data = await res.json();
      const reply = data.reply || "Sem resposta.";
      setMessages(prev => [...prev, { role: "bot", text: reply, time: getTime() }]);
      setHistory([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "⚠️ Erro ao contactar o assistente.", time: getTime() }
      ]);
    }
    setIsLoading(false);
  };

  // Posição do chat — abre por cima ou por baixo conforme espaço disponível
  const chatTop = pos.y > window.innerHeight / 2
    ? pos.y - 510
    : pos.y + 64;
  const chatLeft = Math.min(
    Math.max(0, pos.x - 240),
    window.innerWidth - 320
  );

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ left: pos.x, top: pos.y, touchAction: "none" }}
        className="fixed w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 shadow-lg flex items-center justify-center z-[60] transition-shadow cursor-grab active:cursor-grabbing select-none"
        data-testid="button-assistant-toggle"
      >
        <span className="text-white text-2xl pointer-events-none">
          {isOpen ? "✕" : "🌿"}
        </span>
      </button>

      {isOpen && (
        <div
          style={{ left: chatLeft, top: chatTop }}
          className="fixed w-80 h-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-4 bg-green-600 text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-400 flex items-center justify-center text-lg">🌿</div>
            <div>
              <p className="font-semibold text-sm">Assistente ServNtrak</p>
              <p className="text-xs text-green-200">● Online</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" data-testid="assistant-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-green-600 text-white rounded-br-sm"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                }`}>
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1">{msg.time}</span>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Escreve aqui..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
              data-testid="input-assistant-message"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-xl flex items-center justify-center text-white transition-colors"
              data-testid="button-assistant-send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
