import { useState, useRef, useCallback } from "react";
import { useUpload } from "@/hooks/use-upload";
import { useUpdateClient } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";

type PhotoType = "house" | "profile";

export async function processImage(file: File, maxWidth: number, square: boolean): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const targetSize = square ? Math.min(maxWidth, width, height) : maxWidth;

      if (square) {
        const size = Math.min(targetSize, width, height);
        width = size;
        height = size;
      } else if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      if (square) {
        const sx = (img.width - Math.min(img.width, img.height)) / 2;
        const sy = (img.height - Math.min(img.width, img.height)) / 2;
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, sx, sy, s, s, 0, 0, width, height);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], `${square ? "profile" : "house"}.webp`, { type: "image/webp" }));
          } else {
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) resolve(new File([jpegBlob], `${square ? "profile" : "house"}.jpg`, { type: "image/jpeg" }));
                else reject(new Error("Falha ao processar imagem"));
              },
              "image/jpeg",
              0.7,
            );
          }
        },
        "image/webp",
        0.7,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar imagem"));
    };
    img.src = url;
  });
}

export function useClientPhotoUpload(clientId: number, type: PhotoType) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload();
  const updateClient = useUpdateClient();
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      try {
        const maxWidth = type === "profile" ? 400 : 1200;
        const processed = await processImage(file, maxWidth, type === "profile");
        const objectKey = `clients/${clientId}/${type === "profile" ? "profile" : "house"}.webp`;
        const result = await uploadFile(processed, objectKey);
        if (!result) throw new Error("Upload falhou — servidor não devolveu objectPath");

        const field = type === "profile" ? "profilePhotoUrl" : "housePhotoUrl";
        await updateClient.mutateAsync({ id: clientId, [field]: result.objectPath } as any);

        toast({
          title: type === "profile" ? "Foto de perfil atualizada" : "Foto da propriedade atualizada",
          description: "A imagem foi guardada com sucesso.",
        });
      } catch (err) {
        console.error("Photo upload error:", err);
        const msg = err instanceof Error ? err.message : "Erro desconhecido";
        toast({
          title: "Erro ao guardar",
          description: msg,
          variant: "destructive",
        });
      } finally {
        URL.revokeObjectURL(localUrl);
        setPreviewUrl(null);
      }
    },
    [clientId, type, uploadFile, updateClient, toast],
  );

  const trigger = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  return { inputRef, trigger, onFileChange, handleFile, isUploading, previewUrl };
}
