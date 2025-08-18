import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Thông tin cấu hình Firebase của bạn
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

// Theo dõi trạng thái đăng nhập
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        window.location.href = "./signin.html";
    }
});

// Đối tượng để lưu trữ tất cả user data từ form onboarding
const userProfile = {
    goals: [],
    height: 170,
    heightUnit: 'cm',
    weight: 70,
    weightUnit: 'kg',
    goalWeight: 65,
    goalWeightUnit: 'kg',
    sex: null,
    birthday: {
        day: null,
        month: null,
        year: null,
    },
    activityLevel: null,
};

// HÀM MỚI: Xử lý lưu profile vào Firebase
async function saveUserProfileToFirebase() {
    setError("");
    setSuccess("");

    if (!currentUser) {
        setError("Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
        return;
    }

    try {
        // Lấy tên (username) và giới tính
        const nameInput = $("profileName") ? $("profileName").value.trim() : "";
        const name = nameInput || (currentUser && currentUser.displayName) || "";
        const gender = $("profileGender") ? $("profileGender").value : "";

        // Tạo đối tượng dữ liệu để lưu vào Firestore
        const dataToSave = {
            email: currentUser.email,
            ...userProfile, // Thêm toàn bộ dữ liệu từ form đa bước
            name: name,
            gender: gender,
            updatedAt: new Date()
        };

        // Lưu toàn bộ thông tin vào Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDoc(userDocRef, dataToSave, { merge: true });

        setSuccess("Cập nhật thông tin thành công! Đang chuyển hướng...");
        // Chuyển hướng đến home.html sau 2 giây
        setTimeout(() => {
            window.location.href = "./home.html";
        }, 2000);

    } catch (e) {
        console.error("Lỗi khi lưu thông tin:", e);
        setError("Lỗi: " + e.message);
    }
}


// This script manages the multi-step user onboarding form
document.addEventListener('DOMContentLoaded', () => {
    
    let currentScreenIndex = 0;
    const screens = document.querySelectorAll('.container');
    const totalScreens = screens.length;
    
    // --- Helper Functions ---
    function showScreen(index) {
        screens.forEach((screen, i) => {
            screen.classList.toggle('active', i === index);
        });
        currentScreenIndex = index;
        updateProgressBar();
    }
    
    function updateProgressBar() {
        const progressBar = screens[currentScreenIndex].querySelector('.progress-bar');
        const progressText = screens[currentScreenIndex].querySelector('.progress-text');
        const progressPercentage = ((currentScreenIndex + 1) / totalScreens) * 100;

        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${currentScreenIndex + 1}/${totalScreens}`;
        }
    }
    
    function populateBirthdayDropdowns() {
        const daySelect = document.getElementById('day-select');
        const monthSelect = document.getElementById('month-select');
        const yearSelect = document.getElementById('year-select');

        // Populate days (1-31)
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            daySelect.appendChild(option);
        }

        // Populate months (1-12)
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        for (let i = 0; i < 12; i++) {
            const option = document.createElement('option');
            option.value = i + 1;
            option.textContent = monthNames[i];
            monthSelect.appendChild(option);
        }

        // Populate years (last 100 years)
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= currentYear - 100; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }
    }
    
    function calculateAge(birthday) {
        const today = new Date();
        const birthDate = new Date(birthday.year, birthday.month - 1, birthday.day);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    
    function calculateTDEE() {
        const { sex, weight, height, activityLevel, birthday } = userProfile;
        
        if (!sex || !weight || !height || !activityLevel || !birthday.year || !birthday.month || !birthday.day) {
            return null;
        }

        const weightKg = userProfile.weightUnit === 'lb' ? weight * 0.453592 : weight;
        const heightCm = userProfile.heightUnit === 'in' ? height * 2.54 : height;
        const age = calculateAge(birthday);

        let bmr;
        if (sex === 'male') {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
        }

        const activityMultipliers = {
            'sedentary': 1.2,
            'lightly-active': 1.375,
            'moderately-active': 1.55,
            'very-active': 1.725,
            'extra-active': 1.9,
        };

        const tdee = bmr * activityMultipliers[activityLevel];
        return Math.round(tdee);
    }
    
    // HÀM ĐÃ CHỈNH SỬA: Thêm nút Save và gắn sự kiện
    function showResultsModal() {
        const resultsContent = document.getElementById('results-content');
        const tdee = calculateTDEE();
        
        let goalsList = userProfile.goals.length > 0 ? userProfile.goals.map(goal => `<li>${goal.replace(/-/g, ' ')}</li>`).join('') : '<li>No goals selected</li>';

        resultsContent.innerHTML = `
            <ul class="list-unstyled space-y-2 text-start text-secondary">
                <li><strong>Goals:</strong></li>
                <ul class="list-unstyled mb-2">${goalsList}</ul>
                <li><strong>Height:</strong> ${userProfile.height} ${userProfile.heightUnit}</li>
                <li><strong>Current Weight:</strong> ${userProfile.weight} ${userProfile.weightUnit}</li>
                <li><strong>Goal Weight:</strong> ${userProfile.goalWeight} ${userProfile.goalWeightUnit}</li>
                <li><strong>Gender:</strong> ${userProfile.sex}</li>
                <li><strong>Birthday:</strong> ${userProfile.birthday.day}-${userProfile.birthday.month}-${userProfile.birthday.year}</li>
                <li><strong>Activity Level:</strong> ${userProfile.activityLevel.replace(/-/g, ' ')}</li>
                <li class="mt-3 fs-5 fw-bold text-dark">Your estimated TDEE is: <span class="text-primary">${tdee} kcal</span></li>
            </ul>
        `;

        const modalElement = document.getElementById('results-modal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Thêm một sự kiện mới để xử lý nút lưu
        const saveProfileBtnInModal = document.getElementById('saveProfileBtnInModal');
        if (saveProfileBtnInModal) {
            saveProfileBtnInModal.addEventListener('click', saveUserProfileToFirebase);
        }
    }

    // --- Event Listeners ---
    document.querySelectorAll('.continue-button').forEach(button => {
        button.addEventListener('click', () => {
            let canContinue = true;
            if (currentScreenIndex === 0 && userProfile.goals.length === 0) {
                alert('Please select at least one goal.');
                canContinue = false;
            } else if (currentScreenIndex === 4 && !userProfile.sex) {
                alert('Please select your sex.');
                canContinue = false;
            } else if (currentScreenIndex === 5 && (!userProfile.birthday.day || !userProfile.birthday.month || !userProfile.birthday.year)) {
                alert('Please enter your full birthday.');
                canContinue = false;
            } else if (currentScreenIndex === 6 && !userProfile.activityLevel) {
                alert('Please select your activity level.');
                canContinue = false;
            }

            if (canContinue && currentScreenIndex < screens.length - 1) {
                showScreen(currentScreenIndex + 1);
            } else if (canContinue && currentScreenIndex === screens.length - 1) {
                showResultsModal();
            }
        });
    });

    // Handle 'Back' button clicks
    document.querySelectorAll('.back-arrow').forEach(button => {
        button.addEventListener('click', () => {
            if (currentScreenIndex > 0) {
                showScreen(currentScreenIndex - 1);
            }
        });
    });

    // Handle goals selection (multiple choice)
    const goalsGrid = document.querySelector('.goals-grid');
    if (goalsGrid) {
        goalsGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.goal-card');
            if (card) {
                card.classList.toggle('selected');
                const goal = card.dataset.goal;
                const index = userProfile.goals.indexOf(goal);
                if (index > -1) {
                    userProfile.goals.splice(index, 1); // Remove if already selected
                } else {
                    userProfile.goals.push(goal); // Add if not selected
                }
            }
        });
    }

    // Handle height and weight input changes
    document.querySelectorAll('.height-input').forEach(input => {
        input.addEventListener('input', (e) => userProfile.height = parseFloat(e.target.value));
    });
    document.querySelectorAll('.weight-input').forEach(input => {
        input.addEventListener('input', (e) => userProfile.weight = parseFloat(e.target.value));
    });
    document.querySelectorAll('.goal-weight-input').forEach(input => {
        input.addEventListener('input', (e) => userProfile.goalWeight = parseFloat(e.target.value));
    });


    // Handle height and weight unit toggles
    document.querySelectorAll('.unit-cm').forEach(button => {
        button.addEventListener('click', (e) => {
            const container = e.target.closest('.container');
            container.querySelector('.unit-toggle .btn.active').classList.remove('active');
            e.target.classList.add('active');
            if (container.id.includes('height')) {
                userProfile.heightUnit = 'cm';
            } else {
                userProfile.weightUnit = 'kg';
            }
        });
    });
    document.querySelectorAll('.unit-in').forEach(button => {
        button.addEventListener('click', (e) => {
            const container = e.target.closest('.container');
            container.querySelector('.unit-toggle .btn.active').classList.remove('active');
            e.target.classList.add('active');
            if (container.id.includes('height')) {
                userProfile.heightUnit = 'in';
            }
        });
    });
    document.querySelectorAll('.unit-kg').forEach(button => {
        button.addEventListener('click', (e) => {
            const container = e.target.closest('.container');
            container.querySelector('.unit-toggle .btn.active').classList.remove('active');
            e.target.classList.add('active');
            if (container.id.includes('latest-weight')) {
                userProfile.weightUnit = 'kg';
            } else if (container.id.includes('goal-weight')) {
                userProfile.goalWeightUnit = 'kg';
            }
        });
    });
    document.querySelectorAll('.unit-lb').forEach(button => {
        button.addEventListener('click', (e) => {
            const container = e.target.closest('.container');
            container.querySelector('.unit-toggle .btn.active').classList.remove('active');
            e.target.classList.add('active');
            if (container.id.includes('latest-weight')) {
                userProfile.weightUnit = 'lb';
            } else if (container.id.includes('goal-weight')) {
                userProfile.goalWeightUnit = 'lb';
            }
        });
    });


    // Handle sex selection (single choice)
    const sexGrid = document.querySelector('.sex-selection-grid');
    if (sexGrid) {
        sexGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.sex-card');
            if (card) {
                // Clear all previous selections
                document.querySelectorAll('.sex-card').forEach(c => {
                    c.classList.remove('selected');
                });
                // Select the new card
                card.classList.add('selected');
                userProfile.sex = card.dataset.sex;
            }
        });
    }

    // Handle birthday dropdown changes
    const daySelect = document.getElementById('day-select');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    if (daySelect && monthSelect && yearSelect) {
        daySelect.addEventListener('change', (e) => userProfile.birthday.day = e.target.value);
        monthSelect.addEventListener('change', (e) => userProfile.birthday.month = e.target.value);
        yearSelect.addEventListener('change', (e) => userProfile.birthday.year = e.target.value);
        populateBirthdayDropdowns();
    }

    // Handle activity level selection (single choice)
    const activityList = document.querySelector('.activity-selection-list');
    if (activityList) {
        activityList.addEventListener('click', (event) => {
            const card = event.target.closest('.activity-card');
            if (card) {
                // Clear all previous selections
                document.querySelectorAll('.activity-card').forEach(c => {
                    c.classList.remove('selected');
                });
                // Select the new card
                card.classList.add('selected');
                userProfile.activityLevel = card.dataset.activity;
            }
        });
    }

    // Initialize the first screen
    showScreen(0);
});

