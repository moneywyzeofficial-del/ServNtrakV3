import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Plus, Store as StoreIcon, Tag, Loader2, ChevronRight,
  Trash2, Edit2, MapPin, Phone, Mail, Building2, Package, Scan, Camera,
  Search, X, Eye
} from "lucide-react";
import { DocumentScanDialog } from "@/components/DocumentScanDialog";
import { PurchaseDetails } from "@/components/PurchaseDetails";
import { ItemPurchaseHistory } from "@/components/ItemPurchaseHistory";
import type { PurchaseCategory, Store, PurchaseWithDetails, Client } from "@shared/schema";
import { User } from "lucide-react";
import { PhoneInput } from "@/components/PhoneInput";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type ColumnDef, type SortDir } from "@/components/ui/data-table";

interface InvoiceSummary {
  // purchaseDate accepts either Date (from DB) or ISO string
  invoiceNumber: string | null;
  purchaseDate: string;
  storeName: string;
  finalTotal: number;
}

export default function Purchases() {
  const [activeTab, setActiveTab] = useState("compras");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [search, setSearch] = useState("");
  const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showItemHistory, setShowItemHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("purchaseDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("Todas");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useQuery<PurchaseCategory[]>({
    queryKey: ['/api/purchase-categories'],
  });

  const { data: purchaseCategories } = useQuery<string[]>({
    queryKey: ['/api/purchases/categories'],
  });

  const { data: stores, isLoading: storesLoading } = useQuery<Store[]>({
    queryKey: ['/api/stores'],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: allPurchases, isLoading: purchasesLoading } = useQuery<PurchaseWithDetails[]>({
    queryKey: ['/api/purchases'],
  });

  // Filter and sort purchases for DataTable
  const filteredPurchases = allPurchases?.filter(purchase => {
    const matchesCategory = selectedCategory === "Todas" || purchase.category.name === selectedCategory;
    const matchesStore = selectedStoreFilter === "Todas" || purchase.store.name === selectedStoreFilter;
    const matchesSearch = !search.trim() || 
      purchase.productName.toLowerCase().includes(search.toLowerCase()) ||
      purchase.store.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesStore && matchesSearch;
  }) || [];

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    let aVal: any, bVal: any;
    if (sortKey === "purchaseDate") {
      aVal = new Date(a.purchaseDate).getTime();
      bVal = new Date(b.purchaseDate).getTime();
    } else if (sortKey === "finalTotal") {
      aVal = a.finalTotal;
      bVal = b.finalTotal;
    } else if (sortKey === "category") {
      aVal = a.category.name;
      bVal = b.category.name;
    } else {
      return 0;
    }
    if (sortDir === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const paginatedPurchases = sortedPurchases.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: string, dir: SortDir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1); // Reset to first page on sort
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const columns: ColumnDef<PurchaseWithDetails>[] = [
    {
      key: "purchaseDate",
      header: "Data",
      sortable: true,
      cell: (purchase) => format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: pt }),
      mobileLabel: "Data",
      className: "font-medium md:font-normal",
    },
    {
      key: "productName",
      header: "Artigo/Descrição",
      sortable: false,
      cell: (purchase) => purchase.productName,
      mobileLabel: "Artigo",
    },
    {
      key: "category",
      header: "Categoria",
      sortable: true,
      cell: (purchase) => purchase.category.name,
      mobileLabel: "Categoria",
      className: "text-muted-foreground text-sm md:text-foreground md:text-sm",
    },
    {
      key: "store",
      header: "Loja",
      sortable: false,
      cell: (purchase) => purchase.store.name,
      mobileLabel: "Loja",
      className: "text-muted-foreground text-sm md:text-foreground md:text-sm",
    },
    {
      key: "finalTotal",
      header: "Valor (€)",
      sortable: true,
      cell: (purchase) => `${purchase.finalTotal.toFixed(2)}€`,
      mobileLabel: "Valor",
      className: "font-medium md:font-normal text-right",
    },
    {
      key: "actions",
      header: "Ações",
      sortable: false,
      isAction: true,
      cell: (purchase) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // For individual purchase, perhaps open a dialog with details
              // Since PurchaseDetails expects invoiceNumber, maybe adapt or create new
              // For now, just log or show toast
              toast({ title: `Ver compra: ${purchase.productName}` });
            }}
          >
            <Eye className="w-4 h-4" />
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              toast({ title: `Editar não implementado: ${purchase.productName}` });
            }}
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
        </div>
      ),
    },
  ];

  // Keep the invoices logic for backward compatibility (if needed elsewhere)
  const invoices: InvoiceSummary[] = [];
  if (allPurchases) {
    const grouped = new Map<string | null, PurchaseWithDetails[]>();
    allPurchases.forEach(p => {
      const key = p.invoiceNumber || `temp-${p.id}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(p);
    });

    const searchLower = search.trim().toLowerCase();
    grouped.forEach((items, key) => {
      const first = items[0];
      const matchesCategory =
        selectedCategory === "Todas" ||
        items.some(p => p.category.name === selectedCategory);
      const matchesSearch =
        !searchLower ||
        first.store.name.toLowerCase().includes(searchLower) ||
        (first.invoiceNumber || "").toLowerCase().includes(searchLower) ||
        items.some(p => p.productName.toLowerCase().includes(searchLower));
      if (matchesCategory && matchesSearch) {
        invoices.push({
          invoiceNumber: first.invoiceNumber || null,
          purchaseDate: typeof first.purchaseDate === "string" ? first.purchaseDate : new Date(first.purchaseDate).toISOString(),
          storeName: first.store.name,
          finalTotal: items.reduce((sum, p) => sum + p.finalTotal, 0),
        });
      }
    });
  }

  invoices.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <PageHeader
        title="Compras"
        subtitle="Materiais e gastos"
        backHref="/more"
      />

      <div className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="compras" data-testid="tab-purchases">
              <Package className="w-4 h-4 mr-1.5" />
              Compras
            </TabsTrigger>
            <TabsTrigger value="lojas" data-testid="tab-stores">
              <StoreIcon className="w-4 h-4 mr-1.5" />
              Lojas
            </TabsTrigger>
            <TabsTrigger value="categorias" data-testid="tab-categories">
              <Tag className="w-4 h-4 mr-1.5" />
              Categorias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compras" className="space-y-4">
            <div className="mb-4">
              <Button
                onClick={() => setDocumentDialogOpen(true)}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                Digitalizar Fatura
              </Button>
            </div>

            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                inputMode="search"
                placeholder="Procurar por loja, fatura ou artigo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10"
                aria-label="Pesquisar nas compras"
                data-testid="input-search-purchases"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Limpar pesquisa"
                  data-testid="button-clear-search-purchases"
                >
                  <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory("Todas")}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === "Todas"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Todas
              </button>
              {purchaseCategories?.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedStoreFilter("Todas")}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedStoreFilter === "Todas"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                Todas as Lojas
              </button>
              {stores?.map((store) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedStoreFilter(store.name)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedStoreFilter === store.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {store.name}
                </button>
              ))}
            </div>

            <DocumentScanDialog
              open={documentDialogOpen}
              onOpenChange={setDocumentDialogOpen}
              categories={categories || []}
              stores={stores || []}
            />

            {purchasesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : paginatedPurchases.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">Sem compras registadas</p>
                <p className="text-sm text-muted-foreground mt-1">Digitalize ou adicione uma compra</p>
              </Card>
              ) : (
              <DataTable
                data={paginatedPurchases}
                columns={columns}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                page={page}
                pageSize={pageSize}
                totalCount={sortedPurchases.length}
                onPageChange={handlePageChange}
              />
            )}

            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Histórico por Artigo</h3>
              {selectedCategory !== "Todas" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Artigo</th>
                        <th className="text-right p-2">Última Compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPurchases
                        ?.filter(p => p.category.name === selectedCategory)
                        .filter(p => {
                          const s = search.trim().toLowerCase();
                          if (!s) return true;
                          return (
                            p.productName.toLowerCase().includes(s) ||
                            p.store.name.toLowerCase().includes(s) ||
                            (p.invoiceNumber || "").toLowerCase().includes(s)
                          );
                        })
                        .reduce((acc: Map<string, PurchaseWithDetails>, p) => {
                          if (!acc.has(p.productName) || new Date(p.purchaseDate) > new Date(acc.get(p.productName)!.purchaseDate)) {
                            acc.set(p.productName, p);
                          }
                          return acc;
                        }, new Map())
                        .entries()
                        .map(([productName, purchase]) => (
                          <tr key={productName} className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              setSelectedItem(productName);
                              setShowItemHistory(true);
                            }}>
                            <td className="p-2">{productName}</td>
                            <td className="text-right p-2 text-primary font-medium">
                              {format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: pt })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedInvoice && (
              <PurchaseDetails
                invoiceNumber={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
              />
            )}

            {showItemHistory && selectedItem && (
              <ItemPurchaseHistory
                productName={selectedItem}
                onClose={() => {
                  setShowItemHistory(false);
                  setSelectedItem(null);
                }}
              />
            )}

            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Adicionar Compra</h3>
              <AddPurchaseDialog
                open={isAddPurchaseOpen}
                onOpenChange={setIsAddPurchaseOpen}
                categories={categories || []}
                stores={stores || []}
                clients={clients || []}
              />
            </div>
          </TabsContent>

          <TabsContent value="lojas" className="space-y-4">
            <div className="flex justify-end">
              <AddStoreDialog open={isAddStoreOpen} onOpenChange={setIsAddStoreOpen} />
            </div>

            {storesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (stores?.length || 0) === 0 ? (
              <Card className="p-8 text-center">
                <StoreIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">Sem lojas registadas</p>
                <p className="text-sm text-muted-foreground mt-1">Adicione a sua primeira loja</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {stores?.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <div className="flex justify-end">
              <AddCategoryDialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen} />
            </div>

            {categoriesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {categories?.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
}

function PurchaseCard({ purchase }: { purchase: PurchaseWithDetails }) {
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/purchases/${purchase.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) =>
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/purchases')
      });
      toast({ title: "Compra eliminada" });
    },
  });

  return (
    <>
      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setDetailOpen(true)}
        data-testid={`card-purchase-${purchase.id}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate" data-testid={`text-purchase-name-${purchase.id}`}>{purchase.productName}</h3>
            <p className="text-sm text-muted-foreground" data-testid={`text-purchase-store-${purchase.id}`}>{purchase.store.name}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">{purchase.category.name}</Badge>
              <Badge variant="outline">Qtd: {purchase.quantity}</Badge>
              {purchase.client && (
                <Badge variant="default" className="bg-green-600" data-testid={`badge-client-${purchase.id}`}>
                  <User className="w-3 h-3 mr-1" />
                  {purchase.client.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="font-bold text-lg text-primary">{purchase.finalTotal.toFixed(2)}€</p>
            {purchase.discountValue && purchase.discountValue > 0 && (
              <p className="text-xs text-green-600">-{purchase.discountValue.toFixed(2)}€ desc.</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: pt })}
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
            data-testid={`button-delete-purchase-${purchase.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar compra?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{purchase.productName}" será eliminado permanentemente.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate();
                setDeleteOpen(false);
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{purchase.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Loja</span>
              <span className="font-medium text-right">{purchase.store.name}</span>
              <span className="text-muted-foreground">Categoria</span>
              <span className="font-medium text-right">{purchase.category.name}</span>
              <span className="text-muted-foreground">Quantidade</span>
              <span className="font-medium text-right">{purchase.quantity}</span>
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium text-right">
                {format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: pt })}
              </span>
              {purchase.invoiceNumber && (
                <>
                  <span className="text-muted-foreground">Nº Fatura</span>
                  <span className="font-medium text-right">{purchase.invoiceNumber}</span>
                </>
              )}
              {purchase.client && (
                <>
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium text-right">{purchase.client.name}</span>
                </>
              )}
            </div>
            <div className="border-t pt-3 space-y-1">
              {purchase.discountValue && purchase.discountValue > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor sem desconto</span>
                  <span>{purchase.totalWithoutDiscount.toFixed(2)} €</span>
                </div>
              )}
              {purchase.discountValue && purchase.discountValue > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>- {purchase.discountValue.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total final</span>
                <span className="text-primary">{purchase.finalTotal.toFixed(2)} €</span>
              </div>
            </div>
            {purchase.notes && (
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm mt-1">{purchase.notes}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setDetailOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StoreCard({ store }: { store: Store }) {
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/stores/${store.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      toast({ title: "Loja eliminada" });
    },
  });

  return (
    <>
      <Card className="p-4" data-testid={`card-store-${store.id}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate flex items-center gap-2" data-testid={`text-store-name-${store.id}`}>
              <Building2 className="w-4 h-4 text-primary" />
              {store.name}
            </h3>
            {store.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {store.address}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {store.phone && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {store.phone}
                </span>
              )}
              {store.taxId && (
                <Badge variant="outline" className="text-xs">NIF: {store.taxId}</Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive shrink-0"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-store-${store.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar loja?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{store.name}" e todas as suas compras associadas serão eliminadas permanentemente.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate();
                setDeleteOpen(false);
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryCard({ category }: { category: PurchaseCategory }) {
  const { toast } = useToast();
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/purchase-categories/${category.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-categories'] });
      toast({ title: "Categoria eliminada" });
    },
  });

  return (
    <Card className="p-3 flex items-center justify-between" data-testid={`card-category-${category.id}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
          <Tag className="w-5 h-5 text-secondary-foreground" />
        </div>
        <span className="font-medium text-foreground" data-testid={`text-category-name-${category.id}`}>{category.name}</span>
        {category.isDefault && (
          <Badge variant="outline" className="text-xs">Predefinida</Badge>
        )}
      </div>
      {!category.isDefault && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          data-testid={`button-delete-category-${category.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </Card>
  );
}

const purchaseFormSchema = z.object({
  storeId: z.number({ required_error: "Selecione uma loja" }),
  categoryId: z.number({ required_error: "Selecione uma categoria" }),
  clientId: z.number().optional().nullable(),
  productName: z.string().min(1, "Nome do produto é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva").default(1),
  totalWithoutDiscount: z.number().positive("Valor total é obrigatório"),
  discountValue: z.number().min(0).default(0),
  purchaseDate: z.string().min(1, "Data é obrigatória"),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

function AddPurchaseDialog({ 
  open, 
  onOpenChange, 
  categories, 
  stores,
  clients
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  categories: PurchaseCategory[];
  stores: Store[];
  clients: Client[];
}) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      quantity: 1,
      discountValue: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof purchaseFormSchema>) => {
      const finalTotal = data.totalWithoutDiscount - (data.discountValue || 0);
      return apiRequest('POST', '/api/purchases', {
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        finalTotal,
        invoiceNumber: data.invoiceNumber?.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/purchases')
      });
      toast({ title: "Compra adicionada com sucesso" });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar compra", description: error.message, variant: "destructive" });
    },
  });

  const totalWithoutDiscount = form.watch("totalWithoutDiscount") || 0;
  const discountValue = form.watch("discountValue") || 0;
  const finalTotal = totalWithoutDiscount - discountValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-purchase">
          <Plus className="w-4 h-4 mr-1" />
          Nova Compra
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Compra</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="storeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loja</FormLabel>
                  <Select 
                    onValueChange={(v) => field.onChange(Number(v))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-store">
                        <SelectValue placeholder="Selecione uma loja" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id.toString()}>{store.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select 
                    onValueChange={(v) => field.onChange(Number(v))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (opcional)</FormLabel>
                  <Select 
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-client">
                        <SelectValue placeholder="Sem cliente associado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem cliente associado</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Fertilizante NPK" data-testid="input-product-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-quantity"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-purchase-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalWithoutDiscount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="0.00"
                        data-testid="input-total"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desconto (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="0.00"
                        data-testid="input-discount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº Fatura (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: FR 2026/1234"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="bg-secondary/50 rounded-lg p-3 flex justify-between items-center">
              <span className="font-medium">Total Final:</span>
              <span className="text-lg font-bold text-primary">{finalTotal.toFixed(2)}€</span>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-purchase">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar Compra
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const storeFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

function AddStoreDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof storeFormSchema>>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {},
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof storeFormSchema>) => 
      apiRequest('POST', '/api/stores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      toast({ title: "Loja adicionada com sucesso" });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar loja", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-store">
          <Plus className="w-4 h-4 mr-1" />
          Nova Loja
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Loja</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Loja</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Leroy Merlin" data-testid="input-store-name" />
                  </FormControl>
                  <FormMessage />
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
                    <Input {...field} placeholder="Morada completa" data-testid="input-store-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PhoneInput value={field.value} onChange={(v) => field.onChange(v)} data-testid="input-store-phone" placeholder="+351..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIF/Contribuinte</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="999999999" data-testid="input-store-tax-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder="Email" data-testid="input-store-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-store">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar Loja
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

function AddCategoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {},
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof categoryFormSchema>) => 
      apiRequest('POST', '/api/purchase-categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-categories'] });
      toast({ title: "Categoria adicionada com sucesso" });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar categoria", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-category">
          <Plus className="w-4 h-4 mr-1" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Categoria</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Categoria</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Ferramentas" data-testid="input-category-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-category">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar Categoria
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
