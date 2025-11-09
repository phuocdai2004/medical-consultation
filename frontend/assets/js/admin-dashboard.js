document.addEventListener('DOMContentLoaded', () => {
    // Check if user is an admin, otherwise redirect
    const user = auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
        utils.showNotification('Bạn không có quyền truy cập trang này.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Load initial data for the overview section
    // Note: Navigation is handled by dashboard.js
    loadAdminOverview().catch(err => console.error('Failed to load overview:', err));
    loadAdminUsers().catch(err => console.error('Failed to load users:', err));
    loadAdminAppointments().catch(err => console.error('Failed to load appointments:', err));
    loadAdminReports().catch(err => console.error('Failed to load reports:', err));
    loadAdminAnalytics().catch(err => console.error('Failed to load analytics:', err));
    loadAdminSettings().catch(err => console.error('Failed to load settings:', err));
});

// --- OVERVIEW SECTION ---
async function loadAdminOverview() {
    try {
        const stats = await api.get('/admin/stats');
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalDoctors').textContent = stats.totalDoctors;
        document.getElementById('totalPatients').textContent = stats.totalPatients;
        document.getElementById('totalAppointments').textContent = stats.totalAppointments;

        // Initialize charts
        renderNewUsersChart(stats.newUsersByMonth);
        renderUserRolesChart(stats.userRoles);

    } catch (error) {
        console.error('Failed to load admin overview:', error);
        utils.utils.showNotification('Không thể tải dữ liệu tổng quan.', 'error');
    }
}

function renderNewUsersChart(data) {
    const ctx = document.getElementById('newUsersChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels, // E.g., ['Tháng 1', 'Tháng 2', ...]
            datasets: [{
                label: 'Người dùng mới',
                data: data.values,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderUserRolesChart(data) {
    const ctx = document.getElementById('userRolesChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bác sĩ', 'Bệnh nhân', 'Admin'],
            datasets: [{
                label: 'Phân bổ người dùng',
                data: [data.doctors, data.patients, data.admins],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}


// --- USER MANAGEMENT SECTION ---
async function loadAdminUsers() {
    const container = document.getElementById('adminUsersContainer');
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const users = await api.get('/admin/users');
        if (users.length === 0) {
            container.innerHTML = '<p>Không có người dùng nào.</p>';
            return;
        }
        
        const table = createTable(
            ['ID', 'Họ tên', 'Email', 'Vai trò', 'Trạng thái', 'Hành động'],
            users.map(user => [
                user._id,
                user.fullName,
                user.email,
                user.role,
                user.isActive ? '<span class="status-active">Hoạt động</span>' : '<span class="status-inactive">Bị khóa</span>',
                `
                    <button class="btn-icon" onclick="showEditUserModal('${user._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-danger" onclick="toggleUserStatus('${user._id}', ${user.isActive})"><i class="fas fa-power-off"></i></button>
                    <button class="btn-icon btn-danger" onclick="deleteUser('${user._id}')"><i class="fas fa-trash"></i></button>
                `
            ])
        );
        container.innerHTML = '';
        container.appendChild(table);

    } catch (error) {
        container.innerHTML = '<p class="error-message">Lỗi khi tải danh sách người dùng.</p>';
        console.error('Failed to load users:', error);
    }
}

function showAddUserModal() {
    const modalContent = `
        <h2>Thêm Người Dùng Mới</h2>
        <form id="addUserForm">
            <div class="form-group">
                <label for="fullName">Họ tên</label>
                <input type="text" id="fullName" required>
            </div>
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" required>
            </div>
            <div class="form-group">
                <label for="phone">Số điện thoại</label>
                <input type="tel" id="phone" placeholder="0900000000" required>
            </div>
            <div class="form-group">
                <label for="password">Mật khẩu</label>
                <input type="password" id="password" required minlength="6">
            </div>
            <div class="form-group">
                <label for="role">Vai trò</label>
                <select id="role">
                    <option value="patient">Bệnh nhân</option>
                    <option value="doctor">Bác sĩ</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            
            <!-- Doctor-specific fields -->
            <div id="doctorFields" style="display: none;">
                <div class="form-group">
                    <label for="specialization">Chuyên khoa</label>
                    <input type="text" id="specialization" placeholder="VD: Tim mạch, Nội khoa...">
                </div>
                <div class="form-group">
                    <label for="licenseNumber">Số chứng chỉ hành nghề</label>
                    <input type="text" id="licenseNumber">
                </div>
                <div class="form-group">
                    <label for="experience">Kinh nghiệm (năm)</label>
                    <input type="number" id="experience" min="0" max="50">
                </div>
                <div class="form-group">
                    <label for="consultationFee">Phí tư vấn (VNĐ)</label>
                    <input type="number" id="consultationFee" min="0" step="1000">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Thêm</button>
                <button type="button" class="btn" onclick="closeModal()">Hủy</button>
            </div>
        </form>
    `;
    showModal(modalContent);

    // Show/hide doctor fields based on role selection
    const roleSelect = document.getElementById('role');
    const doctorFields = document.getElementById('doctorFields');
    const doctorInputs = doctorFields.querySelectorAll('input');
    
    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'doctor') {
            doctorFields.style.display = 'block';
            doctorInputs.forEach(input => input.required = true);
        } else {
            doctorFields.style.display = 'none';
            doctorInputs.forEach(input => input.required = false);
        }
    });

    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        const userData = { fullName, email, phone, password, role };

        // Add doctor-specific fields if role is doctor
        if (role === 'doctor') {
            userData.specialization = document.getElementById('specialization').value;
            userData.licenseNumber = document.getElementById('licenseNumber').value;
            userData.experience = parseInt(document.getElementById('experience').value);
            userData.consultationFee = parseFloat(document.getElementById('consultationFee').value);
        }

        try {
            await api.post('/admin/users', userData);
            utils.showNotification('Thêm người dùng thành công!', 'success');
            closeModal();
            loadAdminUsers();
            loadAdminOverview();
        } catch (error) {
            utils.showNotification(error.message || 'Không thể thêm người dùng.', 'error');
        }
    });
}

async function showEditUserModal(userId) {
    // In a real app, you'd fetch user details first
    // For now, we'll just allow role editing
    const modalContent = `
        <h2>Chỉnh Sửa Vai Trò Người Dùng</h2>
        <form id="editUserForm">
            <div class="form-group">
                <label for="editRole">Vai trò</label>
                <select id="editRole">
                    <option value="Patient">Bệnh nhân</option>
                    <option value="Doctor">Bác sĩ</option>
                    <option value="Admin">Admin</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                <button type="button" class="btn" onclick="closeModal()">Hủy</button>
            </div>
        </form>
    `;
    showModal(modalContent);

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = document.getElementById('editRole').value;
        try {
            await api.put(`/admin/users/${userId}/role`, { role });
            utils.showNotification('Cập nhật vai trò thành công!', 'success');
            closeModal();
            loadAdminUsers();
        } catch (error) {
            utils.showNotification(error.message || 'Không thể cập nhật vai trò.', 'error');
        }
    });
}

