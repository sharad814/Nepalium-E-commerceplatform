import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { salePrice } from "@/lib/branding";

export type CartLine = {
  id: string;
  product_id: string;
  quantity: number;
  title: string;
  slug: string;
  price: number;
  discount_percent: number;
  stock: number;
  image: string | null;
  storeName: string | null;
};

type CartContextValue = {
  lines: CartLine[];
  loading: boolean;
  count: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setLines([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        "id,product_id,quantity,products(title,slug,price,discount_percent,stock,images,stores(name))",
      )
      .eq("user_id", user.id)
      .order("created_at");
    setLoading(false);
    if (error) {
      toast.error("Could not load your cart");
      return;
    }
    type Row = {
      id: string;
      product_id: string;
      quantity: number;
      products: {
        title: string;
        slug: string;
        price: number;
        discount_percent: number;
        stock: number;
        images: string[];
        stores: { name: string } | null;
      } | null;
    };
    setLines(
      ((data ?? []) as unknown as Row[])
        .filter((row) => row.products)
        .map((row) => ({
          id: row.id,
          product_id: row.product_id,
          quantity: row.quantity,
          title: row.products!.title,
          slug: row.products!.slug,
          price: Number(row.products!.price),
          discount_percent: row.products!.discount_percent,
          stock: row.products!.stock,
          image: row.products!.images?.[0] ?? null,
          storeName: row.products!.stores?.name ?? null,
        })),
    );
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!user) {
        toast.error("Please sign in to add items to your cart");
        return;
      }
      // Always check the server for an existing line so a stale local list
      // can't trigger the unique (user_id, product_id) constraint.
      const { data: existing, error: findError } = await supabase
        .from("cart_items")
        .select("id,quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (findError) {
        toast.error(findError.message);
        return;
      }
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from("cart_items")
          .upsert(
            { user_id: user.id, product_id: productId, quantity },
            { onConflict: "user_id,product_id" },
          );
        if (error) {
          toast.error(error.message);
          return;
        }
      }
      toast.success("Added to cart");
      await refresh();
    },
    [user, refresh],
  );


  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (quantity < 1) return;
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", lineId);
      if (error) {
          toast.error(error.message);
          return;
        }
      await refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", lineId);
      if (error) {
          toast.error(error.message);
          return;
        }
      await refresh();
    },
    [refresh],
  );

  const clear = useCallback(async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      loading,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce(
        (sum, l) => sum + salePrice(l.price, l.discount_percent) * l.quantity,
        0,
      ),
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [lines, loading, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
