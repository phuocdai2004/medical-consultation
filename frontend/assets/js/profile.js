// Profile page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadUserProfile();
    } catch (e) {
        console.error('Error loading profile:', e);
    }
    
    try {
        initProfileForm();
    } catch (e) {
        console.error('Error init profile form:', e);
    }
    
    try {
        initChangePasswordForm();
    } catch (e) {
        console.error('Error init change password form:', e);
    }
});

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token from localStorage:', token ? 'EXISTS' : 'MISSING');
        
        if (!token) {
            console.warn('⚠️ NO TOKEN - Showing empty form');
            // Don't redirect - just show empty form
            return;
        }

        console.log('📡 Fetching profile from: http://localhost:8000/api/users/me/profile');
        
        const response = await fetch('http://localhost:8000/api/users/me/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ API Error:', errorData);
            return;
        }

        const result = await response.json();
        console.log('✅ Profile loaded successfully:', result);
        
        const user = result.data;

        // Fill form with user data
        document.getElementById('fullName').value = user.fullName || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone').value = user.phone || '';
        document.getElementById('dateOfBirth').value = user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '';
        document.getElementById('gender').value = user.gender || '';
        document.getElementById('address').value = user.address || '';

        // Fill account info
        const userRoleEl = document.getElementById('userRole');
        if (userRoleEl) userRoleEl.textContent = getRoleText(user.role);
        
        const createdAtEl = document.getElementById('createdAt');
        if (createdAtEl) createdAtEl.textContent = new Date(user.createdAt).toLocaleDateString('vi-VN');
        
        const statusBadge = document.getElementById('accountStatus');
        if (statusBadge) {
            if (user.isActive) {
                statusBadge.textContent = 'Đã kích hoạt';
                statusBadge.className = 'badge badge-success';
            } else {
                statusBadge.textContent = 'Chưa kích hoạt';
                statusBadge.className = 'badge badge-warning';
            }
        }

    } catch (error) {
        console.error('❌ Load profile error:', error);
        // Don't show error, just log it
    }
}

// Initialize profile form
function initProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) {
        console.warn('⚠️ profileForm not found');
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/users/me/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            showNotification('Cập nhật hồ sơ thành công!', 'success');
            
            // Update localStorage user data
            const result = await response.json();
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({...currentUser, ...result.data}));
            
        } catch (error) {
            console.error('Update profile error:', error);
            showNotification('Không thể cập nhật hồ sơ. Vui lòng thử lại.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Initialize change password form
function initChangePasswordForm() {
    const form = document.getElementById('changePasswordForm');
    if (!form) {
        console.warn('⚠️ changePasswordForm not found');
        return;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords
        if (newPassword !== confirmPassword) {
            showNotification('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
            return;
        }
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đổi mật khẩu...';
            
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/users/me/change-password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to change password');
            }

            showNotification('Đổi mật khẩu thành công!', 'success');
            form.reset();
            
        } catch (error) {
            console.error('Change password error:', error);
            showNotification(error.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// Helper functions
function getRoleText(role) {
    const roles = {
        'patient': 'Bệnh nhân',
        'doctor': 'Bác sĩ',
        'admin': 'Quản trị viên'
    };
    return roles[role] || role;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} show`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
