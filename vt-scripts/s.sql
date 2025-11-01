-- 👥 USERS (Kullanıcılar)
INSERT INTO users (id, name, email, password_hash, is_active)
VALUES
(1, 'Ahmet Yılmaz', 'ahmet@uni.edu', 'hashed_pw_ahmet', TRUE),
(2, 'Ayşe Demir', 'ayse@uni.edu', 'hashed_pw_ayse', TRUE),
(3, 'Mehmet Kara', 'mehmet@uni.edu', 'hashed_pw_mehmet', TRUE),
(4, 'Elif Yıldız', 'elif@uni.edu', 'hashed_pw_elif', TRUE),
(5, 'Admin Kullanıcı', 'admin@uni.edu', 'hashed_pw_admin', TRUE);

-- 🎭 ROLES (Roller)
INSERT INTO roles (id, name, description) VALUES
(1, 'student', 'Normal öğrenci, kulüplere katılabilir.'),
(2, 'club_manager', 'Kulüp yönetimi işlemleri yapabilir.'),
(3, 'admin', 'Sistemi yönetebilir.');

-- 🔗 USER_ROLES (Kullanıcı Rolleri)
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1),  -- Ahmet öğrenci
(2, 1),  -- Ayşe öğrenci
(3, 1),  -- Mehmet öğrenci
(3, 2),  -- Mehmet kulüp yöneticisi
(4, 1),  -- Elif öğrenci
(5, 3);  -- Admin sistem yöneticisi

-- 🏛️ CLUBS (Kulüpler) - advisor_name dahil
INSERT INTO clubs (id, name, description, logo_url, advisor_name, created_by)
VALUES
(1, 'Bilgisayar Kulübü', 'Yazılım, donanım ve teknoloji odaklı etkinlikler düzenler.', 'https://example.com/logo1.png', 'Dr. Zeynep Kaya', 3),
(2, 'Tiyatro Kulübü', 'Sahne sanatlarıyla ilgilenen öğrenciler için bir topluluk.', 'https://example.com/logo2.png', 'Doç. Ali Rıza Aksoy', 3),
(3, 'Müzik Kulübü', 'Müzik dinlemek, söylemek ve üretmek isteyen öğrenciler için.', 'https://example.com/logo3.png', 'Prof. Elvan Demirtaş', 3);

-- 👥 CLUB_MEMBERSHIPS (Üyelikler)
INSERT INTO club_memberships (user_id, club_id, role_in_club, status)
VALUES
(1, 1, 'member', 'approved'),   -- Ahmet bilgisayar kulübü üyesi
(2, 1, 'member', 'approved'),   -- Ayşe bilgisayar kulübü üyesi
(3, 1, 'manager', 'approved'),  -- Mehmet kulüp yöneticisi
(4, 2, 'member', 'pending');    -- Elif tiyatro kulübüne başvurdu

-- 📅 EVENTS (Etkinlikler)
INSERT INTO events (id, club_id, title, description, event_date, created_by)
VALUES
(1, 1, 'Hackathon 2025', '48 saatlik yazılım geliştirme maratonu.', '2025-11-10 09:00:00', 3),
(2, 2, 'Sahne Provası', 'Yeni tiyatro oyunumuz için prova.', '2025-11-15 17:00:00', 3),
(3, 3, 'Konser Gecesi', 'Üniversite bahçesinde canlı müzik etkinliği.', '2025-12-05 19:30:00', 3);

-- 🧍‍♂️ EVENT_PARTICIPANTS (Katılımcılar)
INSERT INTO event_participants (event_id, user_id, status)
VALUES
(1, 1, 'registered'),
(1, 2, 'registered'),
(1, 3, 'attended'),
(2, 4, 'registered'),
(3, 2, 'cancelled');

-- 📣 ANNOUNCEMENTS (Duyurular)
INSERT INTO announcements (club_id, title, content, created_by)
VALUES
(1, 'Yeni Üyelik Dönemi Başladı', 'Bilgisayar kulübüne yeni üyelik başvuruları açıldı!', 3),
(2, 'Prova Saati Değişti', 'Tiyatro kulübü provasının saati 17:00 olarak güncellenmiştir.', 3),
(3, 'Konser Gönüllüleri Aranıyor', 'Konser organizasyonunda görev almak isteyen öğrenciler iletişime geçsin.', 3);
