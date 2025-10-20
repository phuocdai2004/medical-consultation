// Common authentication functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize password toggles
    initPasswordToggles();
    
    // Initialize form validation
    initFormValidation();
    
    // Initialize social login buttons
    initSocialLogin();
});

function initPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.previousElementSibling;
            const icon = toggle.querySelector('i');
            
            if (input && input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                toggle.setAttribute('title', 'Ẩn mật khẩu');
            } else if (input) {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                toggle.setAttribute('title', 'Hiển thị mật khẩu');
            }
        });
    });
}

function initFormValidation() {
    const forms = document.querySelectorAll('.auth-form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            // Real-time validation on blur
            input.addEventListener('blur', () => {
                validateField(input);
            });
            
            // Clear errors on input if field was previously invalid
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    validateField(input);
                }
            });
        });
    });
}

function validateField(field) {
    const name = field.name;
    const value = field.value.trim();
    const errorElement = document.getElementById(`${name}Error`);
    
    let error = '';
    
    // Common validations
    if (field.hasAttribute('required') && !value) {
        error = `${getFieldLabel(name)} là bắt buộc`;
    } else {
        // Specific validations
        switch (name) {
            case 'email':
                if (value && !utils.validateEmail(value)) {
                    error = 'Email không hợp lệ';
                }
                break;
                
            case 'password':
                if (value && value.length < 6) {
                    error = 'Mật khẩu phải có ít nhất 6 ký tự';
                }
                break;
                
            case 'phone':
                if (value && !utils.validatePhone(value)) {
                    error = 'Số điện thoại không hợp lệ';
                }
                break;
                
            case 'fullName':
                if (value && value.length < 2) {
                    error = 'Họ tên phải có ít nhất 2 ký tự';
                }
                break;
                
            case 'licenseNumber':
                if (value && value.length < 5) {
                    error = 'Số chứng chỉ hành nghề không hợp lệ';
                }
                break;
                
            case 'experience':
                const exp = parseInt(value);
                if (value && (isNaN(exp) || exp < 0 || exp > 50)) {
                    error = 'Kinh nghiệm phải từ 0 đến 50 năm';
                }
                break;
                
            case 'consultationFee':
                const fee = parseFloat(value);
                if (value && (isNaN(fee) || fee < 0)) {
                    error = 'Phí tư vấn không hợp lệ';
                }
                break;
                
            case 'dateOfBirth':
                if (value) {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    
                    if (age < 0 || age > 150) {
                        error = 'Ngày sinh không hợp lệ';
                    }
                }
                break;
        }
    }
    
    // Display error
    if (error) {
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = error;
        }
        return false;
    } else {
        field.classList.remove('error');
        if (errorElement) {
            errorElement.textContent = '';
        }
        return true;
    }
}

function getFieldLabel(fieldName) {
    const labels = {
        'email': 'Email',
        'password': 'Mật khẩu',
        'fullName': 'Họ và tên',
        'phone': 'Số điện thoại',
        'dateOfBirth': 'Ngày sinh',
        'gender': 'Giới tính',
        'specialization': 'Chuyên khoa',
        'licenseNumber': 'Số chứng chỉ hành nghề',
        'experience': 'Kinh nghiệm',
        'consultationFee': 'Phí tư vấn',
        'bio': 'Giới thiệu bản thân'
    };
    
    return labels[fieldName] || fieldName;
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    // Special validations
    const agreeTerms = form.querySelector('#agreeTerms');
    if (agreeTerms && !agreeTerms.checked) {
        const errorElement = document.getElementById('agreeTermsError');
        if (errorElement) {
            errorElement.textContent = 'Bạn phải đồng ý với điều khoản dịch vụ';
        }
        isValid = false;
    }
    
    return isValid;
}

function initSocialLogin() {
    const googleBtn = document.querySelector('.btn-google');
    const facebookBtn = document.querySelector('.btn-facebook');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            utils.showNotification('Tính năng đăng nhập Google sẽ được cập nhật sớm', 'info');
        });
    }
    
    if (facebookBtn) {
        facebookBtn.addEventListener('click', () => {
            utils.showNotification('Tính năng đăng nhập Facebook sẽ được cập nhật sớm', 'info');
        });
    }
}

// Password strength indicator
function initPasswordStrength() {
    const passwordInputs = document.querySelectorAll('input[name="password"]');
    
    passwordInputs.forEach(input => {
        const strengthIndicator = createPasswordStrengthIndicator();
        input.parentNode.appendChild(strengthIndicator);
        
        input.addEventListener('input', () => {
            updatePasswordStrength(input, strengthIndicator);
        });
    });
}

function createPasswordStrengthIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'password-strength';
    indicator.innerHTML = `
        <div class="strength-bars">
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
        </div>
        <div class="strength-text">Độ mạnh mật khẩu</div>
    `;
    
    return indicator;
}

function updatePasswordStrength(input, indicator) {
    const password = input.value;
    const strength = calculatePasswordStrength(password);
    
    const bars = indicator.querySelectorAll('.strength-bar');
    const text = indicator.querySelector('.strength-text');
    
    // Reset all bars
    bars.forEach(bar => {
        bar.className = 'strength-bar';
    });
    
    // Update based on strength
    const strengthLevels = ['weak', 'fair', 'good', 'strong'];
    const strengthTexts = ['Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
    
    if (strength > 0) {
        for (let i = 0; i < strength; i++) {
            bars[i].classList.add(strengthLevels[strength - 1]);
        }
        text.textContent = `Mật khẩu ${strengthTexts[strength - 1]}`;
    } else {
        text.textContent = 'Nhập mật khẩu';
    }
}

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return Math.min(4, strength);
}

// Form data helpers
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        // Handle checkboxes
        if (form.querySelector(`[name="${key}"][type="checkbox"]`)) {
            data[key] = form.querySelector(`[name="${key}"]`).checked;
        } else {
            data[key] = value.trim();
        }
    }
    
    return data;
}

function setFormData(form, data) {
    Object.keys(data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = data[key];
            } else {
                field.value = data[key];
            }
        }
    });
}

// Export functions for use in other files
window.authUtils = {
    validateField,
    validateForm,
    getFormData,
    setFormData,
    initPasswordStrength
};