import { ObjectStorageService } from "../replit_integrations/object_storage/objectStorage";
import { S3StorageService, isS3Configured } from "./s3Storage";
import { LocalStorageService, isLocalStorageConfigured } from "./localStorage";

export type StorageInstance = ObjectStorageService | S3StorageService | LocalStorageService;

let _instance: StorageInstance | null = null;

export function getStorageService(): StorageInstance {
  if (!_instance) {
    if (isS3Configured()) {
      _instance = new S3StorageService();
    } else if (isLocalStorageConfigured()) {
      _instance = new LocalStorageService();
    } else {
      _instance = new ObjectStorageService();
    }
  }
  return _instance;
}

export function resetStorageService(): void {
  _instance = null;
}
