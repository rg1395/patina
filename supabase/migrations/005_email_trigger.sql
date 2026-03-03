-- Trigger che chiama la Edge Function send-email ad ogni nuova notifica
-- Richiede che la Edge Function sia deployata su Supabase

CREATE OR REPLACE FUNCTION notify_via_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  payload JSONB;
BEGIN
  -- Recupera email dell'utente
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  IF user_email IS NULL THEN RETURN NEW; END IF;

  payload := jsonb_build_object(
    'type', NEW.type,
    'data', COALESCE(NEW.data, '{}'::jsonb) || jsonb_build_object(
      'to_email', user_email,
      'title', NEW.title,
      'body', NEW.body
    )
  );

  -- Chiama la Edge Function in modo asincrono
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Non bloccare se la email fallisce
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION notify_via_email();

-- Nota: richiede pg_net extension
-- Abilita su Supabase: Dashboard → Database → Extensions → pg_net
