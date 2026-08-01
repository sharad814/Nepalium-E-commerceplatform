INSERT INTO public.user_roles (user_id, role)
VALUES ('4b795a91-2ad1-4a20-9842-51764e9dd08e', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;