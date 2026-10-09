import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUpload } from "@/hooks/use-upload";
import { usePoolEquipment, useCreatePoolEquipment, useUpdatePoolEquipment, useDeletePoolEquipment, usePoolPhotos, useCreatePoolPhoto, useDeletePoolPhoto } from "@/hooks/use-pool";
import { Plus, Trash2, Edit2, Loader2, Camera, Fence, Droplets, Thermometer, TestTube, Fan, Sun, ChevronDown, ChevronUp, Image, FileQuestion } from "lucide-react";
import type { Client, PoolEquipment as PoolEquipmentType, InsertPoolEquipment } from "@shared/schema";

const EQUIPMENT_TYPES = [
  { value: "pump", label: "Bomba" },
  { value: "filter", label: "Filtro" },
  { value: "heater", label: "Aquecimento" },
  { value: "chlorinator", label: "Clorador" },
  { value: "ph_controller", label: "Controlador pH" },
  { value: "skimmer", label: "Skimmer" },
  { value: "cover", label: "Capa" },
  { value: "liner", label: "Liner" },
  { value: "light", label: "Iluminação" },
  { value: "other", label: "Outro" },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pump: <Fan className="w-5 h-5" />,
  filter: <Fence className="w-5 h-5" />,
  heater: <Thermometer className="w-5 h-5" />,
  chlorinator: <Droplets className="w-5 h-5" />,
  ph_controller: <TestTube className="w-5 h-5" />,
  skimmer: <Fence className="w-5 h-5" />,
  cover: <Sun className="w-5 h-5" />,
  other: <FileQuestion className="w-5 h-5" />,
};

interface ClientPoolTabProps {
  client: Client;
}