async function toggleUserStatus(userId, isActive) {
    const action = isActive ? 'khóa' : 'mở khóa';
    if (confirm(`Bạn có chắc muốn ${action} người dùng này?`)) {
        try {
            await api.put(`/admin/users/${userId}/status`, { isActive: !isActive });
            utils.showNotification(`Người dùng đã được ${action}.`, 'success');
            loadAdminUsers();
        } catch (error) {
            utils.showNotification(error.message || `Không thể ${action} người dùng.`, 'error');
        }
    }
}

async function deleteUser(userId) {
    if (confirm('Bạn có chắc muốn XÓA vĩnh viễn người dùng này? Hành động này không thể hoàn tác.')) {
        try {
            await api.delete(`/admin/users/${userId}`);
            utils.showNotification('Người dùng đã được xóa vĩnh viễn.', 'success');
            loadAdminUsers();
            loadAdminOverview();
        } catch (error) {
            utils.showNotification(error.message || 'Không thể xóa người dùng.', 'error');
        }
    }
}


// --- APPOINTMENT MANAGEMENT SECTION ---
async function loadAdminAppointments() {
    const container = document.getElementById('adminAppointmentsContainer');
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const appointments = await api.get('/admin/appointments');
        if (appointments.length === 0) {
            container.innerHTML = '<p>Không có lịch hẹn nào.</p>';
            return;
        }
        
        const table = createTable(
            ['ID', 'Bệnh nhân', 'Bác sĩ', 'Ngày', 'Giờ', 'Trạng thái', 'Hành động'],
            appointments.map(appt => [
                appt._id,
                appt.patient.fullName,
                appt.doctor.fullName,
                new Date(appt.date).toLocaleDateString(),
                appt.time,
                `<span class="status-${appt.status.toLowerCase()}">${appt.status}</span>`,
                `<button class="btn-icon btn-danger" onclick="cancelAdminAppointment('${appt._id}')"><i class="fas fa-times-circle"></i> Hủy</button>`
            ])
        );
        container.innerHTML = '';
        container.appendChild(table);

    } catch (error) {
        container.innerHTML = '<p class="error-message">Lỗi khi tải danh sách lịch hẹn.</p>';
        console.error('Failed to load appointments:', error);
    }
}

async function cancelAdminAppointment(appointmentId) {
    if (confirm('Bạn có chắc muốn hủy lịch hẹn này?')) {
        try {
            await api.put(`/admin/appointments/${appointmentId}/cancel`);
            utils.showNotification('Lịch hẹn đã được hủy.', 'success');
            loadAdminAppointments();
        } catch (error) {
            utils.showNotification(error.message || 'Không thể hủy lịch hẹn.', 'error');
        }
    }
}


// --- PLACEHOLDER SECTIONS ---
function loadAdminReports() {
    document.getElementById('adminReportsContainer').innerHTML = '<p>Chức năng báo cáo đang được phát triển.</p>';
}

function loadAdminAnalytics() {
    document.getElementById('adminAnalyticsContainer').innerHTML = '<p>Chức năng phân tích đang được phát triển.</p>';
}

function loadAdminSettings() {
    document.getElementById('adminSettingsContainer').innerHTML = '<p>Chức năng cài đặt hệ thống đang được phát triển.</p>';
}

// Helper to create a table
function createTable(headers, rows) {
    const table = document.createElement('table');
    table.className = 'data-table';
    
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.innerHTML = headerText;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    rows.forEach(rowData => {
        const row = tbody.insertRow();
        rowData.forEach(cellData => {
            const cell = row.insertCell();
            cell.innerHTML = cellData;
        });
    });

    return table;
}
