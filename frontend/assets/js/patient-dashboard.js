// Patient-specific dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    initPatientDashboard();
    initAppointmentFilters();
    initDoctorSearch();
});

function initPatientDashboard() {
    // Load initial data
    loadOverviewData();
    
    // Initialize appointment status filter
    const statusFilter = document.getElementById('appointmentStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAppointments);
    }
    
    // Initialize appointment time filter
    const timeFilter = document.getElementById('appointmentTimeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', filterAppointments);
    }
}

// Appointments Management
async function loadAppointments() {
    try {
        showLoading('appointments');
        
        const response = await apiService.getPatientAppointments();
        if (response.success) {
            displayAppointments(response.data);
            updateAppointmentsBadge(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to load appointments:', error);
        showError('appointments', 'Không thể tải danh sách lịch khám');
    }
}

function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsContainer');
    if (!container) return;
    
    if (!appointments || appointments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>Chưa có lịch khám nào</h3>
                <p>Hãy đặt lịch khám với bác sĩ để bắt đầu chăm sóc sức khỏe của bạn.</p>
                <button class="btn btn-primary" onclick="showBookAppointmentModal()">
                    <i class="fas fa-plus"></i> Đặt lịch khám
                </button>
            </div>
        `;
        return;
    }
    
    const appointmentsHtml = appointments.map(appointment => `
        <div class="appointment-card" data-status="${appointment.status}">
            <div class="appointment-info">
                <div class="appointment-doctor">
                    <i class="fas fa-user-md"></i>
                    ${appointment.doctor.fullName}
                </div>
                <div class="appointment-details">
                    <div><i class="fas fa-calendar"></i> ${formatDateTime(appointment.appointmentDate)}</div>
                    <div><i class="fas fa-stethoscope"></i> ${appointment.doctor.specialization}</div>
                    <div><i class="fas fa-money-bill"></i> ${formatCurrency(appointment.consultationFee)}</div>
                    ${appointment.reason ? `<div><i class="fas fa-comment"></i> ${appointment.reason}</div>` : ''}
                </div>
            </div>
            <div class="appointment-actions">
                <span class="appointment-status ${appointment.status}">${getStatusText(appointment.status)}</span>
                <div class="appointment-buttons">
                    ${getAppointmentButtons(appointment)}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = appointmentsHtml;
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusTexts[status] || status;
}

function getAppointmentButtons(appointment) {
    const now = new Date();
    const appointmentDate = new Date(appointment.appointmentDate);
    
    let buttons = [];
    
    if (appointment.status === 'pending') {
        buttons.push(`<button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment('${appointment._id}')">Hủy</button>`);
    } else if (appointment.status === 'confirmed') {
        if (appointmentDate > now) {
            buttons.push(`<button class="btn btn-sm btn-outline-primary" onclick="rescheduleAppointment('${appointment._id}')">Đổi lịch</button>`);
            buttons.push(`<button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment('${appointment._id}')">Hủy</button>`);
        }
    } else if (appointment.status === 'completed') {
        buttons.push(`<button class="btn btn-sm btn-outline-primary" onclick="viewAppointmentDetails('${appointment._id}')">Xem chi tiết</button>`);
        buttons.push(`<button class="btn btn-sm btn-outline-secondary" onclick="bookFollowUp('${appointment._id}')">Tái khám</button>`);
    }
    
    return buttons.join(' ');
}

function updateAppointmentsBadge(appointments) {
    const badge = document.getElementById('appointmentsBadge');
    if (!badge) return;
    
    const upcomingCount = appointments.filter(apt => 
        apt.status === 'confirmed' && new Date(apt.appointmentDate) > new Date()
    ).length;
    
    badge.textContent = upcomingCount;
    badge.style.display = upcomingCount > 0 ? 'inline' : 'none';
}

function initAppointmentFilters() {
    const statusFilter = document.getElementById('appointmentStatusFilter');
    const timeFilter = document.getElementById('appointmentTimeFilter');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAppointments);
    }
    
    if (timeFilter) {
        timeFilter.addEventListener('change', filterAppointments);
    }
}

function filterAppointments() {
    const statusFilter = document.getElementById('appointmentStatusFilter')?.value;
    const timeFilter = document.getElementById('appointmentTimeFilter')?.value;
    const appointments = document.querySelectorAll('.appointment-card');
    
    appointments.forEach(card => {
        let show = true;
        
        // Filter by status
        if (statusFilter && card.dataset.status !== statusFilter) {
            show = false;
        }
        
        // Filter by time (implement based on appointment date)
        // This would require storing appointment date in data attribute
        
        card.style.display = show ? 'flex' : 'none';
    });
}