export function ClientPoolTab({ client }: ClientPoolTabProps) {
  if (!client.hasPool) return null;

  const hasDims = client.poolLength != null && client.poolWidth != null;
  const hasDepth = client.poolMinDepth != null && client.poolMaxDepth != null;
  const volume = hasDims && hasDepth
    ? (client.poolLength! * client.poolWidth! * ((client.poolMinDepth! + client.poolMaxDepth!) / 2)).toFixed(0)
    : null;

  const freqLabels: Record<string, string> = {
    seasonal: "Sazonal (2-4x/mês)",
    once_monthly: "1x por mês",
    on_demand: "Sob pedido",
  };

  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<PoolEquipmentType | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<PoolEquipmentType | null>(null);
  const [expandedEquipment, setExpandedEquipment] = useState<number | null>(null);

  const {
    data: equipment,
    isLoading: equipmentLoading,
  } = usePoolEquipment(client.id);

  return (
    <div className="space-y-6">
      <PoolInfoCard client={client} volume={volume} freqLabel={freqLabels[client.poolVisitFrequency || "seasonal"]} />

      <PoolPhotosSection clientId={client.id} equipmentId={undefined} title="Fotos da Piscina" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Equipamentos</h3>
          <Dialog open={equipmentDialogOpen && !editingEquipment} onOpenChange={(open) => { if (!open) { setEquipmentDialogOpen(false); } }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditingEquipment(null); setEquipmentDialogOpen(true); }} data-testid="button-add-equipment">
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Equipamento</DialogTitle>
              </DialogHeader>
              <EquipmentForm clientId={client.id} onClose={() => setEquipmentDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {equipmentLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : equipment && equipment.length > 0 ? (
          <div className="space-y-3">
            {equipment.map((item) => (
              <div key={item.id} className="mobile-card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {TYPE_ICONS[item.type] || <FileQuestion className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground truncate">{item.name}</h4>
                      <span className="badge-pill bg-primary/10 text-primary text-[10px]">
                        {EQUIPMENT_TYPES.find(t => t.value === item.type)?.label || "Outro"}
                      </span>
                    </div>
                    {item.brand && (
                      <p className="text-sm text-muted-foreground mt-0.5">{item.brand}{item.model ? ` - ${item.model}` : ""}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost" size="icon" className="shrink-0"
                    onClick={() => setExpandedEquipment(expandedEquipment === item.id ? null : item.id)}
                  >
                    {expandedEquipment === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {expandedEquipment === item.id && (
                  <div className="mt-3 pt-3 border-t border-border/30 space-y-4">
                    {item.serialNumber && (
                      <div className="text-sm"><span className="text-muted-foreground">Nº série:</span> {item.serialNumber}</div>
                    )}
                    {item.notes && (
                      <div className="text-sm"><span className="text-muted-foreground">Notas:</span> {item.notes}</div>
                    )}
                    {item.installedDate && (
                      <div className="text-sm"><span className="text-muted-foreground">Instalado em:</span> {new Date(item.installedDate).toLocaleDateString("pt-PT")}</div>
                    )}

                    <EquipmentPhotosSection clientId={client.id} equipmentId={item.id} />

                    <div className="flex gap-2 pt-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingEquipment(item)}>
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Editar Equipamento</DialogTitle>
                          </DialogHeader>
                          <EquipmentForm clientId={client.id} equipment={item} onClose={() => setEditingEquipment(null)} />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="flex-1" onClick={() => setEquipmentToDelete(item)}>
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Equipamento</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem a certeza que quer eliminar {item.name}? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setEquipmentToDelete(null)}>Cancelar</AlertDialogCancel>
                            <DeleteEquipmentButton equipment={item} clientId={client.id} onDone={() => setEquipmentToDelete(null)} />
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state bg-card rounded-2xl border border-border/30 py-8">
            <div className="empty-state-icon bg-primary/5">
              <Fence className="w-7 h-7 text-primary/60" />
            </div>
            <h3 className="font-semibold text-foreground">Sem equipamentos</h3>
            <p className="text-sm text-muted-foreground mt-1">Adicione bombas, filtros e outros equipamentos</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PoolInfoCard({ client, volume, freqLabel }: { client: Client; volume: string | null; freqLabel: string }) {
  const hasDims = client.poolLength != null && client.poolWidth != null;
  const hasDepth = client.poolMinDepth != null && client.poolMaxDepth != null;

  return (
    <div className="bg-card rounded-xl border border-border/40 shadow-sm shadow-black/5 p-4">
      <h3 className="font-bold text-foreground mb-4">Informação da Piscina</h3>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm mb-4">
        <div>
          <span className="text-muted-foreground">Dimensões:</span>
          <p className="font-semibold text-base">
            {hasDims ? `${client.poolLength} × ${client.poolWidth}m` : "—"}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Profundidade:</span>
          <p className="font-semibold text-base">
            {hasDepth ? `${client.poolMinDepth}–${client.poolMaxDepth}m` : "—"}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Frequência:</span>
          <p className="font-semibold text-base">{freqLabel}</p>
        </div>
      </div>

      <div className="bg-primary/5 rounded-xl border border-primary/10 p-4 text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Volume Total</span>
        <p className="text-3xl font-extrabold text-primary mt-1">
          {volume != null ? `${volume} m³` : "—"}
        </p>
      </div>
    </div>
  );
}

function PoolPhotosSection({ clientId, equipmentId, title }: { clientId: number; equipmentId: number | undefined; title: string }) {
  const { data: photos, isLoading } = usePoolPhotos(clientId, equipmentId);
  const createPhoto = useCreatePoolPhoto();
  const deletePhoto = useDeletePoolPhoto();
  const { uploadFile, isUploading } = useUpload();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file);
    if (result) {
      await createPhoto.mutateAsync({
        clientId,
        equipmentId: equipmentId ?? null,
        photoUrl: result.objectPath,
        caption: null,
      } as any);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{title}</h3>
        <label className="cursor-pointer">
          <Button size="sm" disabled={isUploading} asChild variant="outline">
            <span>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Camera className="w-4 h-4 mr-1" />}
              {isUploading ? "A enviar..." : "Adicionar Foto"}
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} />
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : photos && photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square">
              <img src={photo.photoUrl} alt={photo.caption || "Foto"} className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20"
                  onClick={async () => {
                    await deletePhoto.mutateAsync({ id: photo.id, clientId });
                  }}
                  disabled={deletePhoto.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border/40">
          <Image className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma foto adicionada</p>
        </div>
      )}
    </div>
  );
}

function EquipmentPhotosSection({ clientId, equipmentId }: { clientId: number; equipmentId: number }) {
  return <PoolPhotosSection clientId={clientId} equipmentId={equipmentId} title="Fotos do Equipamento" />;
}

function EquipmentForm({ clientId, equipment, onClose }: { clientId: number; equipment?: PoolEquipmentType | null; onClose: () => void }) {
  const createEquipment = useCreatePoolEquipment();
  const updateEquipment = useUpdatePoolEquipment();
  const isPending = createEquipment.isPending || updateEquipment.isPending;

  const [name, setName] = useState(equipment?.name || "");
  const [type, setType] = useState(equipment?.type || "other");
  const [brand, setBrand] = useState(equipment?.brand || "");
  const [model, setModel] = useState(equipment?.model || "");
  const [serialNumber, setSerialNumber] = useState(equipment?.serialNumber || "");
  const [notes, setNotes] = useState(equipment?.notes || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: Partial<InsertPoolEquipment> = {
      name: name.trim(),
      type,
      brand: brand.trim() || null,
      model: model.trim() || null,
      serialNumber: serialNumber.trim() || null,
      notes: notes.trim() || null,
    };

    if (equipment) {
      await updateEquipment.mutateAsync({ id: equipment.id, data, clientId });
    } else {
      await createEquipment.mutateAsync({ clientId, ...data } as any);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="equipment-name">Nome *</Label>
        <Input id="equipment-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bomba Principal" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="equipment-type">Tipo *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="equipment-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EQUIPMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="equipment-brand">Marca</Label>
          <Input id="equipment-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marca" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment-model">Modelo</Label>
          <Input id="equipment-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Modelo" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="equipment-serial">Nº de Série</Label>
        <Input id="equipment-serial" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Nº de série" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="equipment-notes">Notas</Label>
        <Textarea id="equipment-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." rows={2} />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {equipment ? "Guardar Alterações" : "Adicionar Equipamento"}
      </Button>
    </form>
  );
}

function DeleteEquipmentButton({ equipment, clientId, onDone }: { equipment: PoolEquipmentType; clientId: number; onDone: () => void }) {
  const deleteEquipment = useDeletePoolEquipment();

  return (
    <Button
      variant="destructive"
      onClick={async () => {
        await deleteEquipment.mutateAsync({ id: equipment.id, clientId });
        onDone();
      }}
      disabled={deleteEquipment.isPending}
    >
      {deleteEquipment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      Eliminar
    </Button>
  );
}
