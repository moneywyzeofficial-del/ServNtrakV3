import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import type { PurchaseWithDetails } from "@shared/schema";

interface PurchaseDetailsProps {
  invoiceNumber: string;
  onClose: () => void;
}

export function PurchaseDetails({ invoiceNumber, onClose }: PurchaseDetailsProps) {
  const { data: purchases, isLoading } = useQuery<PurchaseWithDetails[]>({
    queryKey: [`/api/purchases/details/${invoiceNumber}`],
  });

  const items = purchases || [];
  const subtotal = items.reduce((sum, p) => sum + p.totalWithoutDiscount, 0);
  const discount = items.reduce((sum, p) => sum + (p.discountValue || 0), 0);
  const total = items.reduce((sum, p) => sum + p.finalTotal, 0);

  const firstItem = items[0];
  const invoiceDate = firstItem?.purchaseDate ? format(new Date(firstItem.purchaseDate), "dd/MM/yyyy", { locale: pt }) : "";
  const storeName = firstItem?.store.name || "";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Fatura {invoiceNumber}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Loja</span>
              <span className="font-medium text-right">{storeName}</span>
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium text-right">{invoiceDate}</span>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Artigos</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Artigo</th>
                    <th className="text-right p-2">Qtd</th>
                    <th className="text-right p-2">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2">{item.productName}</td>
                      <td className="text-right p-2">{item.quantity}</td>
                      <td className="text-right p-2 font-medium">{item.finalTotal.toFixed(2)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}€</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-{discount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{total.toFixed(2)}€</span>
              </div>
            </div>
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
