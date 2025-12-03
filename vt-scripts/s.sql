-- Veritabanı oluştur (Eğer yoksa)
 
--CREATE DATABASE club_management; 

-veritabanını oluşturduktan sonra aşağıdaki komutları yazabilirsiniz.



-- Tablolar
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student'  -- 'admin', 'manager', 'student'
);

CREATE TABLE system_messages (
    id SERIAL PRIMARY KEY,
    message_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Örnek kullanıcılar
INSERT INTO users (name, email, password_hash, role) VALUES
('Ali Yılmaz', 'ali@gmail.com', '1234', 'student'),


-- Örnek sistem mesajı
INSERT INTO system_messages (message_text, is_active) VALUES
('Sisteme hoş geldiniz!', TRUE);