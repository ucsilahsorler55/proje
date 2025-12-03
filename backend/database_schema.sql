-- Üniversite Öğrenci Kulüp Sistemi - PostgreSQL Veritabanı Şeması
-- Sprint 1 - Temel Tablolar

-- Enum türleri
CREATE TYPE user_role AS ENUM ('student', 'club_admin', 'sks_admin');
CREATE TYPE club_status AS ENUM ('pending', 'active', 'inactive', 'rejected');
CREATE TYPE membership_status AS ENUM ('pending', 'active', 'inactive');
CREATE TYPE event_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Kullanıcılar tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    student_number VARCHAR(20) UNIQUE,
    department VARCHAR(100),
    phone VARCHAR(20),
    role user_role DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kulüpler tablosu
CREATE TABLE clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    founding_date DATE,
    status club_status DEFAULT 'pending',
    founder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    advisor_name VARCHAR(255),
    advisor_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kulüp üyelikleri tablosu
CREATE TABLE club_memberships (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- member, president, vice_president, treasurer
    status membership_status DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, user_id)
);

-- Etkinlikler tablosu
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    capacity INTEGER,
    status event_status DEFAULT 'pending',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Etkinlik katılımcıları tablosu
CREATE TABLE event_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Bildirimler tablosu
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Duyurular tablosu
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_global BOOLEAN DEFAULT false, -- SKS için genel duyurular
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler (Performans için)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_student_number ON users(student_number);
CREATE INDEX idx_clubs_status ON clubs(status);
CREATE INDEX idx_club_memberships_user ON club_memberships(user_id);
CREATE INDEX idx_club_memberships_club ON club_memberships(club_id);
CREATE INDEX idx_events_club ON events(club_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Trigger: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test verileri (Development için)
-- Admin kullanıcı (şifre: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoR7fAXhD8Pe', 'Admin', 'User', 'sks_admin');

-- Test öğrenciler
INSERT INTO users (email, password_hash, first_name, last_name, student_number, department, role) VALUES
('student1@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoR7fAXhD8Pe', 'Ahmet', 'Yılmaz', '2021001', 'Bilgisayar Mühendisliği', 'student'),
('student2@university.edu', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eoR7fAXhD8Pe', 'Ayşe', 'Kaya', '2021002', 'Elektrik Mühendisliği', 'student');

-- Test kulüpleri
INSERT INTO clubs (name, description, status, advisor_name) VALUES
('Bilgisayar Kulübü', 'Yazılım ve teknoloji odaklı etkinlikler düzenleyen kulüp', 'active', 'Dr. Mehmet Demir'),
('Müzik Kulübü', 'Müzik etkinlikleri ve konserler düzenleyen kulüp', 'active', 'Dr. Zeynep Aksoy'),
('Fotoğrafçılık Kulübü', 'Fotoğraf çekimi ve sergiler', 'pending', 'Dr. Ali Yurt');
