import fs from "fs";
import path from "path";
import { Response } from "express";
import { randomUUID } from "crypto";
import { ObjectNotFoundError } from "../replit_integrations/object_storage/objectStorage";
import { sanitizeServedContentType, buildSafeFilename } from "../replit_integrations/object_storage/objectStorage";

const PORTUGUESE_MONTH_ABBRS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function getMonthYearFolder(): string {
  const now = new Date();
  return `${PORTUGUESE_MONTH_ABBRS[now.getMonth()]}${now.getFullYear()}`;
}

export class LocalStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  getPrivateObjectDir(): string { return "objects"; }

  async isStorageAvailable(): Promise<boolean> {
    try {
      fs.accessSync(this.baseDir, fs.constants.W_OK);
      return true;
    } catch { return false; }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const key = `uploads/${getMonthYearFolder()}/${randomUUID()}`;
    return `/api/uploads/put-local?key=${encodeURIComponent(key)}`;
  }

  async getCustomObjectUploadURL(objectKey: string): Promise<string> {
    return `/api/uploads/put-local?key=${encodeURIComponent(objectKey)}`;
  }

  normalizeObjectEntityPath(rawUrl: string): string {
    if (rawUrl.startsWith("/api/uploads/put-local?key=")) {
      try {
        const params = new URLSearchParams(rawUrl.split("?")[1]);
        return `/objects/${params.get("key") || ""}`;
      } catch { return rawUrl; }
    }
    return rawUrl;
  }

  async getObjectEntityFile(objectPath: string) {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const key = objectPath.slice("/objects/".length);
    const filePath = path.join(this.baseDir, key);
    try {
      const stat = fs.statSync(filePath);
      const ext = path.extname(key).toLowerCase();
      const mimeMap: Record<string, string> = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif",
        ".pdf": "application/pdf", ".heic": "image/heic",
      };
      return { filePath, contentType: mimeMap[ext] || "application/octet-stream", contentLength: stat.size, key };
    } catch { throw new ObjectNotFoundError(); }
  }

  async downloadObject(file: { filePath: string; contentType?: string; contentLength?: number; key: string }, res: Response) {
    try {
      const rawType = (file.contentType || "application/octet-stream").split(";")[0].trim();
      const { contentType, disposition } = sanitizeServedContentType(rawType);
      const safeFilename = buildSafeFilename(file.key.split("/").pop() || "file");

      res.set({
        "Content-Type": contentType,
        "Content-Length": file.contentLength?.toString() || "",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `${disposition}; filename="${safeFilename}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox; frame-ancestors 'none'",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
      });

      const stream = fs.createReadStream(file.filePath);
      stream.on("error", () => { if (!res.headersSent) res.status(500).end(); });
      stream.pipe(res);
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ error: "Erro ao servir ficheiro" });
    }
  }

  async saveFile(key: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.baseDir, key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buffer);
  }

  async deleteObjectEntity(objectPath: string): Promise<boolean> {
    try {
      const key = objectPath.startsWith("/objects/") ? objectPath.slice("/objects/".length) : objectPath;
      const filePath = path.join(this.baseDir, key);
      if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); return true; }
      return false;
    } catch { return false; }
  }
}

export function isLocalStorageConfigured(): boolean {
  return !!process.env.STORAGE_DIR && !process.env.S3_ENDPOINT;
}
