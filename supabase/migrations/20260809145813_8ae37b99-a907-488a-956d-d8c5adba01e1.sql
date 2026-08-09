CREATE OR REPLACE FUNCTION public.seller_owns_order(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.stores s ON s.id = oi.store_id
    WHERE oi.order_id = _order_id AND s.owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_owns_order(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id AND o.user_id = _user_id
  )
$$;

REVOKE ALL ON FUNCTION public.seller_owns_order(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_owns_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seller_owns_order(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_owns_order(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Sellers view store orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers update store orders" ON public.orders;

CREATE POLICY "Sellers view store orders" ON public.orders
FOR SELECT TO authenticated
USING (public.seller_owns_order(id, auth.uid()));

CREATE POLICY "Sellers update store orders" ON public.orders
FOR UPDATE TO authenticated
USING (public.seller_owns_order(id, auth.uid()))
WITH CHECK (public.seller_owns_order(id, auth.uid()));

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users create own order items" ON public.order_items;

CREATE POLICY "Users view own order items" ON public.order_items
FOR SELECT TO authenticated
USING (public.user_owns_order(order_id, auth.uid()));

CREATE POLICY "Users create own order items" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (public.user_owns_order(order_id, auth.uid()));

DROP POLICY IF EXISTS "Users view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users create own payments" ON public.payments;

CREATE POLICY "Users view own payments" ON public.payments
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.user_owns_order(order_id, auth.uid()));

CREATE POLICY "Users create own payments" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (public.user_owns_order(order_id, auth.uid()));