###1. Tạo Project trên Firebase
Truy cập https://console.firebase.google.com → Add Project.
Đặt tên (ví dụ: meal-planner).
Tắt Google Analytics nếu không cần.
Sau khi tạo xong, vào Project Settings → Service accounts.
Chọn Generate new private key → tải file .json về → lưu vào thư mục backend (đổi tên thành serviceAccountKey.json cho dễ nhớ).

###2. Lấy API Key từ Spoonacular
Truy cập: https://spoonacular.com/food-api → Get Started for Free.
Đăng ký tài khoản.
Vào Profile → API → copy API Key.
Dán vào file .env (trong backend): SPOONACULAR_API_KEY=API_KEY
