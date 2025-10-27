// Registration page functionality
document.addEventListener('DOMContentLoaded', () => {
    initRegistrationForm();
    initRoleSelection();
    initSpecializationData();
    // Password strength init moved to auth.js
});

function initRegistrationForm() {
    const form = document.querySelector('.register-form');
    if (!form) return;
    
    form.addEventListener('submit', handleRegistration);
    
    // Initialize role-specific fields
    const roleSelect = document.getElementById('role');
    if (roleSelect) {
        roleSelect.addEventListener('change', handleRoleChange);
        // Trigger initial change
        handleRoleChange.call(roleSelect);
    }
}

function initRoleSelection() {
    const roleCards = document.querySelectorAll('.role-card');
    const roleSelect = document.getElementById('role');
    
    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            roleCards.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked card
            card.classList.add('active');
            
            // Update select value
            const roleValue = card.dataset.role;
            if (roleSelect) {
                roleSelect.value = roleValue;
                handleRoleChange.call(roleSelect);
            }
        });
    });
    
    // Sync select with cards
    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            roleCards.forEach(card => {
                card.classList.toggle('active', card.dataset.role === roleSelect.value);
            });
        });
    }
}

function handleRoleChange() {
    const role = this.value;
    const doctorFields = document.querySelector('.doctor-fields');
    const patientFields = document.querySelector('.patient-fields');
    
    // Hide all role-specific fields
    if (doctorFields) doctorFields.style.display = 'none';
    if (patientFields) patientFields.style.display = 'none';
    
    // Show relevant fields
    if (role === 'doctor' && doctorFields) {
        doctorFields.style.display = 'block';
        makeFieldsRequired(doctorFields, true);
    } else if (role === 'patient' && patientFields) {
        patientFields.style.display = 'block';
        makeFieldsRequired(patientFields, true);
    }
    
    // Remove required from hidden fields
    if (role !== 'doctor' && doctorFields) {
        makeFieldsRequired(doctorFields, false);
    }
    if (role !== 'patient' && patientFields) {
        makeFieldsRequired(patientFields, false);
    }
}

function makeFieldsRequired(container, required) {
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (required) {
            input.setAttribute('required', '');
        } else {
            input.removeAttribute('required');
        }
    });
}

