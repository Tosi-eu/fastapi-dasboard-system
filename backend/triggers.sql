CREATE OR REPLACE FUNCTION prevent_admin_role_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'admin' AND OLD.role <> 'admin' THEN
        RAISE EXCEPTION 'Não é permitido atualizar o role para admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_admin_role_update
BEFORE UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_role_update();

CREATE OR REPLACE FUNCTION prevent_user_with_admin_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'user' AND NEW.email LIKE '%@admin.com' THEN
        RAISE EXCEPTION 'Usuário com role user não pode ter email do domínio admin.com';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_user_with_admin_email
BEFORE INSERT OR UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION prevent_user_with_admin_email();

CREATE OR REPLACE FUNCTION validate_user_exists()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Existents" WHERE username = NEW.username) THEN
        RAISE EXCEPTION 'Username informado não existe na base';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "Existents" WHERE email = NEW.email) THEN
        RAISE EXCEPTION 'Email informado não existe na base';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_user_exists
BEFORE INSERT ON "User"
FOR EACH ROW
EXECUTE FUNCTION validate_user_exists();

CREATE OR REPLACE FUNCTION prevent_invalid_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT (NEW.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
        RAISE EXCEPTION 'Email inválido. Formato esperado: user@dominio.com';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_invalid_email
BEFORE INSERT OR UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION prevent_invalid_email();

