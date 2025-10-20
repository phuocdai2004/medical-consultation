// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const alertContainer = document.getElementById('alertContainer');
    
    // Demo accounts functionality
    initDemoAccounts();
    
    // Password toggle functionality
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Remember me functionality
    const rememberMe = document.getElementById('rememberMe');
    const emailInput = document.getElementById('email');
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberMe) {
            rememberMe.checked = true;
        }
    }
    
    // Auto-focus first empty field
    const firstEmptyField = loginForm.querySelector('input:not([value]):not([type="checkbox"])');
    if (firstEmptyField) {
        firstEmptyField.focus();
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const loginBtn = document.getElementById('loginBtn');
    const alertContainer = document.getElementById('alertContainer');
    const formData = new FormData(event.target);
    
    const credentials = {
        email: formData.get('email').trim(),
        password: formData.get('password')
    };
    
    // Client-side validation
    if (!validateLoginForm(credentials)) {
        return;
    }
    
    try {
        // Show loading state
        utils.showLoading(loginBtn);
        
        // Clear previous alerts
        alertContainer.innerHTML = '';
        
        // Call login API
        const response = await auth.login(credentials);
        
        if (response.success) {
            // Handle remember me
            const rememberMe = document.getElementById('rememberMe');
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem('rememberedEmail', credentials.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Show success message
            utils.showAlert(alertContainer, 'Đăng nhập thành công! Đang chuyển hướng...', 'success');
            
            // Redirect based on user role
            setTimeout(() => {
                redirectAfterLogin(response.data.user);
            }, 1500);
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // Show error message
        const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        utils.showAlert(alertContainer, errorMessage, 'error');
        
        // Handle specific error cases
        if (error.message.includes('Invalid email or password')) {
            utils.showAlert(alertContainer, 'Email hoặc mật khẩu không chính xác.', 'error');
        } else if (error.message.includes('deactivated')) {
            utils.showAlert(alertContainer, 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.', 'error');
        } else if (error.message.includes('verification')) {
            utils.showAlert(alertContainer, 'Tài khoản chưa được xác minh. Vui lòng kiểm tra email.', 'warning');
        }
    } finally {
        // Hide loading state
        utils.hideLoading(loginBtn);
    }
}

function validateLoginForm(credentials) {
    const errors = [];
    
    // Email validation
    if (!credentials.email) {
        errors.push({ field: 'email', message: 'Email là bắt buộc' });
    } else if (!utils.validateEmail(credentials.email)) {
        errors.push({ field: 'email', message: 'Email không hợp lệ' });
    }
    
    // Password validation
    if (!credentials.password) {
        errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc' });
    } else if (credentials.password.length < 6) {
        errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    // Display errors
    if (errors.length > 0) {
        displayValidationErrors(errors);
        return false;
    }
    
    // Clear any existing errors
    clearValidationErrors();
    return true;
}

function displayValidationErrors(errors) {
    // Clear previous errors
    clearValidationErrors();
    
    errors.forEach(error => {
        const field = document.getElementById(error.field);
        const errorElement = document.getElementById(`${error.field}Error`);
        
        if (field) {
            field.classList.add('error');
        }
        
        if (errorElement) {
            errorElement.textContent = error.message;
        }
    });
}

function clearValidationErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(element => {
        element.textContent = '';
    });
    
    const inputElements = document.querySelectorAll('.form-input');
    inputElements.forEach(element => {
        element.classList.remove('error');
    });
}

function redirectAfterLogin(user) {
    // Get intended destination from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    if (redirect) {
        window.location.href = decodeURIComponent(redirect);
        return;
    }
    
    // Default redirect based on user role
    switch (user.role) {
        case 'admin':
            window.location.href = '/pages/admin/dashboard.html';
            break;
        case 'doctor':
            window.location.href = '/pages/doctor/dashboard.html';
            break;
        case 'patient':
            window.location.href = '/pages/patient/dashboard.html';
            break;
        default:
            window.location.href = '/pages/dashboard.html';
    }
}

function initDemoAccounts() {
    const demoToggle = document.getElementById('demoToggle');
    const demoContent = document.getElementById('demoContent');
    const demoAccounts = document.querySelectorAll('.demo-account');
    
    if (demoToggle && demoContent) {
        demoToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            demoContent.classList.toggle('hidden');
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.demo-accounts')) {
                demoContent.classList.add('hidden');
            }
        });
    }
    
    // Demo account selection
    demoAccounts.forEach(account => {
        account.addEventListener('click', () => {
            const email = account.getAttribute('data-email');
            const password = account.getAttribute('data-password');
            
            // Fill in the form
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (emailInput && passwordInput) {
                emailInput.value = email;
                passwordInput.value = password;
                
                // Close demo panel
                demoContent.classList.add('hidden');
                
                // Show notification
                utils.showNotification(`Đã điền thông tin tài khoản demo: ${email}`, 'info');
            }
        });
    });
}

// Real-time validation
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            validateField('email', emailInput.value.trim());
        });
        
        emailInput.addEventListener('input', () => {
            if (emailInput.classList.contains('error')) {
                validateField('email', emailInput.value.trim());
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', () => {
            validateField('password', passwordInput.value);
        });
        
        passwordInput.addEventListener('input', () => {
            if (passwordInput.classList.contains('error')) {
                validateField('password', passwordInput.value);
            }
        });
    }
});

function validateField(fieldName, value) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    let error = '';
    
    switch (fieldName) {
        case 'email':
            if (!value) {
                error = 'Email là bắt buộc';
            } else if (!utils.validateEmail(value)) {
                error = 'Email không hợp lệ';
            }
            break;
            
        case 'password':
            if (!value) {
                error = 'Mật khẩu là bắt buộc';
            } else if (value.length < 6) {
                error = 'Mật khẩu phải có ít nhất 6 ký tự';
            }
            break;
    }
    
    if (error) {
        field.classList.add('error');
        errorElement.textContent = error;
    } else {
        field.classList.remove('error');
        errorElement.textContent = '';
    }
}

// Check if user is already logged in
if (auth.isAuthenticated()) {
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
        redirectAfterLogin(currentUser);
    }
}