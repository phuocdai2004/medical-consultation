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