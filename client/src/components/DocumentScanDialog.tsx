import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Check, X, Upload, Trash2, ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PurchaseCategory, Store } from "@shared/schema";

interface ExtractedItem {
  productName: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  discountValue?: number;
  finalPrice?: number;
}

interface ExtractedData {
  storeName?: string;
  storeNif?: string;
  storeAddress?: string;
  purchaseDate?: string;
  invoiceNumber?: string;
  items: ExtractedItem[];
  totalWithoutTax?: number;
  taxAmount?: number;
  grandTotal?: number;
}

interface DocumentScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PurchaseCategory[];
  stores: Store[];
}

type Step = "capture" | "processing" | "review" | "save";

export function DocumentScanDialog({ open, onOpenChange, categories, stores }: DocumentScanDialogProps) {
  const [step, setStep] = useState<Step>("capture");
  const [imageData, setImageData] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [itemCategories, setItemCategories] = useState<Record<number, number>>({});
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreNif, setNewStoreNif] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isDuplicateInvoice, setIsDuplicateInvoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setStep("capture");
    setImageData(null);
    setExtractedData(null);
    setSelectedStoreId(null);
    setItemCategories({});
    setSelectedItemIndex(0);
  }, []);

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const scanMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      const response = await apiRequest("POST", "/api/scan-document", {
        imageBase64: base64Image,
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        setExtractedData(result.data);
        
        const extractedStoreName = result.data.storeName?.trim().toLowerCase();
        const extractedNif = result.data.storeNif?.trim();
        
        if (extractedStoreName || extractedNif) {
          const matchedStore = stores.find(s => {
            if (extractedNif && s.taxId === extractedNif) {
              return true;
            }
            if (extractedStoreName && extractedStoreName.length >= 3) {
              return s.name.toLowerCase().includes(extractedStoreName) ||
                     extractedStoreName.includes(s.name.toLowerCase());
            }
            return false;
          });
          if (matchedStore) {
            setSelectedStoreId(matchedStore.id);
          }
          // Se OCR encontrou nome mas não há loja correspondente,
          // abrir automaticamente o formulário de criar loja
          if (!matchedStore && result.data.storeName) {
            setShowCreateStore(true);
          }
        }
        
        setStep("review");
        // Pré-preencher campos para criar loja se não encontrou correspondência
        setNewStoreName(result.data.storeName || "");
        setNewStoreNif(result.data.storeNif || "");
        setNewStoreAddress(result.data.storeAddress || "");
        setInvoiceNumber(result.data.invoiceNumber || "");
      } else {
        toast({
          title: "Erro na extração",
          description: result.message || "Não foi possível extrair dados do documento",
          variant: "destructive",
        });
        setStep("capture");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar documento",
        description: error.message,
        variant: "destructive",
      });
      setStep("capture");
    },
  });

  const savePurchasesMutation = useMutation({
    mutationFn: async (data: {
      storeId: number;
      purchaseDate: Date;
      invoiceNumber?: string;
      items: Array<{
        categoryId: number;
        productName: string;
        quantity: number;
        totalWithoutDiscount: number;
        discountValue: number;
        finalTotal: number;
      }>;
    }) => {
      return apiRequest("POST", "/api/purchases/bulk", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) =>
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/purchases')
      });
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      taxId?: string;
      address?: string;
    }) => {
      const response = await apiRequest("POST", "/api/stores", data);
      return response.json();
    },
    onSuccess: (newStore) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      setSelectedStoreId(newStore.id);
      setShowCreateStore(false);
      setNewStoreName("");
      setNewStoreNif("");
      setNewStoreAddress("");
      toast({
        title: "Loja criada",
        description: `${newStore.name} adicionada com sucesso`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar loja",
        description: "Não foi possível criar a loja",
        variant: "destructive",
      });
    },
  });

  const compressImage = (file: File, maxWidth = 1600, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStep("processing");
      const compressedBase64 = await compressImage(file);
      setImageData(compressedBase64);
      scanMutation.mutate(compressedBase64);
    } catch (error) {
      toast({
        title: "Erro ao processar imagem",
        description: "Não foi possível carregar a imagem",
        variant: "destructive",
      });
      setStep("capture");
    }
  };

  const handleSaveAll = async () => {
    if (!selectedStoreId || !extractedData) {
      toast({
        title: "Dados incompletos",
        description: "Selecione uma loja antes de guardar",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < extractedData.items.length; i++) {
      if (!itemCategories[i]) {
        toast({
          title: "Categoria em falta",
          description: `Selecciona uma categoria para "${extractedData.items[i].productName}"`,
          variant: "destructive",
        });
        return;
      }
    }

    const purchaseDate = extractedData.purchaseDate
      ? new Date(extractedData.purchaseDate)
      : new Date();

    try {
      await savePurchasesMutation.mutateAsync({
        storeId: selectedStoreId,
        purchaseDate,
        invoiceNumber: invoiceNumber.trim() || undefined,
        items: extractedData.items.map((item, i) => ({
          categoryId: itemCategories[i],
          productName: item.productName,
          quantity: item.quantity,
          totalWithoutDiscount: item.totalPrice,
          discountValue: item.discountValue || 0,
          finalTotal: item.totalPrice - (item.discountValue || 0),
        })),
      });

      toast({
        title: "Compras guardadas",
        description: `${extractedData.items.length} produto(s) adicionado(s) com sucesso`,
      });

      handleClose();
    } catch (error: any) {
      console.error("Save error:", error);

      if (error?.status === 409 ||
          error?.message?.includes("DUPLICATE_INVOICE") ||
          error?.message?.includes("já foi registada")) {
        setIsDuplicateInvoice(true);
        toast({
          title: "Fatura duplicada",
          description: error.message || "Esta fatura já foi registada. Verifica o número.",
          variant: "destructive",
          duration: 6000,
        });
        return;
      }

      toast({
        title: "Erro ao guardar",
        description: error?.message || "Ocorreu um erro ao guardar as compras",
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const updateItem = (index: number, field: keyof ExtractedItem, value: string | number) => {
    if (!extractedData) return;
    const newItems = [...extractedData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setExtractedData({ ...extractedData, items: newItems });
  };

  const removeItem = (index: number) => {
    if (!extractedData) return;
    const newItems = extractedData.items.filter((_, i) => i !== index);
    setExtractedData({ ...extractedData, items: newItems });
    if (selectedItemIndex >= newItems.length) {
      setSelectedItemIndex(Math.max(0, newItems.length - 1));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => o ? onOpenChange(o) : handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Digitalizar Documento
          </DialogTitle>
          <DialogDescription>
            {step === "capture" && "Tire uma foto do documento de compra"}
            {step === "processing" && "A processar documento..."}
            {step === "review" && "Reveja os dados extraídos"}
            {step === "save" && "Confirme as opções de guardar"}
          </DialogDescription>
        </DialogHeader>

        {step === "capture" && (
          <div className="space-y-4">
            {imageData ? (
              <div className="relative">
                <img 
                  src={imageData} 
                  alt="Documento capturado" 
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setImageData(null)}
                  data-testid="button-clear-image"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Card 
                className="p-8 text-center cursor-pointer hover-elevate border-dashed border-2"
                onClick={() => fileInputRef.current?.click()}
                data-testid="card-capture-area"
              >
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">Tire uma foto ou carregue um ficheiro</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Pode também carregar documentos já digitalizados pelo scanner da sua impressora
                </p>
              </Card>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageCapture}
              className="hidden"
              data-testid="input-file-capture"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
                data-testid="button-select-image"
              >
                <Upload className="w-4 h-4 mr-2" />
                Carregar Ficheiro
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                data-testid="button-take-photo"
              >
                <Camera className="w-4 h-4 mr-2" />
                Câmara
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <p className="font-medium text-foreground">A analisar documento...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Isto pode demorar alguns segundos
            </p>
          </div>
        )}

        {step === "review" && extractedData && (
          <div className="space-y-4">
            {imageData && (
              <img 
                src={imageData} 
                alt="Documento" 
                className="w-full h-32 object-cover rounded-lg border"
              />
            )}

            <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
              {extractedData.storeName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loja:</span>
                  <span className="font-medium">{extractedData.storeName}</span>
                </div>
              )}
              {extractedData.storeNif && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">NIF:</span>
                  <span className="font-medium">{extractedData.storeNif}</span>
                </div>
              )}
              {extractedData.purchaseDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">{extractedData.purchaseDate}</span>
                </div>
              )}
              {extractedData.grandTotal && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-primary">{extractedData.grandTotal.toFixed(2)}€</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nº Fatura / Recibo</Label>
              <div className="relative">
                <Input
                  value={invoiceNumber}
                  onChange={(e) => {
                    setInvoiceNumber(e.target.value);
                    setIsDuplicateInvoice(false);
                  }}
                  placeholder="Ex: FR 2026/1234 (opcional)"
                  className={cn(
                    "h-9 text-sm",
                    isDuplicateInvoice && "border-destructive bg-destructive/10"
                  )}
                />
                {isDuplicateInvoice && (
                  <div className="flex items-center gap-1.5 mt-1 text-destructive">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-xs font-medium">
                      Esta fatura já foi registada anteriormente.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Loja</Label>
              {!showCreateStore ? (
                <div className="space-y-2">
                  <Select
                    value={selectedStoreId?.toString() || ""}
                    onValueChange={(v) => setSelectedStoreId(Number(v))}
                  >
                    <SelectTrigger data-testid="select-scan-store">
                      <SelectValue placeholder="Selecione uma loja" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowCreateStore(true)}
                  >
                    {newStoreName
                      ? `+ Loja não encontrada — Criar "${newStoreName}"`
                      : "+ Criar nova loja"
                    }
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 p-3 border rounded-xl bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground">
                    Nova loja
                  </p>
                  <Input
                    placeholder="Nome da loja *"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="NIF (opcional)"
                    value={newStoreNif}
                    onChange={(e) => setNewStoreNif(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Morada (opcional)"
                    value={newStoreAddress}
                    onChange={(e) => setNewStoreAddress(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setShowCreateStore(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={!newStoreName.trim() || createStoreMutation.isPending}
                      onClick={() => createStoreMutation.mutateAsync({
                        name: newStoreName.trim(),
                        taxId: newStoreNif.trim() || undefined,
                        address: newStoreAddress.trim() || undefined,
                      })}
                    >
                      {createStoreMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Criar loja"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Produtos ({extractedData.items.length})</Label>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {extractedData.items.map((item, index) => (
                  <Card key={index} className="p-3" data-testid={`card-extracted-item-${index}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-2">
                        <Input
                          value={item.productName}
                          onChange={(e) => updateItem(index, "productName", e.target.value)}
                          placeholder="Nome do produto"
                          className="h-8 text-sm"
                          data-testid={`input-item-name-${index}`}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                            className="h-8 text-sm w-20"
                            data-testid={`input-item-qty-${index}`}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={item.totalPrice}
                            onChange={(e) => updateItem(index, "totalPrice", Number(e.target.value))}
                            className="h-8 text-sm flex-1"
                            placeholder="Preço"
                            data-testid={`input-item-price-${index}`}
                          />
                          <span className="text-sm text-muted-foreground self-center">€</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.discountValue || 0}
                            onChange={(e) => updateItem(index, "discountValue", Number(e.target.value))}
                            className="h-8 text-sm w-24"
                            placeholder="Desconto"
                          />
                          <span className="text-xs text-muted-foreground">desc. €</span>
                          <p className="text-xs text-green-600 font-medium">
                            Final: {((item.totalPrice || 0) - (item.discountValue || 0)).toFixed(2)} €
                          </p>
                        </div>
                        <Select
                          value={itemCategories[index]?.toString() || ""}
                          onValueChange={(v) => setItemCategories(prev => ({ ...prev, [index]: Number(v) }))}
                        >
                          <SelectTrigger className="h-8 text-xs mt-1">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => removeItem(index)}
                        data-testid={`button-remove-item-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={resetState}
                data-testid="button-scan-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveAll}
                disabled={!selectedStoreId || extractedData.items.length === 0 || savePurchasesMutation.isPending}
                data-testid="button-save-purchases"
              >
                {savePurchasesMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Guardar {extractedData.items.length} Produto(s)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
