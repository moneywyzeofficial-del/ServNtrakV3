import { useDetailedWeather, getWeatherInfo, getWindClassLabel } from "@/hooks/use-weather";
import { BottomNav } from "@/components/BottomNav";
import { format, isToday, isTomorrow } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  Snowflake,
  Wind,
  Droplets,
  AlertTriangle,
  Moon,
  CloudMoon,
  Thermometer,
  Loader2,
  MapPin,
  ArrowDown,
  ArrowUp,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

const iconMap: Record<string, typeof Sun> = {
  sun: Sun,
  cloud: Cloud,
  "cloud-sun": CloudSun,
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-lightning": CloudLightning,
  "cloud-fog": CloudFog,
  snowflake: Snowflake,
};

const nightIconMap: Record<string, typeof Moon> = {
  sun: Moon,
  "cloud-sun": CloudMoon,
  cloud: Cloud,
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-lightning": CloudLightning,
  "cloud-fog": CloudFog,
  snowflake: Snowflake,
};

function getDayName(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "EEEE", { locale: pt });
}

export default function Weather() {
  const { data: weather, isLoading, error } = useDetailedWeather();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <BottomNav />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Meteorologia</h1>
          <p className="text-muted-foreground mt-4">Erro ao carregar dados meteorológicos</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.weatherCode);
  const CurrentIcon = weather.isDay
    ? iconMap[weatherInfo.icon] || Cloud
    : nightIconMap[weatherInfo.icon] || Moon;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Meteorologia"
        subtitle="Previsão e condições atuais"
        backHref="/more"
      />

      <div className="px-6 mt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Lourinhã</span>
          <span className="text-xs text-muted-foreground/50 ml-auto">Fonte: IPMA</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold text-foreground">{weather.temperature}°</span>
              <span className="text-xl text-muted-foreground mb-2">C</span>
            </div>
            <p className="text-lg text-foreground/90 mt-1 capitalize">{weatherInfo.description}</p>
          </div>

          <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center">
            <CurrentIcon className="w-16 h-16 text-primary" />
          </div>
        </div>

        <div className="flex gap-6 mt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wind className="w-5 h-5" />
            <span className="text-sm">{Math.round(weather.windSpeed)} km/h</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="w-5 h-5" />
            <span className="text-sm">{weather.humidity}%</span>
          </div>
          {weather.precipitation > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CloudRain className="w-5 h-5" />
              <span className="text-sm">{weather.precipitation} mm</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 mt-6 space-y-6">
        {weather.alerts.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Avisos IPMA</h2>
            <div className="space-y-2">
              {weather.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                    alert.severity === "danger"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-destructive/10 text-destructive"
                  )}
                  data-testid={`weather-alert-${alert.type}`}
                >
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {weather.todayForecast && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Condições de Hoje</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <ArrowDown className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mínima</p>
                  <p className="text-lg font-bold">{weather.todayForecast.temperatureMin}°C</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Máxima</p>
                  <p className="text-lg font-bold">{weather.todayForecast.temperatureMax}°C</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-400/10 rounded-lg flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Prob. Chuva</p>
                  <p className="text-lg font-bold">{weather.todayForecast.precipitationProbability}%</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center">
                  <Compass className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vento</p>
                  <p className="text-lg font-bold">{getWindClassLabel(weather.todayForecast.windClass)}</p>
                  <p className="text-xs text-muted-foreground">{weather.todayForecast.windDirection}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Próximos Dias</h2>
          <div className="space-y-2">
            {weather.daily.map((day, index) => {
              const DayIcon = iconMap[getWeatherInfo(day.weatherCode).icon] || Cloud;
              const dayName = getDayName(day.date);
              const dayInfo = getWeatherInfo(day.weatherCode);

              return (
                <div
                  key={day.date}
                  className={cn(
                    "flex items-center gap-4 rounded-xl px-4 py-3 bg-card border border-border",
                    index === 0 && "bg-primary/5 border-primary/20"
                  )}
                  data-testid={`daily-forecast-${index}`}
                >
                  <div className="w-20">
                    <span className={cn("text-sm font-medium capitalize", index === 0 ? "text-primary" : "text-foreground")}>
                      {dayName}
                    </span>
                  </div>

                  <DayIcon className="w-6 h-6 text-muted-foreground shrink-0" />

                  <div className="flex-1 flex items-center justify-end gap-4">
                    {day.precipitationProbability > 20 && (
                      <div className="flex items-center gap-1 text-xs text-blue-500">
                        <Droplets className="w-3 h-3" />
                        {day.precipitationProbability}%
                      </div>
                    )}

                    {day.windClass >= 3 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Wind className="w-3 h-3" />
                        {getWindClassLabel(day.windClass)}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{day.temperatureMin}°</span>
                      <div className="w-12 h-1.5 bg-gradient-to-r from-blue-400 to-primary rounded-full" />
                      <span className="font-medium text-foreground">{day.temperatureMax}°</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
