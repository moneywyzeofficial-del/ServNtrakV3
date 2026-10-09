import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, Search } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { PurchaseWithDetails } from "@shared/schema";

export default function ProductPrices() {
  const [search, setSearch] = useState("");

  const { data: purchases, isLoading } = useQuery<PurchaseWithDetails[]>({
    queryKey: ["/api/purchases"],
  });

  const grouped = (() => {
    if (!purchases) return [];
    const map = new Map<string, PurchaseWithDetails[]>();
    for (const p of purchases) {
      const key = p.productName.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries())
      .map(([, items]) => {
        const sorted = [...items].sort(
          (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
        );
        const latest = sorted[0];
        const unitPrices = items.map((i) => i.finalTotal / (i.quantity || 1));
        return {
          name: latest.productName,
          count: items.length,
          latestUnitPrice: latest.finalTotal / (latest.quantity || 1),
          minPrice: Math.min(...unitPrices),
          maxPrice: Math.max(...unitPrices),
          latestStore: latest.store.name,
          latestDate: latest.purchaseDate,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));
  })();

  const filtered = grouped.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24 page-transition">
      <PageHeader
        title="Preços de Produtos"
        subtitle="Histórico e comparação"
        backHref="/more"
      />

      <div className="px-4 py-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Pesquisar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">Sem produtos encontrados</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((product) => (
              <Card key={product.name} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {product.latestStore} · {format(new Date(product.latestDate), "dd/MM/yyyy", { locale: pt })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {product.count} {product.count === 1 ? "compra" : "compras"}
                      </Badge>
                      {product.minPrice !== product.maxPrice && (
                        <Badge variant="secondary" className="text-xs">
                          {product.minPrice.toFixed(2)} – {product.maxPrice.toFixed(2)} €/un
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg text-primary">
                      {product.latestUnitPrice.toFixed(2)} €
                    </p>
                    <p className="text-xs text-muted-foreground">por unidade</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
