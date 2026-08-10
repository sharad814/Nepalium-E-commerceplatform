ALTER TYPE public.payment_method ADD VALUE IF NOT EXISTS 'bank';

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS verified_by uuid,
  ADD COLUMN IF NOT EXISTS reference_id text;