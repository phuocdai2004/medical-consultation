const User = require('../models/User');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalDoctors = await User.countDocuments({ role: 'Doctor' });
        const totalPatients = await User.countDocuments({ role: 'Patient' });
        const totalAppointments = await Appointment.countDocuments();

        // Example data for charts - in a real app, this would be more complex
        const newUsersByMonth = {
            labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
            values: [12, 19, 3, 5, 2, 3] // Dummy data
        };
        const userRoles = {
            doctors: totalDoctors,
            patients: totalPatients,
            admins: await User.countDocuments({ role: 'Admin' })
        };

        res.json({
            totalUsers,
            totalDoctors,
            totalPatients,
            totalAppointments,
            newUsersByMonth,
            userRoles
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
    const { fullName, email, phone, password, role, specialization, licenseNumber, experience, consultationFee } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        const userData = {
            fullName,
            email,
            phone,
            password, // Password will be hashed by the pre-save hook in the model
            role,
            isActive: true,
            isVerified: true
        };

        // Add doctor-specific fields if role is doctor
        if (role === 'doctor') {
            userData.specialization = specialization;
            userData.licenseNumber = licenseNumber;
            userData.experience = experience;
            userData.consultationFee = consultationFee;
        }

        user = new User(userData);
        await user.save();
        
        res.status(201).json({ 
            message: 'Người dùng đã được tạo thành công',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: error.message || 'Lỗi máy chủ' });
    }
};


// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        user.role = role;
        await user.save();

        res.json({ message: 'Vai trò người dùng đã được cập nhật' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        user.isActive = isActive;
        await user.save();

        res.json({ message: 'Trạng thái người dùng đã được cập nhật' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Optional: Add more checks, e.g., cannot delete the last admin
        if (user.role === 'Admin') {
            const adminCount = await User.countDocuments({ role: 'Admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'Không thể xóa quản trị viên cuối cùng' });
            }
        }

        await user.deleteOne(); // Use deleteOne instead of remove

        res.json({ message: 'Người dùng đã được xóa' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};


// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private/Admin
exports.getAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('patient', 'fullName')
            .populate('doctor', 'fullName')
            .sort({ date: -1 });
        res.json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// @desc    Cancel an appointment
// @route   PUT /api/admin/appointments/:id/cancel
// @access  Private/Admin
exports.cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        appointment.status = 'Cancelled';
        await appointment.save();

        // Optional: Notify patient and doctor
        // ...

        res.json({ message: 'Lịch hẹn đã được hủy' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};