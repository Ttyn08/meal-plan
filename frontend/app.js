import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    verifyPasswordResetCode,
    confirmPasswordReset,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDf9M8kB7LvuCfX6XbDo3JAOuXJsuRXdQI",
    authDomain: "foodorithm-3de40.firebaseapp.com",
    projectId: "foodorithm-3de40",
    storageBucket: "foodorithm-3de40.firebasestorage.app",
    messagingSenderId: "649166728660",
    appId: "1:649166728660:web:8207f77977fa95fc3b7a41"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper DOM
const $ = (id) => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (el) el.textContent = text || ""; };
const setError = (msg) => setText("error", msg);
const setSuccess = (msg) => setText("success", msg);

// 1) Đăng ký
const registerBtn = $("registerBtn");
if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
        setError("");
        setSuccess("");

        const user_name = $("user_name").value.trim();
        const email = $("email").value.trim();
        const password = $("password").value;

        if (!user_name || !email || !password) {
            setError("Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự.");
            return;
        }

        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: user_name });
            setSuccess(`Đăng ký thành công: ${cred.user.displayName}`);
            setTimeout(() => {
                window.location.href = "./signin.html";
            }, 1000);
        } catch (e) {
            let message = "";
            switch (e.code) {
                case "auth/email-already-in-use":
                    message = "Email này đã được đăng ký. Vui lòng dùng email khác.";
                    break;
                case "auth/invalid-email":
                    message = "Địa chỉ email không hợp lệ.";
                    break;
                case "auth/weak-password":
                    message = "Mật khẩu quá yếu. Vui lòng nhập ít nhất 6 ký tự.";
                    break;
                default:
                    message = e.message;
            }
            setError(message);
        }
    });
}

// 2) Đăng nhập / Đăng xuất
const loginBtn = $("loginBtn");
if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        setError(""); 
        setSuccess("");
        const email = $("email").value.trim();
        const password = $("password").value;
        if (!email || !password) { 
            setError("Vui lòng nhập email và mật khẩu."); 
            return; 
        }
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            setSuccess(`Đăng nhập thành công: ${cred.user.email}`);

            // Kiểm tra thông tin profile
            const userDocRef = doc(db, "users", cred.user.uid);
            const docSnap = await getDoc(userDocRef);

            if (!docSnap.exists() || !docSnap.data().height || !docSnap.data().weight || !docSnap.data().sex) {
                window.location.href = "./set_profile.html";
            } else {
                window.location.href = "./home.html";
            }
        } catch (e) {
            console.error("Firebase login error:", e.code, e.message);
            let message = "";
            switch (e.code) {
                case "auth/invalid-credential":
                case "auth/wrong-password":
                    message = "Sai email hoặc mật khẩu.";
                    break;
                case "auth/user-not-found":
                    message = "Tài khoản không tồn tại.";
                    break;
                case "auth/invalid-email":
                    message = "Địa chỉ email không hợp lệ.";
                    break;
                default:
                    message = "Lỗi đăng nhập: " + e.message;
            }
            setError(message);
        }
    });
}

const logoutBtn = $("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        setError(""); 
        setSuccess("");
        try { 
            await signOut(auth); 
            setSuccess("Đã đăng xuất."); 
        } catch (e) { 
            setError(e.message); 
        }
    });
}

// 3) Gửi email reset
const forgotBtn = $("forgotBtn");
if (forgotBtn) {
    forgotBtn.addEventListener("click", async () => {
        setError(""); setSuccess("");
        const email = $("email").value.trim();
        if (!email) { setError("Vui lòng nhập email."); return; }
        try {
            const url = `${window.location.origin}/reset.html`;
            await sendPasswordResetEmail(auth, email, { url, handleCodeInApp: true });
            setSuccess("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
        } catch (e) {
            setError(e.message);
        }
    });
}

// 4) Trang reset.html: xử lý đổi mật khẩu
const resetBtn = $("resetBtn");
if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
        setError(""); setSuccess("");
        const params = new URLSearchParams(window.location.search);
        const oobCode = params.get("oobCode");
        const newPassword = $("newPassword").value;
        const confirmPassword = $("confirmPassword").value;

        if (!oobCode) { setError("Thiếu oobCode từ email link."); return; }
        if (!newPassword || newPassword !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp."); return;
        }

        try {
            await verifyPasswordResetCode(auth, oobCode);
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccess("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
        } catch (e) {
            setError(e.message);
        }
    });
}

// 5) Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, async (user) => {
    setText("authState", user ? "Đã đăng nhập" : "Chưa đăng nhập");
    setText("userInfo", user ? `${user.email}` : "—");

    if (user && window.location.pathname.endsWith("signin.html")) {
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log("/api/profile:", data);
            }
        } catch (err) {
            console.warn("Gọi /api/profile thất bại:", err);
        }
    }
});
