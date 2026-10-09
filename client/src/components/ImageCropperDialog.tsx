import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cropImage } from "@/lib/utils";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  aspect?: number;
  onCrop: (croppedFile: File) => void;
}

export function ImageCropperDialog({ open, onOpenChange, file, aspect = 1, onCrop }: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState(false);
  const imageUrlRef = useRef<string | null>(null);

  if (file && imageUrlRef.current) {
    URL.revokeObjectURL(imageUrlRef.current);
  }
  if (file) {
    imageUrlRef.current = URL.createObjectURL(file);
  }

  const imageUrl = file ? imageUrlRef.current : null;

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageUrl || !croppedAreaPixels || !file) return;
    setProcessing(true);
    try {
      const croppedFile = await cropImage(imageUrl, croppedAreaPixels, 0.7);
      onCrop(croppedFile);
      resetAndClose();
    } catch {
      // Error handled upstream
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    onOpenChange(false);
  };

  const resetAndClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-72 bg-black rounded-xl overflow-hidden">
          {imageUrl && (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={([v]) => setZoom(v)}
            className="flex-1"
          />
          <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button className="flex-1 rounded-xl btn-primary" onClick={handleConfirm} disabled={processing}>
            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
