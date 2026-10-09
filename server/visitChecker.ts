import { db } from "./db";
import { appointments, clients } from "@shared/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import { sendPushToUser } from "./pushService";
import { log } from "./index";

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutos
const OVERDUE_MS = 30 * 60 * 1000;  // 30 minutos após a hora agendada

async function checkPendingVisits() {
  const threshold = new Date(Date.now() - OVERDUE_MS);

  const pending = await db
    .select({
      id: appointments.id,
      userId: appointments.userId,
      clientName: clients.name,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .where(
      and(
        eq(appointments.isCompleted, false),
        lt(appointments.date, threshold),
        isNull(appointments.pushNotifiedAt)
      )
    );

  if (pending.length === 0) return;

  log(`visitChecker: ${pending.length} visita(s) pendente(s) para notificar`, "visitChecker");

  for (const appt of pending) {
    const result = await sendPushToUser(appt.userId, {
      title: "ServNtrak",
      body: `Tinhas visita agendada ao ${appt.clientName} — ficou concluída?`,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `visit-check-${appt.id}`,
      appointmentId: appt.id,
      actions: [
        { action: "sim", title: "Sim" },
        { action: "nao", title: "Não" },
      ],
    });

    // Marcar como notificada independentemente do resultado do envio
    // (pode não ter dispositivos subscritos, mas não queremos repetir)
    await db
      .update(appointments)
      .set({ pushNotifiedAt: new Date() })
      .where(eq(appointments.id, appt.id));

    log(
      `visitChecker: appointment ${appt.id} (${appt.clientName}) — enviado a ${result.sent}, falhado a ${result.failed}`,
      "visitChecker"
    );
  }
}

export function startVisitChecker() {
  // Primeira verificação após 1 minuto (aguardar o servidor estabilizar)
  setTimeout(() => {
    checkPendingVisits().catch((err) =>
      console.error("[visitChecker] erro na verificação inicial:", err)
    );
  }, 60 * 1000);

  setInterval(() => {
    checkPendingVisits().catch((err) =>
      console.error("[visitChecker] erro na verificação periódica:", err)
    );
  }, INTERVAL_MS);

  log("visitChecker: iniciado (intervalo: 15 min, threshold: 30 min)", "visitChecker");
}
