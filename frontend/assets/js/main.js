// Main JavaScript file for common functionality

// API Configuration - Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const BACKEND_URL = isProduction 
  ? 'https://medical-consultation-backend.onrender.com'
  : 'http://localhost:8000';

// Global variables
window.API_BASE_URL = `${BACKEND_URL}/api`;
window.currentUser = null;
window.authToken = localStorage.getItem('authToken');

console.log('🌐 Environment:', isProduction ? 'Production' : 'Development');
console.log('🔗 API Base URL:', window.API_BASE_URL);

// Utility functions
const utils = {
    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" type="button">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    },
    
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },
    
    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        return new Intl.DateTimeFormat('vi-VN', {...defaultOptions, ...options}).format(new Date(date));
    },
    
    // Format time
    formatTime(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },
    
    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validate phone
    validatePhone(phone) {
        const re = /^[0-9]{10,11}$/;
        return re.test(phone.replace(/\s/g, ''));
    },
    
    // Show loading state
    showLoading(element) {
        const btnText = element.querySelector('.btn-text');
        const btnLoading = element.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
        }
        
        element.disabled = true;
    },
    
    // Hide loading state
    hideLoading(element) {
        const btnText = element.querySelector('.btn-text');
        const btnLoading = element.querySelector('.btn-loading');
        
        if (btnText && btnLoading) {
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
        
        element.disabled = false;
    },
    
    // Show alert in container
    showAlert(container, message, type = 'error') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Remove existing alerts
        const existingAlerts = container.querySelectorAll('.alert');
        existingAlerts.forEach(existing => existing.remove());
        
        container.appendChild(alert);
        
        // Auto remove after 5 seconds for non-error alerts
        if (type !== 'error') {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 5000);
        }
    },
    
    // Clear form errors
    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.form-error');
        errorElements.forEach(error => {
            error.textContent = '';
        });
        
        const inputElements = form.querySelectorAll('.form-input, .form-select, .form-textarea');
        inputElements.forEach(input => {
            input.classList.remove('error');
        });
    },
    
    // Show form errors
    showFormErrors(form, errors) {
        this.clearFormErrors(form);
        
        errors.forEach(error => {
            const field = error.path || error.param;
            const input = form.querySelector(`[name="${field}"]`);
            const errorElement = form.querySelector(`#${field}Error`);
            
            if (input) {
                input.classList.add('error');
            }
            
            if (errorElement) {
                errorElement.textContent = error.message || error.msg;
            }
        });
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// API service
const api = {
    // Base request method
    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Add auth token if available
        if (window.authToken) {
            config.headers.Authorization = `Bearer ${window.authToken}`;
        }
        
        try {
            const response = await fetch(`${window.API_BASE_URL}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// Auth service
const auth = {
    // Login
    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);
            
            if (response.success) {
                // Store token and user data
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                window.authToken = response.data.token;
                window.currentUser = response.data.user;
                
                return response;
            }
            
            throw new Error(response.message);
        } catch (error) {
            throw error;
        }
    },
    
    // Register
    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            
            if (response.success) {
                // Store token and user data
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('currentUser', JSON.stringify(response.data.user));
                window.authToken = response.data.token;
                window.currentUser = response.data.user;
                
                return response;
            }
            
            throw new Error(response.message);
        } catch (error) {
            throw error;
        }
    },
    
    // Logout
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.authToken = null;
        window.currentUser = null;
        
        // Redirect to login page
        window.location.href = '/pages/login.html';
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!window.authToken && !!window.currentUser;
    },
    
    // Get current user
    getCurrentUser() {
        if (!window.currentUser) {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                window.currentUser = JSON.parse(userData);
            }
        }
        return window.currentUser;
    },
    
    // Forgot password
    async forgotPassword(email) {
        return api.post('/auth/forgot-password', { email });
    },
    
    // Reset password
    async resetPassword(token, password) {
        return api.post(`/auth/reset-password/${token}`, { password });
    }
};

// Navigation functionality
const navigation = {
    init() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
        
        // Close menu when clicking on links (mobile)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu) {
                    navMenu.classList.remove('active');
                }
                if (navToggle) {
                    navToggle.classList.remove('active');
                }
            });
        });
        
        // Update navigation based on auth status
        this.updateNavigation();
    },
    
    updateNavigation() {
        const navAuth = document.querySelector('.nav-auth');
        const currentUser = auth.getCurrentUser();
        
        if (navAuth && currentUser) {
            navAuth.innerHTML = `
                <div class="user-menu">
                    <button class="user-toggle" id="userToggle">
                        <div class="user-avatar">
                            ${currentUser.avatar ? 
                                `<img src="${currentUser.avatar}" alt="Avatar">` : 
                                `<i class="fas fa-user"></i>`
                            }
                        </div>
                        <span>${currentUser.fullName}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="user-dropdown hidden" id="userDropdown">
                        <a href="/pages/${currentUser.role}-dashboard.html" class="dropdown-item">
                            <i class="fas fa-tachometer-alt"></i>
                            Dashboard
                        </a>
                        <a href="#" class="dropdown-item" onclick="showProfile()">
                            <i class="fas fa-user-cog"></i>
                            Hồ sơ
                        </a>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item logout-btn" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            Đăng xuất
                        </button>
                    </div>
                </div>
            `;
            
            // Add dropdown functionality
            this.initUserDropdown();
        }
    },
    
    initUserDropdown() {
        const userToggle = document.getElementById('userToggle');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (userToggle && userDropdown) {
            userToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.add('hidden');
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.logout();
            });
        }
    }
};

// Animation utilities
const animations = {
    // Animate elements on scroll
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);
        
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(el => observer.observe(el));
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    navigation.init();
    
    // Initialize scroll animations
    animations.initScrollAnimations();
    
    // Initialize current user from localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        window.currentUser = JSON.parse(userData);
    }
    
    // Add notification styles if not exist
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                min-width: 300px;
                padding: 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                transform: translateX(400px);
                transition: transform 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification-success {
                background: #ecfdf5;
                border: 1px solid #10b981;
                color: #065f46;
            }
            
            .notification-error {
                background: #fef2f2;
                border: 1px solid #ef4444;
                color: #991b1b;
            }
            
            .notification-warning {
                background: #fffbeb;
                border: 1px solid #f59e0b;
                color: #92400e;
            }
            
            .notification-info {
                background: #eff6ff;
                border: 1px solid #3b82f6;
                color: #1e40af;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex: 1;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 0.25rem;
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
            
            .user-menu {
                position: relative;
            }
            
            .user-toggle {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.5rem;
                transition: background 0.3s ease;
            }
            
            .user-toggle:hover {
                background: rgba(0, 0, 0, 0.05);
            }
            
            .user-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--primary-color);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                overflow: hidden;
            }
            
            .user-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .user-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 0.5rem;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                border: 1px solid #e5e7eb;
                min-width: 200px;
                z-index: 1000;
            }
            
            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                color: #374151;
                text-decoration: none;
                transition: background 0.3s ease;
                border: none;
                background: none;
                width: 100%;
                cursor: pointer;
                font-size: 0.875rem;
            }
            
            .dropdown-item:hover {
                background: #f3f4f6;
            }
            
            .dropdown-divider {
                height: 1px;
                background: #e5e7eb;
                margin: 0.5rem 0;
            }
        `;
        document.head.appendChild(style);
    }
});

// Export utilities for use in other files
window.utils = utils;
window.api = api;
window.auth = auth;