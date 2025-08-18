// server.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo Firebase Admin
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Route kiểm tra server
app.get("/", (req, res) => {
    res.send("API Node.js với Firebase đang chạy...");
});

// API tạo user (đăng ký)
app.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await admin.auth().createUser({
            email,
            password
        });
        res.status(201).json({ message: "Tạo tài khoản thành công", user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// API reset mật khẩu (gửi link qua email)
app.post("/reset-password", async (req, res) => {
    const { email } = req.body;
    try {
        const link = await admin.auth().generatePasswordResetLink(email);
        // Ở đây bạn có thể gửi link này qua email người dùng bằng service email như Nodemailer
        res.json({ message: "Link reset mật khẩu đã tạo", link });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// API xóa tài khoản (chỉ admin mới gọi)
app.delete("/delete-user/:uid", async (req, res) => {
    const uid = req.params.uid;
    try {
        await admin.auth().deleteUser(uid);
        res.json({ message: "Đã xóa tài khoản" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
