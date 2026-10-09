import { useEffect, useRef, useCallback, useState } from "react";

export interface ClienteComLocalizacao {
  id: number;
  nome: string;
  latitude: number;
  longitude: number;
  agendamentoId?: number;
}

export interface EventoVisita {
  clienteId: number;
  clienteNome: string;
  agendamentoId?: number;
  tipo: "entrada" | "saida";
  timestamp: Date;
  coordenadas: { latitude: number; longitude: number };
}

export interface VisitaAtiva {
  clienteId: number;
  clienteNome: string;
  agendamentoId?: number;
  inicio: Date;
  coordenadasEntrada: { latitude: number; longitude: number };
}

export interface VisitaConcluida {
  clienteId: number;
  clienteNome: string;
  agendamentoId?: number;
  inicio: Date;
  fim: Date;
  duracaoMinutos: number;
}

export interface OpcoesGeofencing {
  raioMetros?: number;
  onEntrada?: (evento: EventoVisita) => void;
  onSaida?: (visita: VisitaConcluida) => void;
  onErro?: (erro: GeolocationPositionError) => void;
}

export interface EstadoGeofencing {
  ativo: boolean;
  posicaoAtual: GeolocationCoordinates | null;
  visitaAtiva: VisitaAtiva | null;
  ultimoUpdate: Date | null;
  erro: string | null;
  iniciar: () => void;
  parar: () => void;
  confirmarVisita: (visita: VisitaConcluida) => void;
  visitasPendentesConfirmacao: VisitaConcluida[];
}

function calcularDistanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeofencing(clientes: ClienteComLocalizacao[], opcoes: OpcoesGeofencing = {}): EstadoGeofencing {
  const { raioMetros = 75, onEntrada, onSaida, onErro } = opcoes;

  const [ativo, setAtivo] = useState(false);
  const [posicaoAtual, setPosicaoAtual] = useState<GeolocationCoordinates | null>(null);
  const [visitaAtiva, setVisitaAtiva] = useState<VisitaAtiva | null>(null);
  const [ultimoUpdate, setUltimoUpdate] = useState<Date | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [visitasPendentesConfirmacao, setVisitasPendentesConfirmacao] = useState<VisitaConcluida[]>([]);

  const visitaAtivaRef = useRef<VisitaAtiva | null>(null);
  const clientesRef = useRef<ClienteComLocalizacao[]>(clientes);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => { visitaAtivaRef.current = visitaAtiva; }, [visitaAtiva]);
  useEffect(() => { clientesRef.current = clientes; }, [clientes]);

  const processarPosicao = useCallback((posicao: GeolocationPosition) => {
    const { latitude, longitude } = posicao.coords;
    setPosicaoAtual(posicao.coords);
    setUltimoUpdate(new Date());
    setErro(null);

    const clientesDoDia = clientesRef.current.filter(c => c.agendamentoId !== undefined);

    let clienteMaisProximo: ClienteComLocalizacao | null = null;
    let menorDistancia = Infinity;

    for (const cliente of clientesDoDia) {
      const distancia = calcularDistanciaMetros(latitude, longitude, cliente.latitude, cliente.longitude);
      if (distancia <= raioMetros && distancia < menorDistancia) {
        menorDistancia = distancia;
        clienteMaisProximo = cliente;
      }
    }

    const visitaCorrente = visitaAtivaRef.current;

    if (clienteMaisProximo) {
      if (!visitaCorrente) {
        const novaVisita: VisitaAtiva = {
          clienteId: clienteMaisProximo.id,
          clienteNome: clienteMaisProximo.nome,
          agendamentoId: clienteMaisProximo.agendamentoId,
          inicio: new Date(),
          coordenadasEntrada: { latitude, longitude },
        };
        setVisitaAtiva(novaVisita);
        onEntrada?.({
          clienteId: clienteMaisProximo.id,
          clienteNome: clienteMaisProximo.nome,
          agendamentoId: clienteMaisProximo.agendamentoId,
          tipo: "entrada",
          timestamp: novaVisita.inicio,
          coordenadas: { latitude, longitude },
        });
      }
    } else {
      if (visitaCorrente) {
        const fim = new Date();
        const duracaoMinutos = Math.round((fim.getTime() - visitaCorrente.inicio.getTime()) / 60_000);
        if (duracaoMinutos >= 5) {
          const visitaConcluida: VisitaConcluida = {
            clienteId: visitaCorrente.clienteId,
            clienteNome: visitaCorrente.clienteNome,
            agendamentoId: visitaCorrente.agendamentoId,
            inicio: visitaCorrente.inicio,
            fim,
            duracaoMinutos,
          };
          setVisitasPendentesConfirmacao(prev => [...prev, visitaConcluida]);
          onSaida?.(visitaConcluida);
        }
        setVisitaAtiva(null);
      }
    }
  }, [raioMetros, onEntrada, onSaida]);

  const processarErro = useCallback((err: GeolocationPositionError) => {
    const mensagens: Record<number, string> = {
      1: "Permissão de localização negada. Ativa o GPS nas definições.",
      2: "Posição não disponível. Verifica o sinal GPS.",
      3: "Timeout a obter localização.",
    };
    setErro(mensagens[err.code] ?? "Erro desconhecido de GPS.");
    onErro?.(err);
  }, [onErro]);

  const iniciar = useCallback(() => {
    if (!navigator.geolocation) { setErro("GPS não suportado neste dispositivo."); return; }
    if (watchIdRef.current !== null) return;
    setAtivo(true);
    setErro(null);
    watchIdRef.current = navigator.geolocation.watchPosition(processarPosicao, processarErro, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 20_000,
    });
  }, [processarPosicao, processarErro]);

  const parar = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setAtivo(false);
    setVisitaAtiva(null);
  }, []);

  useEffect(() => { return () => { parar(); }; }, [parar]);

  const confirmarVisita = useCallback((visita: VisitaConcluida) => {
    setVisitasPendentesConfirmacao(prev =>
      prev.filter(v => !(v.clienteId === visita.clienteId && v.inicio.getTime() === visita.inicio.getTime()))
    );
  }, []);

  return { ativo, posicaoAtual, visitaAtiva, ultimoUpdate, erro, iniciar, parar, confirmarVisita, visitasPendentesConfirmacao };
}
