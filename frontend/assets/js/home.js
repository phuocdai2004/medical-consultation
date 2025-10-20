// Home page functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update UI based on login status
    updateNavigationUI(token, user);
    
    // Add smooth scroll for anchor links
    addSmoothScroll();
    
    // Add animation on scroll
    addScrollAnimations();
});

// Update navigation based on user login status
function updateNavigationUI(token, user) {
    const authButtons = document.querySelector('.auth-buttons');
    
    if (token && user.role) {
        // User is logged in
        if (authButtons) {
            authButtons.innerHTML = `
                <span class="user-info">Xin chào, ${user.fullName || user.email}</span>
                <a href="pages/${user.role}-dashboard.html" class="btn btn-primary">Dashboard</a>
                <button onclick="logout()" class="btn btn-secondary">Đăng xuất</button>
            `;
        }
    } else {
        // User is not logged in
        if (authButtons) {
            authButtons.innerHTML = `
                <a href="pages/login.html" class="btn btn-primary">Đăng nhập</a>
                <a href="pages/register.html" class="btn btn-secondary">Đăng ký</a>
            `;
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Smooth scroll for anchor links
function addSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add animations on scroll
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation class
    document.querySelectorAll('.feature-card, .service-item, .testimonial').forEach(el => {
        observer.observe(el);
    });
}

// Feature cards interactivity
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// CTA buttons
const ctaButtons = document.querySelectorAll('.cta-button');
ctaButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        const token = localStorage.getItem('token');
        if (!token) {
            e.preventDefault();
            window.location.href = 'pages/register.html';
        }
    });
});