// Doctors Search and Display
async function loadDoctors() {
    try {
        showLoading('doctors');
        
        const response = await apiService.getDoctors();
        if (response.success) {
            displayDoctors(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to load doctors:', error);
        showError('doctors', 'Không thể tải danh sách bác sĩ');
    }
}

function displayDoctors(doctors) {
    const container = document.getElementById('doctorsGrid');
    if (!container) return;
    
    if (!doctors || doctors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-md"></i>
                <h3>Không tìm thấy bác sĩ</h3>
                <p>Hiện tại không có bác sĩ nào trong hệ thống.</p>
            </div>
        `;
        return;
    }
    
    const doctorsHtml = doctors.map(doctor => `
        <div class="doctor-card">
            <div class="doctor-avatar">
                ${getUserInitials(doctor.fullName)}
            </div>
            <div class="doctor-name">${doctor.fullName}</div>
            <div class="doctor-specialization">${doctor.specialization}</div>
            <div class="doctor-rating">
                <div class="stars">
                    ${generateStars(doctor.rating || 4.5)}
                </div>
                <span>(${doctor.reviewCount || 0} đánh giá)</span>
            </div>
            <div class="doctor-fee">${formatCurrency(doctor.consultationFee)}/buổi</div>
            <div class="doctor-experience">${doctor.experience} năm kinh nghiệm</div>
            <button class="btn btn-primary btn-sm" onclick="bookAppointmentWithDoctor('${doctor._id}')">
                Đặt lịch khám
            </button>
        </div>
    `).join('');
    
    container.innerHTML = doctorsHtml;
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function initDoctorSearch() {
    const searchInput = document.getElementById('doctorSearch');
    const specializationFilter = document.getElementById('specializationFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchDoctors, 300));
    }
    
    if (specializationFilter) {
        specializationFilter.addEventListener('change', searchDoctors);
    }
}

function searchDoctors() {
    const searchTerm = document.getElementById('doctorSearch')?.value.toLowerCase();
    const specialization = document.getElementById('specializationFilter')?.value;
    const doctorCards = document.querySelectorAll('.doctor-card');
    
    doctorCards.forEach(card => {
        const doctorName = card.querySelector('.doctor-name')?.textContent.toLowerCase();
        const doctorSpec = card.querySelector('.doctor-specialization')?.textContent;
        
        let show = true;
        
        // Filter by search term
        if (searchTerm && !doctorName?.includes(searchTerm)) {
            show = false;
        }
        
        // Filter by specialization
        if (specialization && doctorSpec !== specialization) {
            show = false;
        }
        
        card.style.display = show ? 'block' : 'none';
    });
}

// Medical Records
async function loadMedicalRecords() {
    try {
        showLoading('medical-records');
        
        const response = await apiService.getPatientMedicalRecords();
        if (response.success) {
            displayMedicalRecords(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to load medical records:', error);
        showError('medical-records', 'Không thể tải hồ sơ y tế');
    }
}

function displayMedicalRecords(records) {
    const container = document.getElementById('recordsContainer');
    if (!container) return;
    
    if (!records || records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <h3>Chưa có hồ sơ y tế</h3>
                <p>Hồ sơ y tế sẽ được tạo sau khi bạn hoàn thành lịch khám.</p>
            </div>
        `;
        return;
    }
    
    // Implementation for displaying medical records
    // This would show patient's medical history, diagnoses, treatments, etc.
}

// Prescriptions
async function loadPrescriptions() {
    try {
        showLoading('prescriptions');
        
        const response = await apiService.getPatientPrescriptions();
        if (response.success) {
            displayPrescriptions(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to load prescriptions:', error);
        showError('prescriptions', 'Không thể tải đơn thuốc');
    }
}

function displayPrescriptions(prescriptions) {
    const container = document.getElementById('prescriptionsContainer');
    if (!container) return;
    
    if (!prescriptions || prescriptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-prescription-bottle-alt"></i>
                <h3>Chưa có đơn thuốc</h3>
                <p>Đơn thuốc sẽ được kê sau khi bạn hoàn thành lịch khám với bác sĩ.</p>
            </div>
        `;
        return;
    }
    
    // Implementation for displaying prescriptions
}

// Health Tracking
async function loadHealthTracking() {
    try {
        showLoading('health-tracking');
        
        const response = await apiService.getPatientHealthData();
        if (response.success) {
            displayHealthTracking(response.data);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to load health tracking data:', error);
        showError('health-tracking', 'Không thể tải dữ liệu theo dõi sức khỏe');
    }
}

function displayHealthTracking(healthData) {
    const container = document.getElementById('healthCharts');
    if (!container) return;
    
    // Implementation for health tracking charts and data
}

// Modal Functions
window.showBookAppointmentModal = function() {
    const modalHtml = `
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Đặt Lịch Khám</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="bookAppointmentForm">
                        <div class="form-group">
                            <label for="doctorSelect">Chọn bác sĩ:</label>
                            <select id="doctorSelect" name="doctorId" required>
                                <option value="">Chọn bác sĩ...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointmentDate">Ngày khám:</label>
                            <input type="date" id="appointmentDate" name="appointmentDate" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointmentTime">Giờ khám:</label>
                            <select id="appointmentTime" name="appointmentTime" required>
                                <option value="">Chọn giờ...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="appointmentReason">Lý do khám:</label>
                            <textarea id="appointmentReason" name="reason" rows="3" 
                                placeholder="Mô tả triệu chứng hoặc lý do cần khám..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-cancel">Hủy</button>
                    <button class="btn btn-primary" onclick="submitBookAppointment()">Đặt lịch</button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHtml);
    loadDoctorsForBooking();
};

async function loadDoctorsForBooking() {
    try {
        const response = await apiService.getDoctors();
        if (response.success) {
            const select = document.getElementById('doctorSelect');
            if (select) {
                select.innerHTML = '<option value="">Chọn bác sĩ...</option>' +
                    response.data.map(doctor => 
                        `<option value="${doctor._id}">${doctor.fullName} - ${doctor.specialization}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Failed to load doctors for booking:', error);
    }
}

window.submitBookAppointment = async function() {
    const form = document.getElementById('bookAppointmentForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const appointmentData = {
        doctorId: formData.get('doctorId'),
        appointmentDate: `${formData.get('appointmentDate')}T${formData.get('appointmentTime')}`,
        reason: formData.get('reason')
    };
    
    try {
        const response = await apiService.bookAppointment(appointmentData);
        if (response.success) {
            utils.showNotification('Đặt lịch khám thành công!', 'success');
            closeModal();
            loadAppointments(); // Reload appointments
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to book appointment:', error);
        utils.showNotification('Không thể đặt lịch khám. Vui lòng thử lại.', 'error');
    }
};

window.bookAppointmentWithDoctor = function(doctorId) {
    showBookAppointmentModal();
    
    // Pre-select the doctor
    setTimeout(() => {
        const doctorSelect = document.getElementById('doctorSelect');
        if (doctorSelect) {
            doctorSelect.value = doctorId;
        }
    }, 100);
};

window.cancelAppointment = async function(appointmentId) {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch khám này?')) {
        return;
    }
    
    try {
        const response = await apiService.cancelAppointment(appointmentId);
        if (response.success) {
            utils.showNotification('Hủy lịch khám thành công!', 'success');
            loadAppointments(); // Reload appointments
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Failed to cancel appointment:', error);
        utils.showNotification('Không thể hủy lịch khám. Vui lòng thử lại.', 'error');
    }
};

// Utility functions
function debounce(func, wait) {
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

function getUserInitials(fullName) {
    return fullName
        .split(' ')
        .map(name => name.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + 
           date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Profile Management
window.showProfile = async function() {
    try {
        // Load user profile
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_BASE_URL}/users/me/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        const user = result.data;
        
        // Show profile modal
        const modalHtml = `
            <div class="modal active" id="profileModal">
                <div class="modal-overlay" onclick="closeModal('profileModal')"></div>
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h2><i class="fas fa-user-edit"></i> Cập nhật hồ sơ</h2>
                        <button class="modal-close" onclick="closeModal('profileModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form class="modal-body" id="profileForm" onsubmit="updateProfile(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-user"></i> Họ và tên
                                </label>
                                <input type="text" name="fullName" class="form-input" value="${user.fullName}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-envelope"></i> Email
                                </label>
                                <input type="email" name="email" class="form-input" value="${user.email}" readonly>
                                <small>Email không thể thay đổi</small>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-phone"></i> Số điện thoại
                                </label>
                                <input type="tel" name="phone" class="form-input" value="${user.phone}" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-calendar"></i> Ngày sinh
                                </label>
                                <input type="date" name="dateOfBirth" class="form-input" value="${user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-venus-mars"></i> Giới tính
                                </label>
                                <select name="gender" class="form-input">
                                    <option value="male" ${user.gender === 'male' ? 'selected' : ''}>Nam</option>
                                    <option value="female" ${user.gender === 'female' ? 'selected' : ''}>Nữ</option>
                                    <option value="other" ${user.gender === 'other' ? 'selected' : ''}>Khác</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-phone-alt"></i> Liên hệ khẩn cấp
                                </label>
                                <input type="tel" name="emergencyContact" class="form-input" value="${user.emergencyContact || ''}" placeholder="Số điện thoại người thân">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <i class="fas fa-map-marker-alt"></i> Địa chỉ
                            </label>
                            <textarea name="address" class="form-input" rows="3" placeholder="Nhập địa chỉ đầy đủ">${user.address || ''}</textarea>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="closeModal('profileModal')">
                                Hủy
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        const container = document.getElementById('modal-container');
        if (container) {
            container.innerHTML = modalHtml;
        }
    } catch (error) {
        console.error('Load profile error:', error);
        alert('Không thể tải thông tin hồ sơ');
    }
}

window.updateProfile = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${window.API_BASE_URL}/users/me/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Cập nhật thất bại');
        }
        
        // Update local storage
        const user = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...user, ...result.data }));
        
        alert('Cập nhật hồ sơ thành công!');
        closeModal('profileModal');
        
        // Refresh dashboard
        location.reload();
        
    } catch (error) {
        console.error('Update profile error:', error);
        alert(error.message || 'Không thể cập nhật hồ sơ');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Settings & Auth functions
window.showSettings = function() {
    alert('Tính năng cài đặt đang được phát triển');
}

window.logout = function() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../index.html';
    }
}
// Medical Records Management
function loadMedicalRecords() {
    const container = document.getElementById('recordsContainer');
    if (!container) return;
    
    // D? li?u m?u - sau n�y s? l?y t? API
    const medicalRecords = [
        {
            id: 1,
            date: '2024-10-15',
            type: 'Kh�m t?ng qu�t',
            doctor: 'BS. Nguy?n Van A',
            diagnosis: 'S?c kh?e t?t, ti?p t?c duy tr�',
            files: ['ket-qua-xet-nghiem.pdf', 'phim-chup-xquang.jpg']
        },
        {
            id: 2,
            date: '2024-09-20',
            type: 'Kh�m chuy�n khoa tim m?ch',
            doctor: 'BS. Tr?n Th? B',
            diagnosis: 'Huy?t �p b�nh thu?ng, ECG kh�ng c� b?t thu?ng',
            files: ['ecg-result.pdf']
        },
        {
            id: 3,
            date: '2024-08-10',
            type: 'X�t nghi?m m�u',
            doctor: 'BS. L� Van C',
            diagnosis: 'Ch? s? trong gi?i h?n b�nh thu?ng',
            files: ['blood-test.pdf']
        }
    ];
    
    if (medicalRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical"></i>
                <h3>Chua c� h? so y t? n�o</h3>
                <p>H? so y t? c?a b?n s? du?c luu tr? t?i d�y sau m?i l?n kh�m.</p>
                <button class="btn btn-primary" onclick="showAddRecordModal()">
                    <i class="fas fa-plus"></i> Th�m h? so
                </button>
            </div>
        `;
        return;
    }
    
    const recordsHtml = medicalRecords.map(record => `
        <div class="medical-record-card">
            <div class="record-header">
                <div class="record-type">
                    <i class="fas fa-file-medical-alt"></i>
                    <span>${record.type}</span>
                </div>
                <div class="record-date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(record.date).toLocaleDateString('vi-VN')}
                </div>
            </div>
            <div class="record-body">
                <div class="record-info">
                    <div class="info-item">
                        <i class="fas fa-user-md"></i>
                        <span>${record.doctor}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-diagnoses"></i>
                        <span>${record.diagnosis}</span>
                    </div>
                </div>
                ${record.files && record.files.length > 0 ? `
                    <div class="record-files">
                        <strong><i class="fas fa-paperclip"></i> T?p d�nh k�m:</strong>
                        <div class="file-list">
                            ${record.files.map(file => `
                                <a href="#" class="file-item" onclick="viewFile('${file}'); return false;">
                                    <i class="fas fa-file-${getFileIcon(file)}"></i>
                                    <span>${file}</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="record-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="viewRecord(${record.id})">
                    <i class="fas fa-eye"></i> Xem chi ti?t
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="downloadRecord(${record.id})">
                    <i class="fas fa-download"></i> T?i xu?ng
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = recordsHtml;
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'xls': 'excel',
        'xlsx': 'excel'
    };
    return icons[ext] || 'file';
}

window.viewFile = function(filename) {
    alert(`Xem file: ${filename}\n(T�nh nang dang ph�t tri?n)`);
}

window.viewRecord = function(recordId) {
    alert(`Xem chi ti?t h? so #${recordId}\n(T�nh nang dang ph�t tri?n)`);
}

window.downloadRecord = function(recordId) {
    alert(`T?i xu?ng h? so #${recordId}\n(T�nh nang dang ph�t tri?n)`);
}

window.showAddRecordModal = function() {
    alert('T�nh nang th�m h? so dang du?c ph�t tri?n');
}

// Auto load medical records
document.addEventListener('DOMContentLoaded', () => {
    const medicalRecordsLink = document.querySelector('[data-section="medical-records"]');
    if (medicalRecordsLink) {
        medicalRecordsLink.addEventListener('click', () => {
            loadMedicalRecords();
        });
    }
    if (window.location.hash === '#medical-records') {
        loadMedicalRecords();
    }
});
