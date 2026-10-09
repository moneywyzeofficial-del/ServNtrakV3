import type { Client } from "./schema";

// === BUSINESS HOURS CONFIGURATION ===
export const BUSINESS_HOURS = {
  // Normal working hours (Monday-Friday)
  normalStart: 8, // 8:00
  normalEnd: 17,  // 17:00
  
  // Lunch break
  lunchStart: 13, // 13:00
  lunchEnd: 14,   // 14:00
  
  // Extended hours (requires confirmation)
  extendedEnd: 19, // Up to 19:00 on longer days
  
  // Saturday hours (requires confirmation)
  saturdayStart: 8,  // 8:00
  saturdayEnd: 13,   // 13:00
  
  // Working days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  workDays: [1, 2, 3, 4, 5] as number[], // Monday to Friday
};

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function isWorkDay(date: Date): boolean {
  return BUSINESS_HOURS.workDays.includes(date.getDay());
}

export function isWithinBusinessHours(date: Date): boolean {
  const hour = date.getHours();
  const isLunchTime = hour >= BUSINESS_HOURS.lunchStart && hour < BUSINESS_HOURS.lunchEnd;
  const isWorkHour = hour >= BUSINESS_HOURS.normalStart && hour < BUSINESS_HOURS.normalEnd;
  return isWorkDay(date) && isWorkHour && !isLunchTime;
}

export function requiresConfirmation(date: Date): { required: boolean; reason?: string } {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  
  // Saturday work requires confirmation
  if (dayOfWeek === 6) {
    return { required: true, reason: "Trabalho ao Sábado" };
  }
  
  // Extended hours (after 17:00) require confirmation
  if (hour >= BUSINESS_HOURS.normalEnd && hour < BUSINESS_HOURS.extendedEnd) {
    return { required: true, reason: "Horário prolongado" };
  }
  
  return { required: false };
}

