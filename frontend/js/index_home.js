// JavaScript cho hiệu ứng fade-in khi cuộn trang
const sections = document.querySelectorAll('.fade-in-section');

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15 // Phần trăm phần tử hiển thị trong viewport để kích hoạt
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Nếu phần tử đang đi vào khung nhìn
            entry.target.classList.add('is-visible');
            // Bỏ dòng observer.unobserve(entry.target);
            // để hiệu ứng có thể lặp lại
        } else {
            // Nếu phần tử đang rời khỏi khung nhìn
            entry.target.classList.remove('is-visible');
        }
    });
}, observerOptions);

sections.forEach(section => {
    observer.observe(section);
});

// --- MÃ MỚI: TỰ ĐỘNG THAY ĐỔI ẢNH NỀN HERO SECTION ---

// 1. Lấy phần tử hero
const heroElement = document.getElementById('hero');

// 2. Tạo một danh sách (array) chứa 5 URL ảnh
const backgroundImages = [
    './image/home/photo-1.jfif', 
    './image/home/photo-2.jpg', 
    './image/home/photo-3.jfif', 
    './image/home/photo-4.jfif', 
    './image/home/photo-5.jfif'  
];

// 3. Biến để theo dõi ảnh hiện tại
let currentImageIndex = 0;

// 4. Đặt một chu kỳ lặp lại cứ sau 3 giây
setInterval(() => {
    // Tăng chỉ số của ảnh, và quay về 0 nếu hết danh sách
    currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
    
    // Cập nhật lại thuộc tính background-image của hero
    heroElement.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('${backgroundImages[currentImageIndex]}')`;

}, 8000);

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