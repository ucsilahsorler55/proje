-- Test kullanıcılarının şifrelerini güncelle (şifre: admin123)
UPDATE users SET password_hash = 'scrypt:32768:8:1$K37ci5AxCVj2wwNJ$a5a2bfc437c563e6de84cdf5f1ce26d2b2e5cf79c08fbcef8962308bfe1071bc22a6aee3982127b6e2b593420cbc10f1a35ea0d06f952d27eb360551129aaa61' 
WHERE email IN ('admin@university.edu', 'student1@university.edu', 'student2@university.edu');
