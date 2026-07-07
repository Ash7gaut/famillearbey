-- Compte admin par défaut pour le dev local — idempotent (safe à ré-exécuter).
-- Identifiants : admin@arbey.local / password123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@arbey.local';
  v_password TEXT := 'password123';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')),
      NOW(), '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id, v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', NOW(), NOW(), NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.family_members WHERE auth_user_id = v_user_id) THEN
    INSERT INTO public.family_members (first_name, last_name, auth_user_id, is_admin)
    VALUES ('Admin', 'Arbey', v_user_id, TRUE);
  END IF;
END $$;
