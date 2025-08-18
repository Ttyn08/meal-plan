document.addEventListener('DOMContentLoaded', function() {
    // --- Logic cho Sidebar Hamburger ---
    const sidebar = document.querySelector('.sidebar');
    const menuIcon = document.querySelector('.menu-icon');
    const appContainer = document.querySelector('.app-container');

    if (menuIcon && sidebar) {
        menuIcon.addEventListener('click', function(event) {
            event.stopPropagation(); // Ngăn sự kiện lan truyền lên body
            sidebar.classList.toggle('active');
            
            // Đóng sidebar khi click vào menu item hoặc vùng trắng của sidebar
            const sidebarLinks = sidebar.querySelectorAll('a');
            sidebarLinks.forEach(link => {
                link.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                });
            });
        });

        // Đóng sidebar khi click ra ngoài trên màn hình nhỏ
        document.body.addEventListener('click', function(event) {
            // Kiểm tra kích thước màn hình
            if (window.innerWidth <= 1024) { 
                if (!sidebar.contains(event.target) && !menuIcon.contains(event.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    // --- Logic chuyển hướng cho nút 'Create' ---
    const createPlanBtn = document.getElementById('create-plan-btn');

    if (createPlanBtn) {
        createPlanBtn.addEventListener('click', function() {
            // Chuyển hướng người dùng đến trang tạo kế hoạch
            window.location.href = 'create_plan.html';
        });
    }

    // --- Logic cho tất cả các Carousel ---
    const carousels = document.querySelectorAll('.recipe-carousel');

    carousels.forEach(carousel => {
        // Tìm các phần tử liên quan đến carousel hiện tại
        const carouselWrapper = carousel.closest('.carousel-wrapper');
        const carouselContainer = carousel.closest('.carousel-container');
        const prevBtn = carouselContainer.querySelector('.prev-btn');
        const nextBtn = carouselContainer.querySelector('.next-btn');
        
        // Đảm bảo các phần tử tồn tại trước khi thêm sự kiện
        if (!prevBtn || !nextBtn) {
            console.error('Carousel buttons not found for a carousel.');
            return;
        }

        const scrollCarousel = (direction) => {
            const card = carousel.querySelector('.card');
            if (!card) return;
            
            const cardWidth = card.offsetWidth;
            const gap = 20; 
            const scrollAmount = cardWidth + gap;

            if (direction === 'next') {
                carousel.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            } else if (direction === 'prev') {
                carousel.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            }
        };
        
        const checkScrollPosition = () => {
            if (!carousel || !carouselWrapper || !prevBtn || !nextBtn) return;

            const tolerance = 5; 
            const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - tolerance;
            const isAtStart = carousel.scrollLeft <= tolerance;
            const isScrollable = carousel.scrollWidth > carousel.clientWidth;

            // Hiển thị/ẩn các nút điều hướng và hiệu ứng mờ chỉ khi có thể cuộn
            prevBtn.style.display = (isAtStart || !isScrollable) ? 'none' : 'flex';
            nextBtn.style.display = (isAtEnd || !isScrollable) ? 'none' : 'flex';
            
            // Xử lý hiệu ứng mờ khi ở cuối carousel
            if (isAtEnd || !isScrollable) {
                carouselWrapper.classList.add('end-reached');
            } else {
                carouselWrapper.classList.remove('end-reached');
            }
        };

        // Gắn sự kiện click cho các nút của carousel hiện tại
        nextBtn.addEventListener('click', () => {
            scrollCarousel('next');
            // Chờ một chút để cuộn xong rồi kiểm tra lại vị trí
            setTimeout(checkScrollPosition, 300);
        });
        
        prevBtn.addEventListener('click', () => {
            scrollCarousel('prev');
            // Chờ một chút để cuộn xong rồi kiểm tra lại vị trí
            setTimeout(checkScrollPosition, 300);
        });

        // Gắn event listener cho sự kiện cuộn và resize
        carousel.addEventListener('scroll', checkScrollPosition);
        window.addEventListener('resize', checkScrollPosition);
        
        // Chạy lần đầu tiên để thiết lập trạng thái ban đầu
        checkScrollPosition();
    });
});