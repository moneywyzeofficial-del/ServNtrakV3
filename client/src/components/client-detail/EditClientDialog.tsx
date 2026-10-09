import { useState, useRef } from "react";
import { useUpdateClient } from "@/hooks/use-clients";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { processImage } from "@/hooks/use-client-photo-upload";
import { Pencil, Leaf, Waves, ThermometerSun, Clock, Euro, Banknote, Building2, Smartphone, CalendarDays, Upload, Loader2, Image, User } from "lucide-react";
import { ImageCropperDialog } from "@/components/ImageCropperDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertClientSchema, type Client } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPicker } from "@/components/MapPicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DurationInput } from "@/components/DurationInput";
import { PhoneInput } from "@/components/PhoneInput";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface EditClientDialogProps {
  client: Client;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "overlay" | "default";
}

export function EditClientDialog({ client, open: controlledOpen, onOpenChange: controlledOnOpenChange, variant }: EditClientDialogProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  function handleOpenChange(value: boolean) {
    if (isControlled) {
      controlledOnOpenChange!(value);
    } else {
      setInternalOpen(value);
    }
  }

  const updateClient = useUpdateClient();
  const { uploadFile } = useUpload();
  const { toast } = useToast();

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<typeof insertClientSchema> | null>(null);
  const [uploadingHouse, setUploadingHouse] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [housePreview, setHousePreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const houseInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const form = useForm<z.infer<typeof insertClientSchema>>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: client.name,
      phone: client.phone || "",
      whatsapp: client.whatsapp || "",
      facebookMessenger: client.facebookMessenger || "",
      address: client.address || "",
      locality: client.locality || "",
      latitude: client.latitude || undefined,
      longitude: client.longitude || undefined,
      hasGarden: client.hasGarden ?? false,
      hasPool: client.hasPool ?? false,
      hasJacuzzi: client.hasJacuzzi ?? false,
      gardenVisitFrequency: client.gardenVisitFrequency || "seasonal",
      poolVisitFrequency: client.poolVisitFrequency || "seasonal",
      jacuzziVisitFrequency: client.jacuzziVisitFrequency || "seasonal",
      billingType: client.billingType || "monthly",
      monthlyRate: client.monthlyRate || undefined,
      hourlyRate: client.hourlyRate || undefined,
      perVisitRate: client.perVisitRate || undefined,
      paymentMethod: client.paymentMethod || undefined,
      scheduledTransferDay: client.scheduledTransferDay || undefined,
      poolLength: client.poolLength || undefined,
      poolWidth: client.poolWidth || undefined,
      poolMinDepth: client.poolMinDepth || undefined,
      poolMaxDepth: client.poolMaxDepth || undefined,
      jacuzziLength: client.jacuzziLength || undefined,
      jacuzziWidth: client.jacuzziWidth || undefined,
      jacuzziDepth: client.jacuzziDepth || undefined,
      serviceDurationMinutes: client.serviceDurationMinutes ?? 60,
      housePhotoUrl: client.housePhotoUrl || "",
      profilePhotoUrl: client.profilePhotoUrl || "",
    }
  });

  const billingType = form.watch("billingType");
  const hasGarden = form.watch("hasGarden");
  const hasPool = form.watch("hasPool");
  const hasJacuzzi = form.watch("hasJacuzzi");

  const handleHousePhoto = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setHousePreview(localUrl);
    setUploadingHouse(true);
    try {
      const processed = await processImage(file, 1200, false);
      const objectKey = `clients/${client.id}/house.webp`;
      const result = await uploadFile(processed, objectKey);
      if (!result) throw new Error("Upload falhou");
      form.setValue("housePhotoUrl", result.objectPath);
      toast({ title: "Foto da propriedade atualizada", description: "A imagem foi guardada com sucesso." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro ao guardar foto", description: msg, variant: "destructive" });
    } finally {
      URL.revokeObjectURL(localUrl);
      setUploadingHouse(false);
    }
  };

  const handleProfilePhoto = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setProfilePreview(localUrl);
    setUploadingProfile(true);
    try {
      const processed = await processImage(file, 400, true);
      const objectKey = `clients/${client.id}/profile.webp`;
      const result = await uploadFile(processed, objectKey);
      if (!result) throw new Error("Upload falhou");
      form.setValue("profilePhotoUrl", result.objectPath);
      toast({ title: "Foto de perfil atualizada", description: "A imagem foi guardada com sucesso." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro ao guardar foto", description: msg, variant: "destructive" });
    } finally {
      URL.revokeObjectURL(localUrl);
      setUploadingProfile(false);
    }
  };

  const onSubmit = (values: z.infer<typeof insertClientSchema>) => {
    setPendingValues(values);
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingValues) return;
    try {
      await updateClient.mutateAsync({
        id: client.id,
        ...pendingValues,
        latitude: pendingValues.latitude ?? client.latitude,
        longitude: pendingValues.longitude ?? client.longitude,
      });
      setShowConfirm(false);
      setPendingValues(null);
      handleOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={
              variant === "overlay"
                ? "h-9 w-9 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
                : "text-primary-foreground/80 hover:text-white hover:bg-white/10"
            }
            data-testid="button-edit-client"
            aria-label="Editar cliente"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do cliente" className="rounded-xl" data-testid="input-client-name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <PhoneInput value={field.value} onChange={(v) => field.onChange(v)} data-testid="input-client-phone" placeholder="Telefone" className="rounded-xl" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp (se diferente do telefone)</FormLabel>
                  <FormControl>
                    <Input placeholder="WhatsApp" className="rounded-xl" data-testid="input-client-whatsapp" {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facebookMessenger"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Messenger (username)</FormLabel>
                  <FormControl>
                    <Input placeholder="Messenger" className="rounded-xl" data-testid="input-client-messenger" {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Morada</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Rua, número, localidade..." className="rounded-xl" data-testid="input-client-address" {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="locality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lisboa, Porto..." className="rounded-xl" data-testid="input-client-locality" {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />
            <MapPicker
              latitude={form.watch("latitude")}
              longitude={form.watch("longitude")}
              onChange={(lat, lng) => {
                form.setValue("latitude", lat ?? undefined);
                form.setValue("longitude", lng ?? undefined);
              }}
              onAddressChange={(addr) => form.setValue("address", addr)}
              triggerLabel="Escolher morada no mapa"
            />

            {/* Foto da Propriedade */}
            <div className="space-y-2">
              <FormLabel>Foto da propriedade</FormLabel>
              <input
                ref={houseInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleHousePhoto(file);
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => houseInputRef.current?.click()}
                  disabled={uploadingHouse}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50 shrink-0"
                >
                  {uploadingHouse ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Foto</span>
                    </>
                  )}
                </button>
                {(housePreview || form.watch("housePhotoUrl") || client.housePhotoUrl) && (
                  <img
                    src={housePreview || form.watch("housePhotoUrl") || client.housePhotoUrl || undefined}
                    alt="Propriedade"
                    className="w-20 h-20 rounded-xl object-cover border border-border/30"
                  />
                )}
              </div>
            </div>

            {/* Foto de Perfil */}
            <div className="space-y-2">
              <FormLabel>Foto de perfil</FormLabel>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setCropFile(file); setCropOpen(true); }
                  e.target.value = "";
                }}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  disabled={uploadingProfile}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-border/60 bg-muted/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50 shrink-0"
                >
                  {uploadingProfile ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Perfil</span>
                    </>
                  )}
                </button>
                {(profilePreview || form.watch("profilePhotoUrl") || client.profilePhotoUrl) && (
                  <img
                    src={profilePreview || form.watch("profilePhotoUrl") || client.profilePhotoUrl || undefined}
                    alt="Perfil"
                    className="w-20 h-20 rounded-full object-cover border border-border/30"
                  />
                )}
              </div>
            </div>

            {/* Hidden fields — still needed for form state */}
            <FormField
              control={form.control}
              name="housePhotoUrl"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profilePhotoUrl"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Serviços</FormLabel>
              <div className="flex flex-wrap gap-4">
                <FormField
                  control={form.control}
                  name="hasGarden"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-has-garden"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 flex items-center gap-1 text-sm font-normal">
                        <Leaf className="w-4 h-4 text-green-600" /> Jardim
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasPool"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-has-pool"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 flex items-center gap-1 text-sm font-normal">
                        <Waves className="w-4 h-4 text-blue-600" /> Piscina
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasJacuzzi"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-has-jacuzzi"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 flex items-center gap-1 text-sm font-normal">
                        <ThermometerSun className="w-4 h-4 text-muted-foreground" /> Jacuzzi
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {hasGarden && (
              <div className="space-y-3 p-3 rounded-xl border bg-green-50/50">
                <FormLabel className="flex items-center gap-2 text-green-700">
                  <Leaf className="w-4 h-4" />
                  Frequência de Visitas (Jardim)
                </FormLabel>
                <FormField
                  control={form.control}
                  name="gardenVisitFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value || "seasonal"}
                          className="grid grid-cols-1 gap-2"
                        >
                          <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'seasonal' ? 'border-green-500 bg-green-100/50' : 'bg-background/50'}`}>
                            <RadioGroupItem value="seasonal" id="edit-seasonal" className="mt-0.5" />
                            <Label htmlFor="edit-seasonal" className="flex flex-col cursor-pointer">
                              <span className="text-sm font-medium">Sazonal (padrão)</span>
                              <span className="text-xs text-muted-foreground">Época alta: 2x/mês | Época baixa: 1x/mês</span>
                            </Label>
                          </div>
                          <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'once_monthly' ? 'border-green-500 bg-green-100/50' : 'bg-background/50'}`}>
                            <RadioGroupItem value="once_monthly" id="edit-garden_once_monthly" className="mt-0.5" />
                            <Label htmlFor="edit-garden_once_monthly" className="flex flex-col cursor-pointer">
                              <span className="text-sm font-medium">Acordo Especial</span>
                              <span className="text-xs text-muted-foreground">1 visita por mês durante todo o ano</span>
                            </Label>
                          </div>
                          <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'on_demand' ? 'border-green-500 bg-green-100/50' : 'bg-background/50'}`}>
                            <RadioGroupItem value="on_demand" id="edit-garden_on_demand" className="mt-0.5" />
                            <Label htmlFor="edit-garden_on_demand" className="flex flex-col cursor-pointer">
                              <span className="text-sm font-medium">Quando Necessário</span>
                              <span className="text-xs text-muted-foreground">Sem acordo fixo - serviço a pedido</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {hasPool && (
              <div className="space-y-3 p-3 rounded-xl border bg-blue-50/50">
                <FormLabel className="flex items-center gap-2 text-blue-700">
                  <Waves className="w-4 h-4" />
                  Dimensões da Piscina (metros)
                </FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="poolLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Comp.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="10.0"
                            className="rounded-xl"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="poolWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Larg.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="5.0"
                            className="rounded-xl"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="poolMinDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Prof. Mín.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="1.0"
                            className="rounded-xl"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="poolMaxDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Prof. Máx.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="2.0"
                            className="rounded-xl"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("poolLength") && form.watch("poolWidth") && form.watch("poolMinDepth") && form.watch("poolMaxDepth") && (
                  <div className="text-sm text-blue-700 font-medium">
                    Volume: {((form.watch("poolLength") || 0) * (form.watch("poolWidth") || 0) * ((form.watch("poolMinDepth") || 0) + (form.watch("poolMaxDepth") || 0)) / 2).toFixed(1)} m³
                  </div>
                )}

                <div className="pt-3 border-t border-blue-200">
                  <FormLabel className="flex items-center gap-2 text-blue-700 mb-2">
                    <CalendarDays className="w-4 h-4" />
                    Frequência de Visitas
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="poolVisitFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value || "seasonal"}
                            className="grid grid-cols-1 gap-2"
                          >
                            <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'seasonal' ? 'border-blue-500 bg-blue-100/50' : 'bg-background/50'}`}>
                              <RadioGroupItem value="seasonal" id="edit-pool_seasonal" className="mt-0.5" />
                              <Label htmlFor="edit-pool_seasonal" className="flex flex-col cursor-pointer">
                                <span className="text-sm font-medium">Sazonal (padrão)</span>
                                <span className="text-xs text-muted-foreground">Época alta: 1x/semana | Época baixa: 2x/mês</span>
                              </Label>
                            </div>
                            <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'once_monthly' ? 'border-blue-500 bg-blue-100/50' : 'bg-background/50'}`}>
                              <RadioGroupItem value="once_monthly" id="edit-pool_once_monthly" className="mt-0.5" />
                              <Label htmlFor="edit-pool_once_monthly" className="flex flex-col cursor-pointer">
                                <span className="text-sm font-medium">Acordo Especial</span>
                                <span className="text-xs text-muted-foreground">1 visita por mês durante todo o ano</span>
                              </Label>
                            </div>
                            <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'on_demand' ? 'border-blue-500 bg-blue-100/50' : 'bg-background/50'}`}>
                              <RadioGroupItem value="on_demand" id="edit-pool_on_demand" className="mt-0.5" />
                              <Label htmlFor="edit-pool_on_demand" className="flex flex-col cursor-pointer">
                                <span className="text-sm font-medium">Quando Necessário</span>
                                <span className="text-xs text-muted-foreground">Sem acordo fixo - serviço a pedido</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {hasJacuzzi && (
              <div className="space-y-3 p-3 rounded-xl border bg-muted/30">
                <FormLabel className="flex items-center gap-2 text-muted-foreground">
                  <ThermometerSun className="w-4 h-4" />
                  Dimensões do Jacuzzi (metros)
                </FormLabel>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="jacuzziLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Comp.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="2.0"
                            className="rounded-xl"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jacuzziWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Larg.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="2.0"
                            className="rounded-xl"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jacuzziDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Prof.</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0.8"
                            className="rounded-xl"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {form.watch("jacuzziLength") && form.watch("jacuzziWidth") && form.watch("jacuzziDepth") && (
                  <div className="text-sm text-muted-foreground font-medium">
                    Volume: {((form.watch("jacuzziLength") || 0) * (form.watch("jacuzziWidth") || 0) * (form.watch("jacuzziDepth") || 0)).toFixed(1)} m³
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <FormLabel className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CalendarDays className="w-4 h-4" />
                    Frequência de Visitas
                  </FormLabel>
                  <FormField
                    control={form.control}
                    name="jacuzziVisitFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value || "seasonal"}
                            className="grid grid-cols-1 gap-2"
                          >
                            <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'seasonal' ? 'border-primary bg-primary/10' : 'bg-background/50'}`}>
                              <RadioGroupItem value="seasonal" id="edit-jacuzzi_seasonal" className="mt-0.5" />
                              <Label htmlFor="edit-jacuzzi_seasonal" className="flex flex-col cursor-pointer">
                                <span className="text-sm font-medium">Sazonal (padrão)</span>
                                <span className="text-xs text-muted-foreground">Época alta: 1x/semana | Época baixa: 2x/mês</span>
                              </Label>
                            </div>
                            <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'once_monthly' ? 'border-primary bg-primary/10' : 'bg-background/50'}`}>
                              <RadioGroupItem value="once_monthly" id="edit-jacuzzi_once_monthly" className="mt-0.5" />
                              <Label htmlFor="edit-jacuzzi_once_monthly" className="flex flex-col cursor-pointer">
                                <span className="text-sm font-medium">Acordo Especial</span>
                                <span className="text-xs text-muted-foreground">1 visita por mês durante todo o ano</span>
                              </Label>
                            </div>
                            <div className={`flex items-start space-x-3 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'on_demand' ? 'border-primary bg-primary/10' : 'bg-background/50'}`}>
                              <RadioGroupItem value="on_demand" id="edit-jacuzzi_on_demand" className="mt-0.5" />
                              <Label htmlFor="edit-jacuzzi_on_demand" className="flex flex-col cursor-pointer">
                                <span className="text-sm font-medium">Quando Necessário</span>
                                <span className="text-xs text-muted-foreground">Sem acordo fixo - serviço a pedido</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 p-3 rounded-xl border bg-muted/30">
              <FormLabel className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Duração Estimada do Serviço
              </FormLabel>
              <FormField
                control={form.control}
                name="serviceDurationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DurationInput
                        value={field.value ?? 60}
                        onChange={field.onChange}
                        data-testid="input-edit-service-duration"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tempo médio para realizar todos os serviços
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Tipo de Faturação</FormLabel>
              <FormField
                control={form.control}
                name="billingType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value || "monthly"}
                        className="grid grid-cols-3 gap-3"
                      >
                        <div className={`flex items-center space-x-2 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'monthly' ? 'border-primary bg-primary/5' : 'bg-background/50'}`}>
                          <RadioGroupItem value="monthly" id="edit-monthly" />
                          <Label htmlFor="edit-monthly" className="flex items-center gap-2 cursor-pointer">
                            <Euro className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Mensal</span>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-2 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'hourly' ? 'border-primary bg-primary/5' : 'bg-background/50'}`}>
                          <RadioGroupItem value="hourly" id="edit-hourly" />
                          <Label htmlFor="edit-hourly" className="flex items-center gap-2 cursor-pointer">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">À Hora</span>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-2 rounded-xl border p-3 shadow-sm cursor-pointer transition-colors ${field.value === 'per_visit' ? 'border-primary bg-primary/5' : 'bg-background/50'}`}>
                          <RadioGroupItem value="per_visit" id="edit-per_visit" />
                          <Label htmlFor="edit-per_visit" className="flex items-center gap-2 cursor-pointer">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Por Visita</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {billingType === "monthly" && (
                <FormField
                  control={form.control}
                  name="monthlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="rounded-xl"
                          data-testid="input-edit-monthly-rate"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {billingType === "hourly" && (
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor por Hora (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="rounded-xl"
                          data-testid="input-edit-hourly-rate"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {billingType === "per_visit" && (
                <FormField
                  control={form.control}
                  name="perVisitRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor por Visita (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="rounded-xl"
                          data-testid="input-edit-per-visit-rate"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-3 p-3 rounded-xl border bg-muted/30">
              <FormLabel className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                Método de Pagamento
              </FormLabel>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl" data-testid="select-edit-payment-method">
                          <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-green-600" />
                            Dinheiro
                          </div>
                        </SelectItem>
                        <SelectItem value="bank_transfer">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            Transferência Bancária
                          </div>
                        </SelectItem>
                        <SelectItem value="mbway">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-red-500" />
                            MBway
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {form.watch("paymentMethod") === "bank_transfer" && (
                <FormField
                  control={form.control}
                  name="scheduledTransferDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm">
                        <CalendarDays className="w-4 h-4" />
                        Dia da Transferência Agendada
                      </FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Dia</span>
                          <Input
                            type="number"
                            max="31"
                            placeholder="15"
                            className="rounded-xl w-20"
                            data-testid="input-edit-scheduled-transfer-day"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                          <span className="text-sm text-muted-foreground">de cada mês</span>
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Opcional - indica quando o cliente costuma fazer a transferência
                      </p>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Button type="submit" className="w-full btn-primary" disabled={updateClient.isPending}>
              {updateClient.isPending ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </form>
        </Form>
      </DialogContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende guardar as alterações deste cliente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateClient.isPending}>Cancelar</AlertDialogCancel>
            <Button
              className="btn-primary"
              disabled={updateClient.isPending}
              onClick={handleConfirmSave}
            >
              {updateClient.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A guardar...</>
              ) : (
                "Guardar alterações"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageCropperDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        file={cropFile}
        aspect={1}
        onCrop={(croppedFile) => handleProfilePhoto(croppedFile)}
      />
    </Dialog>
  );
}
