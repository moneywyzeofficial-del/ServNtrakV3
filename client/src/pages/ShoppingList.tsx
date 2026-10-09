import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, ShoppingCart, AlertTriangle, ArrowDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BottomNav } from "@/components/BottomNav";
import {
  useShoppingList,
  useCreateShoppingListItem,
  useDeleteShoppingListItem,
  useToggleShoppingListItemStatus,
} from "@/hooks/use-shopping-list";

type Urgency = "low" | "normal" | "high";

const urgencyLabel: Record<Urgency, string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
};

const urgencyIcon: Record<Urgency, JSX.Element> = {
  low: <ArrowDown className="w-3 h-3" />,
  normal: <Minus className="w-3 h-3" />,
  high: <AlertTriangle className="w-3 h-3" />,
};

const urgencyVariant: Record<Urgency, "secondary" | "outline" | "destructive"> = {
  low: "secondary",
  normal: "outline",
  high: "destructive",
};

export default function ShoppingList() {
  const { data: items = [], isLoading } = useShoppingList();
  const createItem = useCreateShoppingListItem();
  const deleteItem = useDeleteShoppingListItem();
  const toggleStatus = useToggleShoppingListItemStatus();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ item: "", quantity: "1", urgency: "normal" as Urgency, notes: "" });

  const pendentes = items.filter((i: any) => i.status === "pendente");
  const comprados = items.filter((i: any) => i.status === "comprado");

  async function handleSubmit() {
    if (!form.item.trim()) return;
    await createItem.mutateAsync({
      item: form.item.trim(),
      quantity: form.quantity,
      urgency: form.urgency,
      notes: form.notes || undefined,
    });
    setForm({ item: "", quantity: "1", urgency: "normal", notes: "" });
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Lista de Compras</h1>
          {pendentes.length > 0 && (
            <Badge variant="secondary">{pendentes.length}</Badge>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Novo Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="item">Artigo *</Label>
                <Input
                  id="item"
                  placeholder="Ex: Detergente"
                  value={form.item}
                  onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qty">Quantidade</Label>
                <Input
                  id="qty"
                  placeholder="Ex: 2 unidades"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Urgencia</Label>
                <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v as Urgency }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Informacao adicional..."
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={!form.item.trim() || createItem.isPending}>
                {createItem.isPending ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-4 py-4 space-y-6">
        {isLoading && (
          <p className="text-center text-muted-foreground py-8">A carregar...</p>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Lista vazia</p>
            <p className="text-sm mt-1">Adicione o primeiro artigo.</p>
          </div>
        )}

        {pendentes.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Por comprar ({pendentes.length})
            </h2>
            <div className="space-y-2">
              {pendentes.map((item: any) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleStatus.mutate(item.id)}
                  onDelete={() => deleteItem.mutate(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        {pendentes.length > 0 && comprados.length > 0 && <Separator />}

        {comprados.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Comprado ({comprados.length})
            </h2>
            <div className="space-y-2 opacity-60">
              {comprados.map((item: any) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleStatus.mutate(item.id)}
                  onDelete={() => deleteItem.mutate(item.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function ItemRow({ item, onToggle, onDelete }: { item: any; onToggle: () => void; onDelete: () => void }) {
  const done = item.status === "comprado";
  return (
    <Card className="shadow-none border-border">
      <CardContent className="p-3 flex items-center gap-3">
        <button onClick={onToggle} className="text-muted-foreground hover:text-primary shrink-0">
          {done ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate ${done ? "line-through text-muted-foreground" : ""}`}>{item.item}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {item.quantity && item.quantity !== "1" && (
              <span className="text-xs text-muted-foreground">{item.quantity}</span>
            )}
            <Badge variant={urgencyVariant[item.urgency as Urgency]} className="text-xs h-4 px-1 gap-0.5">
              {urgencyIcon[item.urgency as Urgency]}
              {urgencyLabel[item.urgency as Urgency]}
            </Badge>
          </div>
          {item.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.notes}</p>}
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
