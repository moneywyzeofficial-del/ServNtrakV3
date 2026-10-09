import L from "leaflet";

export const tileLayers = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a>',
  },
};

export function createDropPin(color: string, text?: string): L.DivIcon {
  return new L.DivIcon({
    className: "custom-marker",
    html: `<div style="
      background-color:${color};
      width:34px;height:34px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    "><div style="
      transform:rotate(45deg);
      color:white;
      font-size:${text ? "12px" : "14px"};
      font-weight:700;
      line-height:1;
      font-family:system-ui,-apple-system,sans-serif;
    ">${text ?? ""}</div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
}

export function createDropPinSmall(color: string, text?: string): L.DivIcon {
  return new L.DivIcon({
    className: "custom-marker",
    html: `<div style="
      background-color:${color};
      width:28px;height:28px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    "><div style="
      transform:rotate(45deg);
      color:white;
      font-size:${text ? "10px" : "12px"};
      font-weight:700;
      line-height:1;
      font-family:system-ui,-apple-system,sans-serif;
    ">${text ?? ""}</div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

// ---- pre-built zone colors ----

export const pinGreen = (text?: string) => createDropPin("hsl(145,55%,32%)", text);
export const pinBlue = (text?: string) => createDropPin("hsl(195,70%,45%)", text);
export const pinCyan = (text?: string) => createDropPin("hsl(185,60%,38%)", text);
export const pinGrey = (text?: string) => createDropPin("hsl(220,12%,40%)", text);
export const pinGold = (text?: string) => createDropPin("hsl(42,85%,48%)", text);

export function zonePin(type: string, text?: string): L.DivIcon {
  if (type === "Garden") return pinGreen(text);
  if (type === "Pool") return pinBlue(text);
  if (type === "Jacuzzi") return pinCyan(text);
  return pinGrey(text);
}
