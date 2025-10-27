// General dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initNavigation();
    initUserDropdown();
    checkAuthStatus();
});

function initDashboard() {
    // Initialize dashboard based on user role
    const user = auth.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user display
    updateUserDisplay(user);
    
    // Show appropriate dashboard
    const userRole = user.role;
    if (window.location.pathname.includes('patient-dashboard') && userRole !== 'patient') {
        redirectToDashboard(userRole);
    } else if (window.location.pathname.includes('doctor-dashboard') && userRole !== 'doctor') {
        redirectToDashboard(userRole);
    } else if (window.location.pathname.includes('admin-dashboard') && userRole !== 'admin') {
        redirectToDashboard(userRole);
    }
}

function redirectToDashboard(role) {
    const dashboardUrls = {
        'patient': 'patient-dashboard.html',
        'doctor': 'doctor-dashboard.html',
        'admin': 'admin-dashboard.html'
    };
    
    if (dashboardUrls[role]) {
        window.location.href = dashboardUrls[role];
    }
}

function updateUserDisplay(user) {
    // Update user name in navigation
    const userNameElements = document.querySelectorAll('.user-name, .user-display-name');
    userNameElements.forEach(element => {
        element.textContent = user.fullName || user.email;
    });
    
    // Update user avatar
    const userAvatars = document.querySelectorAll('.user-avatar');
    userAvatars.forEach(avatar => {
        const initials = getUserInitials(user.fullName || user.email);
        avatar.textContent = initials;
    });
}

function getUserInitials(fullName) {
    return fullName
        .split(' ')
        .map(name => name.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function initNavigation() {
    // Handle sidebar navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    console.log('Dashboard.js - Init navigation, found nav items:', navItems.length);
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const section = item.dataset.section;
            
            // If item has data-section, prevent default and show section
            if (section) {
                e.preventDefault();
                console.log('Dashboard.js - Clicked section:', section);
                showSection(section);
                setActiveNavItem(item);
            }
            // Otherwise, let the link navigate normally (for profile.html, etc)
        });
    });
    
    // Handle URL hash for direct section access
    const hash = window.location.hash.slice(1);
    console.log('Dashboard.js - Current hash:', hash);
    if (hash) {
        showSection(hash);
        const activeItem = document.querySelector(`[data-section="${hash}"]`);
        if (activeItem) {
            setActiveNavItem(activeItem);
        }
    }
}

function showSection(sectionId) {
    console.log('Dashboard.js - showSection called for:', sectionId);
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    console.log('Dashboard.js - Found sections:', sections.length);
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    console.log('Dashboard.js - Target section found:', !!targetSection);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Dashboard.js - Section activated:', sectionId);
        
        // Update URL hash
        window.location.hash = sectionId;
        
        // Load section data if needed
        loadSectionData(sectionId);
    } else {
        console.error('Dashboard.js - Section not found:', sectionId);
    }
}

function setActiveNavItem(activeItem) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    activeItem.classList.add('active');
}

function loadSectionData(sectionId) {
    // Load data based on section
    switch (sectionId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'doctors':
            loadDoctors();
            break;
        case 'medical-records':
            loadMedicalRecords();
            break;
        case 'prescriptions':
            loadPrescriptions();
            break;
        case 'health-tracking':
            loadHealthTracking();
            break;
        default:
            break;
    }
}

function initUserDropdown() {
    const dropdownToggle = document.getElementById('userDropdown');
    if (!dropdownToggle) return;
    
    const dropdown = dropdownToggle.closest('.dropdown');
    
    // Click avatar to toggle
    dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.classList.toggle('show');
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !e.target.closest('.dropdown-toggle')) {
            dropdown.classList.remove('show');
        }
    });
}

function checkAuthStatus() {
    // Check if user is still authenticated
    const token = authService.getToken();
    if (!token) {
        logout();
        return;
    }
    
    // Verify token validity periodically
    setInterval(async () => {
        try {
            const response = await apiService.verifyToken();
            if (!response.success) {
                logout();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            logout();
        }
    }, 5 * 60 * 1000); // Check every 5 minutes
}

// Global functions for dashboard actions
window.showProfile = function() {
    showSection('profile');
};

window.showSettings = function() {
    showSection('settings');
};

window.logout = function() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        authService.logout();
        window.location.href = 'login.html';
    }
};

// Common data loading functions
async function loadOverviewData() {
    try {
        showLoading('overview');
        
        // Load overview statistics
        const stats = await apiService.getDashboardStats();
        updateOverviewStats(stats);
        
        // Load recent activity
        const activity = await apiService.getRecentActivity();
        updateRecentActivity(activity);
        
    } catch (error) {
        console.error('Failed to load overview data:', error);
        showError('overview', 'Không thể tải dữ liệu tổng quan');
    }
}

function updateOverviewStats(stats) {
    // Update stat cards
    const statElements = {
        'upcomingAppointments': stats.upcomingAppointments || 0,
        'totalRecords': stats.totalRecords || 0,
        'activePrescriptions': stats.activePrescriptions || 0,
        'followingDoctors': stats.followingDoctors || 0
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            animateNumber(element, 0, value, 1000);
        }
    });
}

function updateRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    if (!container || !activities?.length) return;
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p><strong>${activity.title}</strong> ${activity.description}</p>
                <span class="activity-time">${utils.formatTimeAgo(activity.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const range = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (range * easedProgress));
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function showLoading(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const loadingHtml = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Đang tải dữ liệu...
        </div>
    `;
    
    // Find content containers and show loading
    const containers = section.querySelectorAll('.appointments-container, .doctors-grid, .records-container, .prescriptions-container');
    containers.forEach(container => {
        container.innerHTML = loadingHtml;
    });
}

function showError(sectionId, message) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const errorHtml = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
    
    // Find content containers and show error
    const containers = section.querySelectorAll('.appointments-container, .doctors-grid, .records-container, .prescriptions-container');
    containers.forEach(container => {
        container.innerHTML = errorHtml;
    });
}

// Common modal functions
function showModal(modalHtml) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;
    
    modalContainer.innerHTML = modalHtml;
    const modal = modalContainer.querySelector('.modal');
    
    if (modal) {
        modal.classList.add('show');
        
        // Close modal handlers
        const closeButtons = modal.querySelectorAll('.modal-close, .btn-cancel');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', handleModalEscape);
    }
}

function closeModal() {
    const modal = document.querySelector('.modal.show');
    if (modal) {
        modal.classList.remove('show');
        document.removeEventListener('keydown', handleModalEscape);
        
        setTimeout(() => {
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) {
                modalContainer.innerHTML = '';
            }
        }, 300);
    }
}

function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

// Format utilities
function formatDate(date) {
    return new Date(date).toLocaleDateString('vi-VN');
}

function formatTime(date) {
    return new Date(date).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(date) {
    return `${formatDate(date)} ${formatTime(date)}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Export functions for use in other dashboard files
window.dashboardUtils = {
    showSection,
    showModal,
    closeModal,
    showLoading,
    showError,
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    animateNumber
};