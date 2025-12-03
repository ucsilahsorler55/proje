from werkzeug.security import generate_password_hash

# admin123 için hash oluştur
password = "admin123"
hash1 = generate_password_hash(password)

print("Hash oluşturuldu:")
print(hash1)
print("\nVeritabanı için SQL:")
print(f"UPDATE users SET password_hash = '{hash1}' WHERE email IN ('admin@university.edu', 'student1@university.edu', 'student2@university.edu');")
