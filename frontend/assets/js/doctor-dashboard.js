document.addEventListener('DOMContentLoaded', () => {
    // Check if user is a doctor, otherwise redirect
    if (getRole() !== 'Doctor') {
        showNotification('Bạn không có quyền truy cập trang này.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Load initial data for the overview section
    loadDoctorOverview();
    loadDoctorAppointments();
    loadDoctorPatients();
    loadDoctorSchedule();
    loadDoctorProfile();
    loadDoctorEarnings();
});

// --- OVERVIEW SECTION ---
async function loadDoctorOverview() {
    const section = document.getElementById('overview');
    try {
        const stats = await api.get('/users/doctor/stats');
        document.getElementById('todayAppointments').textContent = stats.todayAppointments;
        document.getElementById('pendingAppointments').textContent = stats.pendingAppointments;
        document.getElementById('totalPatientsCount').textContent = stats.totalPatients;
        document.getElementById('monthlyEarnings').textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.monthlyEarnings);

        const upcomingAppointments = await api.get('/appointments/doctor?status=Confirmed&limit=5');
        const container = document.getElementById('upcomingAppointmentsContainer');
        if (upcomingAppointments.length === 0) {
            container.innerHTML = '<p>Không có lịch hẹn nào sắp tới.</p>';
        } else {
            container.innerHTML = upcomingAppointments.map(apt => `
                <div class="list-item">
                    <div class="item-info">
                        <p><strong>BN:</strong> ${apt.patient.fullName}</p>
                        <p><strong>Thời gian:</strong> ${new Date(apt.date).toLocaleDateString()} - ${apt.time}</p>
                    </div>
                    <button class="btn btn-sm" onclick="viewAppointmentDetail('${apt._id}')">Xem</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load doctor overview:', error);
        section.innerHTML = '<p class="error-message">Không thể tải dữ liệu tổng quan.</p>';
    }
}

// --- APPOINTMENTS SECTION ---
async function loadDoctorAppointments() {
    const container = document.getElementById('doctorAppointmentsContainer');
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const appointments = await api.get('/appointments/doctor');
        if (appointments.length === 0) {
            container.innerHTML = '<p>Bạn chưa có lịch hẹn nào.</p>';
            return;
        }
        
        const table = createDoctorAppointmentsTable(appointments);
        container.innerHTML = '';
        container.appendChild(table);

    } catch (error) {
        container.innerHTML = '<p class="error-message">Lỗi khi tải danh sách lịch hẹn.</p>';
        console.error('Failed to load doctor appointments:', error);
    }
}

function createDoctorAppointmentsTable(appointments) {
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ['Bệnh nhân', 'Ngày', 'Giờ', 'Trạng thái', 'Hành động'].forEach(headerText => {
        const th = document.createElement('th');
        th.innerHTML = headerText;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    appointments.forEach(appt => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${appt.patient.fullName}</td>
            <td>${new Date(appt.date).toLocaleDateString()}</td>
            <td>${appt.time}</td>
            <td><span class="status-${appt.status.toLowerCase()}">${appt.status}</span></td>
            <td class="actions">
                ${getAppointmentActions(appt)}
            </td>
        `;
    });

    return table;
}

function getAppointmentActions(appointment) {
    if (appointment.status === 'Pending') {
        return `
            <button class="btn btn-sm btn-success" onclick="updateAppointmentStatus('${appointment._id}', 'Confirmed')">Xác nhận</button>
            <button class="btn btn-sm btn-danger" onclick="updateAppointmentStatus('${appointment._id}', 'Cancelled')">Từ chối</button>
        `;
    }
    if (appointment.status === 'Confirmed') {
        return `
            <button class="btn btn-sm btn-primary" onclick="startConsultation('${appointment._id}')">Bắt đầu khám</button>
            <button class="btn btn-sm btn-danger" onclick="updateAppointmentStatus('${appointment._id}', 'Cancelled')">Hủy</button>
        `;
    }
    if (appointment.status === 'Completed') {
        return `<button class="btn btn-sm" onclick="viewConsultationRecord('${appointment._id}')">Xem bệnh án</button>`;
    }
    return '';
}

async function updateAppointmentStatus(id, status) {
    const actionText = {
        'Confirmed': 'xác nhận',
        'Cancelled': 'hủy/từ chối'
    };
    if (confirm(`Bạn có chắc muốn ${actionText[status]} lịch hẹn này?`)) {
        try {
            await api.put(`/appointments/${id}/status`, { status });
            showNotification(`Lịch hẹn đã được ${status === 'Confirmed' ? 'xác nhận' : 'cập nhật'}.`, 'success');
            loadDoctorAppointments();
            loadDoctorOverview();
        } catch (error) {
            showNotification(error.message || 'Không thể cập nhật trạng thái lịch hẹn.', 'error');
        }
    }
}

// --- PATIENTS SECTION ---
function loadDoctorPatients() {
    document.getElementById('doctorPatientsContainer').innerHTML = '<p>Chức năng quản lý bệnh nhân đang được phát triển.</p>';
}

// --- SCHEDULE SECTION ---
function loadDoctorSchedule() {
    document.getElementById('doctorScheduleContainer').innerHTML = '<p>Chức năng quản lý lịch làm việc đang được phát triển.</p>';
}

// --- PROFILE SECTION ---
function loadDoctorProfile() {
    document.getElementById('doctorProfileContainer').innerHTML = '<p>Chức năng quản lý hồ sơ đang được phát triển.</p>';
}

// --- EARNINGS SECTION ---
function loadDoctorEarnings() {
    document.getElementById('doctorEarningsContainer').innerHTML = '<p>Chức năng thống kê thu nhập đang được phát triển.</p>';
}

// --- ACTION HANDLERS (PLACEHOLDERS) ---
function viewAppointmentDetail(id) {
    showNotification(`Xem chi tiết lịch hẹn ${id}`, 'info');
}

function startConsultation(id) {
    showNotification(`Bắt đầu buổi khám cho lịch hẹn ${id}`, 'info');
}

function viewConsultationRecord(id) {
    showNotification(`Xem bệnh án của lịch hẹn ${id}`, 'info');
}

// --- Sidebar Navigation ---
// This uses the generic dashboard.js functionality
// but we can override specific section loading if needed.
function showProfile() {
    navigateToSection('profile');
}

function showSchedule() {
    navigateToSection('schedule');
}