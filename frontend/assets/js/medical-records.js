// Medical Records Page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadMedicalRecords();
    initFilters();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Sample data - Replace with API call later
const sampleRecords = [
    {
        id: 1,
        date: '2024-10-15',
        type: 'general',
        typeName: 'Khám tổng quát',
        doctor: 'BS. Nguyễn Văn A',
        specialty: 'Nội khoa tổng quát',
        diagnosis: 'Sức khỏe tốt, tiếp tục duy trì lối sống healthy',
        prescription: 'Vitamin C, Omega-3',
        notes: 'Nên tập thể dục đều đặn, uống đủ nước',
        files: [
            { name: 'ket-qua-xet-nghiem.pdf', type: 'pdf', size: '2.5 MB' },
            { name: 'phim-chup-xquang.jpg', type: 'image', size: '1.2 MB' }
        ]
    },
    {
        id: 2,
        date: '2024-09-20',
        type: 'cardiology',
        typeName: 'Khám chuyên khoa tim mạch',
        doctor: 'BS. Trần Thị B',
        specialty: 'Tim mạch',
        diagnosis: 'Huyết áp bình thường 120/80, ECG không có bất thường',
        prescription: 'Không cần thuốc',
        notes: 'Theo dõi huyết áp hàng tháng',
        files: [
            { name: 'ecg-result.pdf', type: 'pdf', size: '1.8 MB' }
        ]
    },
    {
        id: 3,
        date: '2024-08-10',
        type: 'test',
        typeName: 'Xét nghiệm máu',
        doctor: 'BS. Lê Văn C',
        specialty: 'Xét nghiệm',
        diagnosis: 'Tất cả chỉ số trong giới hạn bình thường',
        prescription: 'Không',
        notes: 'Xét nghiệm lại sau 6 tháng',
        files: [
            { name: 'blood-test-result.pdf', type: 'pdf', size: '890 KB' }
        ]
    },
    {
        id: 4,
        date: '2024-07-05',
        type: 'imaging',
        typeName: 'Chụp X-quang phổi',
        doctor: 'BS. Phạm Thị D',
        specialty: 'Chẩn đoán hình ảnh',
        diagnosis: 'Phổi sạch, không có dấu hiệu bất thường',
        prescription: 'Không',
        notes: 'Theo dõi định kỳ hàng năm',
        files: [
            { name: 'x-ray-chest.jpg', type: 'image', size: '3.1 MB' }
        ]
    }
];

let filteredRecords = [...sampleRecords];

function loadMedicalRecords() {
    const container = document.getElementById('recordsContainer');
    
    if (filteredRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem;">
                <i class="fas fa-file-medical" style="font-size: 4rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                <h3>Chưa có hồ sơ y tế nào</h3>
                <p style="color: var(--gray-600);">Hồ sơ y tế của bạn sẽ được lưu trữ tại đây sau mỗi lần khám.</p>
                <button class="btn btn-primary" onclick="showAddRecordModal()" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Thêm hồ sơ mới
                </button>
            </div>
        `;
        return;
    }
    
    const recordsHtml = filteredRecords.map(record => `
        <div class="medical-record-card" data-type="${record.type}">
            <div class="record-header">
                <div class="record-type">
                    <i class="fas fa-file-medical-alt"></i>
                    <div>
                        <span style="display: block;">${record.typeName}</span>
                        <small style="color: var(--gray-500); font-weight: normal;">${record.specialty}</small>
                    </div>
                </div>
                <div class="record-date">
                    <i class="fas fa-calendar"></i>
                    ${new Date(record.date).toLocaleDateString('vi-VN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}
                </div>
            </div>
            
            <div class="record-body">
                <div class="record-info">
                    <div class="info-item">
                        <i class="fas fa-user-md"></i>
                        <div>
                            <strong>Bác sĩ khám:</strong>
                            <span>${record.doctor}</span>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <i class="fas fa-diagnoses"></i>
                        <div>
                            <strong>Chẩn đoán:</strong>
                            <span>${record.diagnosis}</span>
                        </div>
                    </div>
                    
                    ${record.prescription ? `
                        <div class="info-item">
                            <i class="fas fa-prescription-bottle-alt"></i>
                            <div>
                                <strong>Đơn thuốc:</strong>
                                <span>${record.prescription}</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${record.notes ? `
                        <div class="info-item">
                            <i class="fas fa-notes-medical"></i>
                            <div>
                                <strong>Ghi chú:</strong>
                                <span>${record.notes}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${record.files && record.files.length > 0 ? `
                    <div class="record-files">
                        <strong><i class="fas fa-paperclip"></i> Tệp đính kèm (${record.files.length}):</strong>
                        <div class="file-list">
                            ${record.files.map(file => `
                                <a href="#" class="file-item" onclick="viewFile('${file.name}', ${record.id}); return false;">
                                    <i class="fas fa-file-${getFileIcon(file.type)}"></i>
                                    <div>
                                        <span>${file.name}</span>
                                        <small style="color: var(--gray-500); display: block;">${file.size}</small>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="record-actions">
                <button class="btn btn-sm btn-primary" onclick="viewRecordDetail(${record.id})">
                    <i class="fas fa-eye"></i> Xem chi tiết
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="downloadRecord(${record.id})">
                    <i class="fas fa-download"></i> Tải xuống
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="printRecord(${record.id})">
                    <i class="fas fa-print"></i> In
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = recordsHtml;
}

function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const yearFilter = document.getElementById('yearFilter');
    
    searchInput.addEventListener('input', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    yearFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    
    filteredRecords = sampleRecords.filter(record => {
        const matchesSearch = !searchTerm || 
            record.typeName.toLowerCase().includes(searchTerm) ||
            record.doctor.toLowerCase().includes(searchTerm) ||
            record.diagnosis.toLowerCase().includes(searchTerm);
            
        const matchesType = !typeFilter || record.type === typeFilter;
        
        const matchesYear = !yearFilter || record.date.startsWith(yearFilter);
        
        return matchesSearch && matchesType && matchesYear;
    });
    
    loadMedicalRecords();
}

function getFileIcon(type) {
    const icons = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'image': 'image',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'xls': 'excel',
        'xlsx': 'excel'
    };
    return icons[type] || 'file';
}

function viewFile(filename, recordId) {
    alert(`Xem file: ${filename} (Hồ sơ #${recordId})\n\nTính năng đang được phát triển.`);
}

function viewRecordDetail(recordId) {
    const record = sampleRecords.find(r => r.id === recordId);
    if (!record) return;
    
    alert(`Chi tiết hồ sơ #${recordId}\n\n` +
          `Loại: ${record.typeName}\n` +
          `Ngày: ${new Date(record.date).toLocaleDateString('vi-VN')}\n` +
          `Bác sĩ: ${record.doctor}\n\n` +
          `Tính năng xem chi tiết đang được phát triển.`);
}

function downloadRecord(recordId) {
    alert(`Đang tải xuống hồ sơ #${recordId}...\n\nTính năng đang được phát triển.`);
}

function printRecord(recordId) {
    alert(`Đang chuẩn bị in hồ sơ #${recordId}...\n\nTính năng đang được phát triển.`);
}

window.showAddRecordModal = function() {
    alert('Tính năng thêm hồ sơ đang được phát triển.\n\nHồ sơ sẽ được thêm tự động sau mỗi lần khám bệnh.');
}
