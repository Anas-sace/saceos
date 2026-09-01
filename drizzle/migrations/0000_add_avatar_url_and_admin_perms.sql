ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO public.app_settings (key, value)
VALUES ('admin_perms', '["manage_users","approve_leave","upload_leads","view_all_tickets","view_reports","view_all_eod"]'::jsonb)
ON CONFLICT (key) DO NOTHING;