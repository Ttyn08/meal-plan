// navbar
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mainNavbar = document.getElementById('main-navbar');

    if (mobileMenu && mainNavbar) {
        mobileMenu.addEventListener('click', function() {
            // Toggle class 'active' cho icon menu
            mobileMenu.classList.toggle('active');
            // Toggle class 'active' cho navbar
            mainNavbar.classList.toggle('active');
        });

        // Đóng menu khi nhấp vào một liên kết (tùy chọn)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mainNavbar.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    mainNavbar.classList.remove('active');
                }
            });
        });
    }
});




const genderRadios = document.querySelectorAll('input[name="gender"]');
const femaleOptionsDiv = document.getElementById('female-options');

// Thêm sự kiện để hiển thị/ẩn mục chọn tình trạng của phụ nữ
genderRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'female') {
            femaleOptionsDiv.style.display = 'block';
        } else {
            femaleOptionsDiv.style.display = 'none';
        }
    });
});

document.getElementById('calorie-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const resultsDiv = document.getElementById('results');
    const mainFooter = document.getElementById('main-footer'); // Lấy tham chiếu đến footer
    
    resultsDiv.style.display = 'block';

    const gender = document.querySelector('input[name="gender"]:checked').value;
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const activityMultiplier = parseFloat(document.getElementById('activity').value);
    
    let additionalCalories = 0;
    let isSpecialCondition = false;
    if (gender === 'female') {
        const femaleStatus = parseInt(document.getElementById('female-status').value);
        if (femaleStatus > 0) {
            additionalCalories = femaleStatus;
            isSpecialCondition = true;
        }
    }

    let bmr;
    if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Tính TDEE cơ bản và cộng thêm calo nếu có tình trạng đặc biệt
    const baseTdee = bmr * activityMultiplier;
    const totalTdee = Math.round(baseTdee + additionalCalories);
    
    const breakfastCals = `${Math.round(totalTdee * 0.25)} - ${Math.round(totalTdee * 0.30)}`;
    const lunchCals = `${Math.round(totalTdee * 0.30)} - ${Math.round(totalTdee * 0.35)}`;
    const dinnerCals = `${Math.round(totalTdee * 0.25)} - ${Math.round(totalTdee * 0.30)}`;
    const snacksCals = `${Math.round(totalTdee * 0.05)} - ${Math.round(totalTdee * 0.10)}`;

    let resultHTML = `
        <h2>Kết Quả Tính Toán</h2>
        <p>Lượng calo tối thiểu (BMR): <span>${Math.round(bmr)} calo/ngày</span></p>
        <hr class="line">
        <p class="style-total-calor">Tổng lượng calo bạn cần để duy trì sức khỏe hiện tại là: <span>${totalTdee} calo/ngày</span></p>
    `;

    if (isSpecialCondition) {
        resultHTML += `
            <div class="warning-note">
                <strong>Lưu ý:</strong> Việc thay đổi cân nặng trong giai đoạn mang thai hoặc cho con bú cần được theo dõi chặt chẽ bởi bác sĩ. Các con số trên chỉ nhằm mục đích cung cấp đủ năng lượng cho sức khỏe của mẹ và bé.
            </div>
        `;
    } else {
        const loseWeightCalories = totalTdee - 500;
        const gainWeightCalories = totalTdee + 500;
        resultHTML += `
            <p>Để <strong>GIẢM CÂN</strong> (khoảng 0.5kg/tuần), bạn nên nạp: <span>${loseWeightCalories} calo/ngày</span></p>
            <p>Để <strong>TĂNG CÂN</strong> (khoảng 0.5kg/tuần), bạn nên nạp: <span>${gainWeightCalories} calo/ngày</span></p>
        `;
    }

    resultHTML += `
        <div class="meal-plan">
            <h3>Gợi ý phân bổ calo hàng ngày:</h3>
            <p> - Bữa sáng: <span>${breakfastCals} calo</span></p>
            <p> - Bữa trưa: <span>${lunchCals} calo</span></p>
            <p> - Bữa tối: <span>${dinnerCals} calo</span></p>
            <p> - Bữa phụ: <span>${snacksCals} calo</span></p>
        </div>
    `;
    
    resultsDiv.innerHTML = resultHTML;

    // Hiển thị footer sau khi kết quả được tính toán
    if (mainFooter) {
        mainFooter.style.display = 'block';
    }
});




