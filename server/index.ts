import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seedProductionData } from "./seed-production";
import { startVisitChecker } from "./visitChecker";
import { pool } from "./db";
import path from "path";
import fs from "fs";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { isS3Configured } from "./lib/s3Storage";
import { isLocalStorageConfigured } from "./lib/localStorage";
import { getStorageService } from "./lib/storageProvider";

const app = express();
const httpServer = createServer(app);

// Raw body handler for direct file uploads (used by local storage)
app.use("/api/uploads/put-local", express.raw({ type: "*/*", limit: "25mb" }));
app.put("/api/uploads/put-local", async (req, res) => {
  try {
    const key = typeof req.query.key === "string" ? decodeURIComponent(req.query.key) : null;
    if (!key) return res.status(400).json({ error: "Missing key" });
    if (!req.body || !Buffer.isBuffer(req.body)) return res.status(400).json({ error: "Missing file body" });

    const dir = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");
    const filePath = path.join(dir, key);

    // Prevent directory traversal
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(dir))) {
      return res.status(403).json({ error: "Invalid path" });
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, req.body);
    console.log("[local-upload] file saved", { key, size: req.body.length });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[local-upload] error:", err);
    res.status(500).json({ error: "Failed to save file" });
  }
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '5mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  // Logging middleware: only emits request metadata. We deliberately do NOT
  // capture or stringify the response body to avoid leaking customer data,
  // OCR results, presigned upload URLs and other sensitive payloads into
  // application logs (Task #29).
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const duration = Date.now() - start;
    log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
  });

  next();
});

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expense_note_edits (
      id SERIAL PRIMARY KEY,
      expense_note_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      edited_at TIMESTAMP DEFAULT NOW(),
      field_changed TEXT NOT NULL,
      reason TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      quote_number TEXT NOT NULL UNIQUE,
      client_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      valid_until TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quote_items (
      id SERIAL PRIMARY KEY,
      quote_id INTEGER NOT NULL REFERENCES quotes(id),
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'service',
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
      unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE purchases
    ADD COLUMN IF NOT EXISTS invoice_number TEXT
  `);

  await pool.query(`
    ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS service_type TEXT
  `);

  await pool.query(`
    ALTER TABLE service_logs
    ADD COLUMN IF NOT EXISTS is_included_in_monthly BOOLEAN DEFAULT TRUE
  `);

  await pool.query(`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS locality TEXT
  `);

  await pool.query(`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS house_photo_url TEXT
  `);

  await pool.query(`
    ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_equipment (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      type TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      install_date TIMESTAMP,
      last_maintenance_date TIMESTAMP,
      notes TEXT,
      photo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS client_documents (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_key TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/pdf',
      document_type TEXT NOT NULL DEFAULT 'other',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE reminders ALTER COLUMN client_id DROP NOT NULL
  `);

  await pool.query(`
    ALTER TABLE reminders ALTER COLUMN frequency DROP NOT NULL
  `);

  await pool.query(`
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS description text
  `);

  await pool.query(`
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS category text DEFAULT 'Geral'
  `);

  await pool.query(`
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Normal'
  `);

  await pool.query(`
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false
  `);

  await pool.query(`
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS completed_at timestamp
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pool_equipment (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      notes TEXT,
      installed_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pool_photos (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL,
      equipment_id INTEGER,
      photo_url TEXT NOT NULL,
      caption TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_send_events (
      id SERIAL PRIMARY KEY,
      at TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL,
      kind TEXT,
      status_code INTEGER,
      endpoint_preview TEXT NOT NULL,
      message TEXT
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS push_send_events_at_idx
    ON push_send_events (at)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS push_send_events_status_at_idx
    ON push_send_events (status, at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS push_send_events_status_kind_at_idx
    ON push_send_events (status, kind, at DESC)
  `);

  // Trigger storage singleton initialization and health check
  getStorageService();
  if (isS3Configured()) {
    console.log("[storage] S3 storage configurado — uploads disponiveis.");
  } else if (isLocalStorageConfigured()) {
    console.log("[storage] Storage local configurado — uploads disponiveis.");
    console.log(`[storage] Diretoria: ${process.env.STORAGE_DIR}`);
  } else {
    const objectStorage = new ObjectStorageService();
    const storageReady = await objectStorage.isStorageAvailable();
    if (!storageReady) {
      console.warn("[storage] Object Storage nao configurado — uploads indisponiveis.");
      console.warn("[storage] Configura STORAGE_DIR=/data (volume Railway)");
      console.warn("[storage] ou S3_ENDPOINT, S3_BUCKET, keys (Cloudflare R2)");
    } else {
      console.log("[storage] Object Storage (Replit/GCS) disponivel.");
    }
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  // Seed initial data on startup (only adds if not exists)
  seedProductionData().catch(err => {
    console.error("Failed to seed initial data:", err);
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    startVisitChecker();
  });
})();
