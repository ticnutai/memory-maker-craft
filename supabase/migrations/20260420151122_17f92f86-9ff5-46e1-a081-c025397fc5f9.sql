-- Recipients (global list of family members who can receive reminders)
CREATE TABLE public.family_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  name text NOT NULL,
  email text,
  phone_whatsapp text,
  emoji text DEFAULT '👤',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.family_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read family_recipients" ON public.family_recipients FOR SELECT USING (true);
CREATE POLICY "Anyone can insert family_recipients" ON public.family_recipients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update family_recipients" ON public.family_recipients FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete family_recipients" ON public.family_recipients FOR DELETE USING (true);

-- Reminder rules: which recipient gets reminded about which birthday, when, and how
CREATE TABLE public.birthday_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  birthday_id uuid NOT NULL REFERENCES public.birthdays(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.family_recipients(id) ON DELETE CASCADE,
  channels text[] NOT NULL DEFAULT ARRAY['email']::text[], -- 'email', 'whatsapp'
  days_before integer[] NOT NULL DEFAULT ARRAY[7, 1, 0]::integer[],
  enabled boolean NOT NULL DEFAULT true,
  last_sent_at timestamptz,
  last_sent_for_year integer,
  last_sent_days_before integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(birthday_id, recipient_id)
);

ALTER TABLE public.birthday_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read birthday_reminders" ON public.birthday_reminders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert birthday_reminders" ON public.birthday_reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update birthday_reminders" ON public.birthday_reminders FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete birthday_reminders" ON public.birthday_reminders FOR DELETE USING (true);

CREATE INDEX idx_birthday_reminders_birthday ON public.birthday_reminders(birthday_id);
CREATE INDEX idx_birthday_reminders_enabled ON public.birthday_reminders(enabled) WHERE enabled = true;

-- Global reminder settings per device
CREATE TABLE public.reminder_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  send_hour_local integer NOT NULL DEFAULT 9,
  message_style text NOT NULL DEFAULT 'warm', -- 'warm', 'formal', 'festive'
  custom_message_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reminder_settings" ON public.reminder_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reminder_settings" ON public.reminder_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reminder_settings" ON public.reminder_settings FOR UPDATE USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER set_updated_at_family_recipients BEFORE UPDATE ON public.family_recipients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_birthday_reminders BEFORE UPDATE ON public.birthday_reminders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER set_updated_at_reminder_settings BEFORE UPDATE ON public.reminder_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();