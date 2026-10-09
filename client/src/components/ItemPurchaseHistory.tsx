import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { PurchaseWithDetails } from "@shared/schema";

interface ItemPurchaseHistoryProps {
  productName: string;
  onClose: () => void;
}

export function ItemPurchaseHistory({ productName, onClose }: ItemPurchaseHistoryProps) {
  const { data: purchases, isLoading } = useQuery<PurchaseWithDetails[]>({
    queryKey: [`/api/purchases/item/${productName}`],
  });

  const items = purchases || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de "{productName}"</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Sem histórico de compras
          </div>
        ) : (
          <div className="space-y-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Fatura</th>
                  <th className="text-right p-2">Qtd</th>
                  <th className="text-right p-2">Preço</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">
                      {format(new Date(item.purchaseDate), "dd/MM/yyyy", { locale: pt })}
                    </td>
                    <td className="p-2">{item.invoiceNumber || "—"}</td>
                    <td className="text-right p-2">{item.quantity}</td>
                    <td className="text-right p-2 font-medium">{item.finalTotal.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
