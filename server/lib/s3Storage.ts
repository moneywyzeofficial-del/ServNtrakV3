import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { ObjectNotFoundError } from "../replit_integrations/object_storage/objectStorage";
import { sanitizeServedContentType, buildSafeFilename } from "../replit_integrations/object_storage/objectStorage";

const PORTUGUESE_MONTH_ABBRS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

function getMonthYearFolder(): string {
  const now = new Date();
  return `${PORTUGUESE_MONTH_ABBRS[now.getMonth()]}${now.getFullYear()}`;
}

function getBucket(): string {
  return process.env.S3_BUCKET || process.env.BUCKET || "";
}

export class S3StorageService {
  private s3: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.S3_ENDPOINT || "";
    this.bucket = getBucket();

    if (!this.endpoint || !this.bucket) {
      throw new Error("S3_ENDPOINT e S3_BUCKET (ou BUCKET) sao obrigatorios.");
    }

    console.log("[s3] Inicializando S3 client:", {
      bucket: this.bucket,
      endpoint: this.endpoint,
      region: process.env.S3_REGION || "auto",
      hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
    });

    this.s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    });
  }

  getPrivateObjectDir(): string { return this.bucket; }

  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const key = `uploads/${getMonthYearFolder()}/${objectId}`;
    return this.signPut(key);
  }

  async getCustomObjectUploadURL(objectKey: string): Promise<string> {
    return this.signPut(objectKey);
  }

  private async signPut(key: string): Promise<string> {
    try {
      const url = await getSignedUrl(this.s3, new PutObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: 900 });
      console.log("[s3] Presigned PUT URL gerada:", { key, urlPrefix: url.split("?")[0] });
      return url;
    } catch (err) {
      const e = err as Error;
      console.error("[s3] Erro ao gerar presigned URL:", {
        bucket: this.bucket,
        key,
        errorName: e.name,
        errorMessage: e.message,
      });
      throw new Error(`S3 presigned URL failed: ${e.message}`);
    }
  }

  normalizeObjectEntityPath(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      const key = url.pathname.replace(/^\//, "").replace(new RegExp(`^${this.bucket}/`), "");
      return `/objects/${key}`;
    } catch {
      return rawUrl;
    }
  }

  async getObjectEntityFile(objectPath: string) {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const key = objectPath.slice("/objects/".length);
    try {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const output = await this.s3.send(cmd);
      return { stream: output.Body, contentType: output.ContentType, contentLength: output.ContentLength, key };
    } catch (err) {
      const e = err as Error;
      if (e.name === "NoSuchKey") throw new ObjectNotFoundError();
      console.error("[s3] Erro ao obter objeto:", { key, error: e.message });
      throw new ObjectNotFoundError();
    }
  }

  async downloadObject(file: { stream: any; contentType?: string; contentLength?: number; key: string }, res: Response) {
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

      if (file.stream && typeof file.stream.pipe === "function") {
        file.stream.on("error", (err: Error) => { console.error("[s3] Stream error:", err.message); if (!res.headersSent) res.status(500).end(); });
        file.stream.pipe(res);
      } else if (file.stream) {
        const chunks: Buffer[] = [];
        for await (const chunk of file.stream as AsyncIterable<Buffer>) { chunks.push(chunk); }
        res.send(Buffer.concat(chunks));
      }
    } catch (err) {
      const e = err as Error;
      console.error("[s3] Erro download:", e.message);
      if (!res.headersSent) res.status(500).json({ error: "Erro ao servir ficheiro" });
    }
  }

  async deleteObjectEntity(objectPath: string): Promise<boolean> {
    try {
      const key = objectPath.startsWith("/objects/") ? objectPath.slice("/objects/".length) : objectPath;
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      console.log("[s3] Objeto eliminado:", { key });
      return true;
    } catch (err) {
      console.error("[s3] Erro ao eliminar:", (err as Error).message);
      return false;
    }
  }
}

export function isS3Configured(): boolean {
  const bucket = process.env.S3_BUCKET || process.env.BUCKET;
  return !!(process.env.S3_ENDPOINT && bucket && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}