export function getNextWorkDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (!isWorkDay(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export type Season = "high" | "low";

export function getSeason(date: Date): Season {
  const month = date.getMonth() + 1; // 1-12
  // High season: April (4) to September (9)
  // Low season: October (10) to March (3)
  if (month >= 4 && month <= 9) {
    return "high";
  }
  return "low";
}

export function getSeasonLabel(season: Season): string {
  return season === "high" ? "Época Alta" : "Época Baixa";
}

export function getSeasonDateRange(season: Season, year: number): { start: Date; end: Date } {
  if (season === "high") {
    return {
      start: new Date(year, 3, 1), // April 1st
      end: new Date(year, 8, 30), // September 30th
    };
  }
  // Low season spans two years
  return {
    start: new Date(year, 9, 1), // October 1st
    end: new Date(year + 1, 2, 31), // March 31st next year
  };
}

export interface VisitSchedule {
  type: "Garden" | "Pool" | "Jacuzzi";
  visitsPerMonth: number;
  description: string;
  isOnDemand?: boolean;
}

export function getGardenVisitsPerMonth(client: Client, season: Season): number {
  if (!client.hasGarden) return 0;
  
  // On demand - no scheduled visits
  if (client.gardenVisitFrequency === "on_demand") {
    return 0;
  }
  
  // If client has special "once monthly" agreement
  if (client.gardenVisitFrequency === "once_monthly") {
    return 1;
  }
  
  // Standard seasonal schedule
  return season === "high" ? 2 : 1;
}

export function getPoolVisitsPerMonth(client: Client, season: Season): number {
  if (!client.hasPool) return 0;
  
  // On demand - no scheduled visits
  if (client.poolVisitFrequency === "on_demand") {
    return 0;
  }
  
  // Once monthly agreement
  if (client.poolVisitFrequency === "once_monthly") {
    return 1;
  }
  
  // High season: 1x per week = 4 per month
  // Low season: 2x per month
  return season === "high" ? 4 : 2;
}

export function getJacuzziVisitsPerMonth(client: Client, season: Season): number {
  if (!client.hasJacuzzi) return 0;
  
  // On demand - no scheduled visits
  if (client.jacuzziVisitFrequency === "on_demand") {
    return 0;
  }
  
  // Once monthly agreement
  if (client.jacuzziVisitFrequency === "once_monthly") {
    return 1;
  }
  
  // Same as pool: High season: 1x per week = 4 per month, Low season: 2x per month
  return season === "high" ? 4 : 2;
}

export function getClientVisitSchedule(client: Client, date: Date = new Date()): VisitSchedule[] {
  const season = getSeason(date);
  const schedules: VisitSchedule[] = [];
  
  if (client.hasGarden) {
    const isOnDemand = client.gardenVisitFrequency === "on_demand";
    const isSpecial = client.gardenVisitFrequency === "once_monthly";
    const visits = getGardenVisitsPerMonth(client, season);
    
    let description: string;
    if (isOnDemand) {
      description = "Quando necessário";
    } else if (isSpecial) {
      description = "1 visita/mês (acordo especial)";
    } else {
      description = season === "high" 
        ? "2 visitas/mês (época alta)"
        : "1 visita/mês (época baixa)";
    }
    
    schedules.push({
      type: "Garden",
      visitsPerMonth: visits,
      description,
      isOnDemand,
    });
  }
  
  if (client.hasPool) {
    const isOnDemand = client.poolVisitFrequency === "on_demand";
    const isSpecial = client.poolVisitFrequency === "once_monthly";
    const visits = getPoolVisitsPerMonth(client, season);
    
    let description: string;
    if (isOnDemand) {
      description = "Quando necessário";
    } else if (isSpecial) {
      description = "1 visita/mês (acordo especial)";
    } else {
      description = season === "high" 
        ? "1 visita/semana (época alta)"
        : "2 visitas/mês (época baixa)";
    }
    
    schedules.push({
      type: "Pool",
      visitsPerMonth: visits,
      description,
      isOnDemand,
    });
  }
  
  if (client.hasJacuzzi) {
    const isOnDemand = client.jacuzziVisitFrequency === "on_demand";
    const isSpecial = client.jacuzziVisitFrequency === "once_monthly";
    const visits = getJacuzziVisitsPerMonth(client, season);
    
    let description: string;
    if (isOnDemand) {
      description = "Quando necessário";
    } else if (isSpecial) {
      description = "1 visita/mês (acordo especial)";
    } else {
      description = season === "high" 
        ? "1 visita/semana (época alta)"
        : "2 visitas/mês (época baixa)";
    }
    
    schedules.push({
      type: "Jacuzzi",
      visitsPerMonth: visits,
      description,
      isOnDemand,
    });
  }
  
  return schedules;
}

export function getTotalMonthlyVisits(client: Client, date: Date = new Date()): number {
  const schedules = getClientVisitSchedule(client, date);
  return schedules.reduce((total, schedule) => total + schedule.visitsPerMonth, 0);
}

function adjustToWorkDay(date: Date): Date {
  const adjusted = new Date(date);
  // If it's a weekend, move to Monday
  while (!isWorkDay(adjusted)) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
}

export function generateSuggestedDates(
  year: number,
  month: number, // 1-12
  visitsPerMonth: number,
  serviceType: "Garden" | "Pool" | "Jacuzzi"
): Date[] {
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  if (visitsPerMonth <= 0) return dates;
  
  // Target days in the month, then adjust to work days
  let targetDays: number[] = [];
  
  if (visitsPerMonth === 1) {
    // Middle of the month
    targetDays = [15];
  } else if (visitsPerMonth === 2) {
    // Every 2 weeks: around 7th and 21st
    targetDays = [7, 21];
  } else if (visitsPerMonth === 4) {
    // Weekly: around 1st, 8th, 15th, 22nd
    targetDays = [1, 8, 15, 22];
  } else {
    // Distribute evenly
    const interval = Math.floor(daysInMonth / visitsPerMonth);
    for (let i = 0; i < visitsPerMonth; i++) {
      targetDays.push(Math.min(1 + i * interval, daysInMonth));
    }
  }
  
  // Convert to dates and adjust to work days
  for (const day of targetDays) {
    const targetDate = new Date(year, month - 1, day, BUSINESS_HOURS.normalStart, 0, 0);
    const adjustedDate = adjustToWorkDay(targetDate);
    // Ensure we don't go past the month
    if (adjustedDate.getMonth() === month - 1) {
      dates.push(adjustedDate);
    }
  }
  
  return dates;
}

export interface SuggestedAppointment {
  clientId: number;
  clientName: string;
  date: Date;
  type: "Garden" | "Pool" | "Jacuzzi";
}

export function generateMonthlyAppointments(
  clients: Client[],
  year: number,
  month: number
): SuggestedAppointment[] {
  const appointments: SuggestedAppointment[] = [];
  const referenceDate = new Date(year, month - 1, 15);
  
  for (const client of clients) {
    const schedules = getClientVisitSchedule(client, referenceDate);
    
    for (const schedule of schedules) {
      const dates = generateSuggestedDates(year, month, schedule.visitsPerMonth, schedule.type);
      
      for (const date of dates) {
        appointments.push({
          clientId: client.id,
          clientName: client.name,
          date,
          type: schedule.type,
        });
      }
    }
  }
  
  // Sort by date
  appointments.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  return appointments;
}
