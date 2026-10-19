-- schema.sql
-- PBSA Logistics — Database Schema
-- Run automatically on server start, or manually with: psql < schema.sql


-- USERS
-- Drivers, dispatchers, customers

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'DRIVER'
                    CHECK (role IN ('DRIVER', 'DISPATCHER', 'CUSTOMER', 'ADMIN')),
    phone           VARCHAR(20),
    license_number  VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);


-- VEHICLES
-- PBSA's truck fleet

CREATE TABLE IF NOT EXISTS vehicles (
    id            SERIAL PRIMARY KEY,
    registration  VARCHAR(20) UNIQUE NOT NULL,
    make          VARCHAR(50),
    model         VARCHAR(50),
    year          INTEGER,
    capacity_kg   NUMERIC(10,2),
    status        VARCHAR(20) DEFAULT 'AVAILABLE'
                  CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LOADS / SHIPMENTS
-- Each load has a driver, vehicle, origin, destination

CREATE TABLE IF NOT EXISTS loads (
    id                 SERIAL PRIMARY KEY,
    reference          VARCHAR(50) UNIQUE NOT NULL,
    driver_id          INTEGER REFERENCES users(id)    ON DELETE SET NULL,
    vehicle_id         INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    origin             VARCHAR(150) NOT NULL,
    destination        VARCHAR(150) NOT NULL,
    cargo_description  TEXT,
    weight_kg          NUMERIC(10,2),
    status             VARCHAR(20) DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_TRANSIT',
                                         'DELIVERED', 'CANCELLED')),
    eta                TIMESTAMP,
    delivered_at       TIMESTAMP,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loads_driver ON loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);

-- ELD LOGS (Electronic Logging Device)
-- Driver duty status records

CREATE TABLE IF NOT EXISTS eld_logs (
    id            SERIAL PRIMARY KEY,
    driver_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    load_id       INTEGER REFERENCES loads(id) ON DELETE SET NULL,
    duty_status   VARCHAR(20) NOT NULL
                  CHECK (duty_status IN ('DRIVING', 'ON_DUTY', 'SLEEPER', 'OFF')),
    start_time    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time      TIMESTAMP,
    location      VARCHAR(150),
    notes         TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eld_driver ON eld_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_eld_load   ON eld_logs(load_id);

-- ALERTS / NOTIFICATIONS
-- Sent to drivers, dispatchers, or customers

CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL,
    message     TEXT,
    severity    VARCHAR(20) DEFAULT 'INFO'
                CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_user    ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread  ON alerts(user_id, is_read);

-- AUTO-UPDATE updated_at trigger

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_loads_updated_at ON loads;
CREATE TRIGGER trg_loads_updated_at
    BEFORE UPDATE ON loads
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- QUOTES / ENQUIRIES (From Website)

CREATE TABLE IF NOT EXISTS quotes (
    id                 SERIAL PRIMARY KEY,
    full_name          VARCHAR(100) NOT NULL,
    company_name       VARCHAR(100),
    email              VARCHAR(150) NOT NULL,
    phone              VARCHAR(20) NOT NULL,
    origin             VARCHAR(150) NOT NULL,
    destination        VARCHAR(150) NOT NULL,
    goods_description  TEXT,
    weight_kg          NUMERIC(10,2),
    preferred_date     DATE,
    status             VARCHAR(20) DEFAULT 'PENDING',
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);