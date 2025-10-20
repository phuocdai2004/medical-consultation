// Forgot password page functionality
document.addEventListener('DOMContentLoaded', () => {
    initForgotPasswordPage();
    checkForResetToken();
});

let resendCountdown = 60;
let countdownInterval;

function initForgotPasswordPage() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const resetForm = document.getElementById('resetPasswordForm');
    const resendBtn = document.getElementById('resendBtn');
    
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
        initPasswordMatch();
    }
    
    if (resendBtn) {
        resendBtn.addEventListener('click', handleResendEmail);
    }
}

function checkForResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Show reset password form
        showResetPasswordForm();
        // Store token for later use
        window.resetToken = token;
        
        // Update page title and header
        document.title = 'Đặt Lại Mật Khẩu - HealthCare';
        const header = document.querySelector('.auth-header h1');
        if (header) {
            header.textContent = 'Đặt Lại Mật Khẩu';
        }
        const description = document.querySelector('.auth-header p');
        if (description) {
            description.textContent = 'Nhập mật khẩu mới cho tài khoản của bạn';
        }
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.btn-primary');
    const emailInput = form.querySelector('#email');
    
    // Validate form
    if (!authUtils.validateForm(form)) {
        return;
    }
    
    // Show loading
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    
    try {
        const email = emailInput.value.trim();
        
        const response = await apiService.forgotPassword(email);
        
        if (response.success) {
            showSuccessMessage(email);
            startResendCountdown();
        } else {
            throw new Error(response.message || 'Gửi email thất bại');
        }
        
    } catch (error) {
        console.error('Forgot password error:', error);
        
        let errorMessage = 'Không thể gửi email. Vui lòng thử lại.';
        
        if (error.message.includes('not found') || error.message.includes('không tồn tại')) {
            errorMessage = 'Email không tồn tại trong hệ thống.';
        } else if (error.message.includes('rate limit')) {
            errorMessage = 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.';
        }
        
        utils.showNotification(errorMessage, 'error');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function showSuccessMessage(email) {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const successDiv = document.getElementById('resetSuccess');
    
    if (forgotForm) forgotForm.style.display = 'none';
    if (successDiv) {
        successDiv.style.display = 'block';
        
        // Update email in success message if needed
        const emailSpan = successDiv.querySelector('.user-email');
        if (emailSpan) {
            emailSpan.textContent = email;
        }
    }
}

function showResetPasswordForm() {
    const forgotForm = document.getElementById('forgotPasswordForm');
    const successDiv = document.getElementById('resetSuccess');
    const resetForm = document.getElementById('resetPasswordForm');
    
    if (forgotForm) forgotForm.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    if (resetForm) resetForm.style.display = 'block';
}

function startResendCountdown() {
    const resendBtn = document.getElementById('resendBtn');
    const countdownSpan = document.getElementById('countdown');
    
    if (!resendBtn || !countdownSpan) return;
    
    resendCountdown = 60;
    resendBtn.disabled = true;
    
    countdownInterval = setInterval(() => {
        resendCountdown--;
        countdownSpan.textContent = resendCountdown;
        
        if (resendCountdown <= 0) {
            clearInterval(countdownInterval);
            resendBtn.disabled = false;
            resendBtn.innerHTML = '<i class="fas fa-redo"></i> Gửi lại';
        }
    }, 1000);
}

async function handleResendEmail() {
    const emailInput = document.querySelector('#email');
    if (!emailInput) return;
    
    const email = emailInput.value.trim();
    if (!email) {
        utils.showNotification('Không tìm thấy email', 'error');
        return;
    }
    
    const resendBtn = document.getElementById('resendBtn');
    const originalText = resendBtn.textContent;
    
    resendBtn.disabled = true;
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    
    try {
        const response = await apiService.forgotPassword(email);
        
        if (response.success) {
            utils.showNotification('Email đã được gửi lại', 'success');
            startResendCountdown();
        } else {
            throw new Error(response.message || 'Gửi email thất bại');
        }
        
    } catch (error) {
        console.error('Resend email error:', error);
        utils.showNotification('Không thể gửi lại email', 'error');
        resendBtn.disabled = false;
        resendBtn.textContent = originalText;
    }
}

function initPasswordMatch() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (!newPasswordInput || !confirmPasswordInput) return;
    
    const checkPasswordMatch = () => {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const errorElement = document.getElementById('confirmPasswordError');
        
        if (confirmPassword && newPassword !== confirmPassword) {
            confirmPasswordInput.classList.add('error');
            if (errorElement) {
                errorElement.textContent = 'Mật khẩu xác nhận không khớp';
            }
            return false;
        } else {
            confirmPasswordInput.classList.remove('error');
            if (errorElement) {
                errorElement.textContent = '';
            }
            return true;
        }
    };
    
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    newPasswordInput.addEventListener('input', () => {
        if (confirmPasswordInput.value) {
            checkPasswordMatch();
        }
    });
}

async function handleResetPassword(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.btn-primary');
    
    // Validate form
    if (!authUtils.validateForm(form)) {
        utils.showNotification('Vui lòng kiểm tra lại thông tin', 'error');
        return;
    }
    
    // Check password match
    const newPassword = form.querySelector('#newPassword').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        utils.showNotification('Mật khẩu xác nhận không khớp', 'error');
        return;
    }
    
    // Check for reset token
    if (!window.resetToken) {
        utils.showNotification('Token đặt lại mật khẩu không hợp lệ', 'error');
        return;
    }
    
    // Show loading
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đặt lại...';
    
    try {
        const response = await apiService.resetPassword(window.resetToken, newPassword);
        
        if (response.success) {
            utils.showNotification('Đặt lại mật khẩu thành công!', 'success');
            
            // Redirect to login page after delay
            setTimeout(() => {
                window.location.href = 'login.html?message=password-reset-success';
            }, 2000);
        } else {
            throw new Error(response.message || 'Đặt lại mật khẩu thất bại');
        }
        
    } catch (error) {
        console.error('Reset password error:', error);
        
        let errorMessage = 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
        
        if (error.message.includes('expired') || error.message.includes('hết hạn')) {
            errorMessage = 'Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.';
        } else if (error.message.includes('invalid') || error.message.includes('không hợp lệ')) {
            errorMessage = 'Link đặt lại mật khẩu không hợp lệ.';
        }
        
        utils.showNotification(errorMessage, 'error');
        
        // If token is invalid/expired, redirect to forgot password page
        if (error.message.includes('expired') || error.message.includes('invalid')) {
            setTimeout(() => {
                window.location.href = 'forgot-password.html';
            }, 3000);
        }
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Handle messages from URL parameters
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message === 'token-expired') {
        utils.showNotification('Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.', 'warning');
    } else if (message === 'token-invalid') {
        utils.showNotification('Link đặt lại mật khẩu không hợp lệ.', 'error');
    }
});