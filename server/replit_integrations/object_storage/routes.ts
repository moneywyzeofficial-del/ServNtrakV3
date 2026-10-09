import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission, getObjectAclPolicy } from "./objectAcl";
import { storage } from "../../storage";
import { S3StorageService } from "../../lib/s3Storage";
import { LocalStorageService } from "../../lib/localStorage";

type StorageService = ObjectStorageService | S3StorageService | LocalStorageService;

const ALLOWED_UPLOAD_CONTENT_TYPES = new Set<string>([
  "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
  "image/avif", "image/bmp", "image/heic", "image/heif",
  "application/pdf", "text/plain", "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

const uploadRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES, {
    message: `O ficheiro excede o tamanho maximo permitido (${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} MB)`,
  }),
  contentType: z.string().trim().min(1).max(255)
    .transform((v) => v.toLowerCase().split(";")[0].trim())
    .refine((v) => ALLOWED_UPLOAD_CONTENT_TYPES.has(v), {
      message: "Tipo de ficheiro nao permitido. Aceitamos imagens, PDFs e documentos comuns.",
    }),
  objectKey: z.string().trim().min(1).max(500)
    .regex(/^[a-zA-Z0-9_\-/\.]+$/, "objectKey so pode conter letras, numeros, -, _, / e .")
    .optional(),
});

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if ((req as any).isAuthenticated && (req as any).isAuthenticated()) return next();
  res.status(401).json({ error: "Unauthorized" });
}

export function registerObjectStorageRoutes(app: Express, storageService: StorageService): void {
  app.post("/api/uploads/request-url", requireAuth, async (req, res) => {
    let objectKey: string | undefined;
    try {
      const available = storageService instanceof ObjectStorageService
        ? await (storageService as ObjectStorageService).isStorageAvailable()
        : true;
      if (!available) {
        return res.status(503).json({ error: "Armazenamento nao configurado. Configure o Object Storage para ativar uploads." });
      }

      const parsed = uploadRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid upload request" });
      }
      const { name, size, contentType } = parsed.data;
      objectKey = parsed.data.objectKey;

      if (objectKey) {
        const clientMatch = objectKey.match(/^clients\/(\d+)\/((house|profile)\.webp|documents\/.+\.pdf)$/);
        if (!clientMatch) {
          return res.status(400).json({ error: "Caminho de upload invalido. Use clients/{id}/house.webp, profile.webp ou documents/....pdf." });
        }
        const targetClientId = parseInt(clientMatch[1], 10);
        const userId = (req as any).user!.id;
        const clientExists = await storage.getClient(targetClientId);
        if (!clientExists) return res.status(404).json({ error: "Cliente nao encontrado." });
        const targetClient = await storage.getClientForUser(targetClientId, userId);
        if (!targetClient) return res.status(403).json({ error: "Nao tem permissao para alterar fotos deste cliente." });
      }

      const uploadURL = objectKey
        ? await storageService.getCustomObjectUploadURL(objectKey)
        : await storageService.getObjectEntityUploadURL();

      const objectPath = storageService.normalizeObjectEntityPath(uploadURL);

      console.log("[upload] presigned URL generated", { objectKey, objectPath: objectPath?.slice(0, 80) });

      res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[upload] presigned URL generation failed", {
        objectKey: objectKey || "(none)",
        errorName: err.name, errorMessage: err.message,
        errorStack: err.stack?.split("\n").slice(0, 4).join(" | "),
      });
      const msg = err.message.includes("PRIVATE_OBJECT_DIR") || err.message.includes("S3_")
        ? "Configuracao de storage em falta."
        : err.message.includes("Failed to sign")
          ? "Servico de storage indisponivel. Tente novamente."
          : "Erro interno ao gerar URL de upload.";
      res.status(500).json({ error: msg });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await storageService.getObjectEntityFile(req.path);

      let aclPolicy = null;
      if (storageService instanceof ObjectStorageService) {
        aclPolicy = await getObjectAclPolicy(objectFile as any);
      }

      const isPublic = aclPolicy?.visibility === "public";
      const isAuthed = !!((req as any).isAuthenticated && (req as any).isAuthenticated());
      const userId = isAuthed ? (req as any).user?.id : undefined;

      if (!isPublic) {
        if (!isAuthed) return res.status(401).json({ error: "Unauthorized" });
        if (aclPolicy) {
          const allowed = await (storageService as ObjectStorageService).canAccessObjectEntity({
            userId, objectFile: objectFile as any,
            requestedPermission: ObjectPermission.READ,
          });
          if (!allowed) return res.status(403).json({ error: "Forbidden" });
        }
      }

      await storageService.downloadObject(objectFile as any, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return res.status(404).json({ error: "Object not found" });
      console.error("Error serving object:", error);
      if (!res.headersSent) res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