function initSpecializationData() {
    const specializationSelect = document.getElementById('specialization');
    if (!specializationSelect) return;
    
    const specializations = [
        'Nội khoa',
        'Ngoại khoa',
        'Sản phụ khoa',
        'Nhi khoa',
        'Tim mạch',
        'Thần kinh',
        'Chấn thương chỉnh hình',
        'Mắt',
        'Tai mũi họng',
        'Da liễu',
        'Tâm thần',
        'Ung bướu',
        'Nha khoa',
        'Dinh dưỡng',
        'Vật lý trị liệu',
        'Khác'
    ];
    
    // Clear existing options except the first one
    specializationSelect.innerHTML = '<option value="">Chọn chuyên khoa</option>';
    
    // Add specializations
    specializations.forEach(spec => {
        const option = document.createElement('option');
        option.value = spec.toLowerCase().replace(/\s+/g, '-');
        option.textContent = spec;
        specializationSelect.appendChild(option);
    });
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('.btn-primary');
    
    // Basic form validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Show loading
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';
    
    try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Prepare data for API
        const userData = {
            email: data.email,
            password: data.password,
            role: data.role,
            fullName: data.fullName,
            phone: data.phone
        };
        
        // Add role-specific data
        if (data.role === 'patient') {
            userData.dateOfBirth = data.dateOfBirth;
            userData.gender = data.gender;
            userData.address = data.address || '';
            userData.emergencyContact = data.emergencyContact || '';
        } else if (data.role === 'doctor') {
            userData.specialization = data.specialization;
            userData.licenseNumber = data.licenseNumber;
            userData.experience = parseInt(data.experience) || 0;
            userData.consultationFee = parseFloat(data.consultationFee) || 0;
            userData.bio = data.bio || '';
            userData.qualifications = data.qualifications ? data.qualifications.split('\n').filter(q => q.trim()) : [];
        }
        
        // Call registration API using global API_BASE_URL from main.js
        const response = await fetch(`${window.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.', 'success');
            
            // Redirect to login page after delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            throw new Error(result.message || 'Đăng ký thất bại');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        
        let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
        
        if (error.message.includes('email')) {
            errorMessage = 'Email đã được sử dụng. Vui lòng chọn email khác.';
        } else if (error.message.includes('phone')) {
            errorMessage = 'Số điện thoại đã được sử dụng.';
        } else if (error.message.includes('license')) {
            errorMessage = 'Số chứng chỉ hành nghề đã tồn tại.';
        }
        
        showNotification(errorMessage, 'error');
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Simple notification function
function showNotification(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alert(message);
        return;
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Demo data for testing
function fillDemoData() {
    const role = document.getElementById('role').value;
    const form = document.querySelector('.register-form');
    
    const commonData = {
        fullName: 'Nguyễn Văn Demo',
        email: `demo-${role}@example.com`,
        password: 'demo123456',
        phone: '0987654321'
    };
    
    if (role === 'patient') {
        const patientData = {
            ...commonData,
            dateOfBirth: '1990-01-01',
            gender: 'male',
            address: '123 Đường Demo, Quận 1, TP.HCM',
            emergencyContact: '0123456789'
        };
        setFormData(form, patientData);
    } else if (role === 'doctor') {
        const doctorData = {
            ...commonData,
            specialization: 'noi-khoa',
            licenseNumber: 'BS123456',
            experience: '5',
            consultationFee: '200000',
            bio: 'Bác sĩ có nhiều năm kinh nghiệm trong lĩnh vực nội khoa.',
            qualifications: 'Bằng Tiến sĩ Y khoa\nChứng chỉ chuyên khoa cấp I'
        };
        setFormData(form, doctorData);
    }
    
    showNotification('Đã điền dữ liệu demo', 'info');
}

// Set form data helper
function setFormData(form, data) {
    Object.entries(data).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = value;
        }
    });
}

// Add demo button for development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.querySelector('.register-form');
        if (form) {
            const demoBtn = document.createElement('button');
            demoBtn.type = 'button';
            demoBtn.className = 'btn btn-outline-secondary btn-sm mt-2';
            demoBtn.innerHTML = '<i class="fas fa-flask"></i> Demo Data';
            demoBtn.onclick = fillDemoData;
            
            form.appendChild(demoBtn);
        }
    });
}

// Real-time email availability check
let emailCheckTimeout;
function initEmailCheck() {
    const emailInput = document.getElementById('email');
    if (!emailInput) return;
    
    emailInput.addEventListener('input', () => {
        clearTimeout(emailCheckTimeout);
        
        emailCheckTimeout = setTimeout(async () => {
            const email = emailInput.value.trim();
            if (email && isValidEmail(email)) {
                await checkEmailAvailability(email);
            }
        }, 1000);
    });
}

// Simple email validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function checkEmailAvailability(email) {
    try {
        const emailInput = document.getElementById('email');
        // Use global API_BASE_URL from main.js
        const response = await fetch(`${window.API_BASE_URL}/auth/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            // Route doesn't exist or server error - just skip validation
            console.warn('Email check unavailable');
            return;
        }
        
        const result = await response.json();
        const errorElement = document.getElementById('emailError');
        
        if (!result.available) {
            if (emailInput) emailInput.classList.add('error');
            if (errorElement) {
                errorElement.textContent = 'Email đã được sử dụng';
            }
        } else {
            if (emailInput) emailInput.classList.remove('error');
            if (errorElement) {
                errorElement.textContent = '';
            }
        }
    } catch (error) {
        console.error('Email check error:', error);
    }
}

// Initialize email check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initEmailCheck();
});