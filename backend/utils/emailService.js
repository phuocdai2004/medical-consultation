const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `Medical Consultation <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Welcome email template
  getWelcomeEmailTemplate(name, role) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Medical Consultation</h1>
            <p>Chào mừng đến với hệ thống tư vấn y tế trực tuyến</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản <strong>${role}</strong> tại hệ thống của chúng tôi.</p>
            
            ${role === 'patient' ? `
              <p>Với tài khoản bệnh nhân, bạn có thể:</p>
              <ul>
                <li>🗓️ Đặt lịch hẹn với bác sĩ</li>
                <li>💬 Tư vấn trực tuyến</li>
                <li>📋 Xem lịch sử khám bệnh</li>
                <li>👤 Quản lý thông tin cá nhân</li>
              </ul>
            ` : role === 'doctor' ? `
              <p>Với tài khoản bác sĩ, bạn có thể:</p>
              <ul>
                <li>👥 Quản lý danh sách bệnh nhân</li>
                <li>📅 Quản lý lịch hẹn</li>
                <li>💊 Kê đơn thuốc điện tử</li>
                <li>📊 Xem thống kê tư vấn</li>
              </ul>
              <p><em>Lưu ý: Tài khoản bác sĩ cần được admin xác minh trước khi có thể sử dụng đầy đủ.</em></p>
            ` : ''}
            
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/login" class="button">Đăng nhập ngay</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Medical Consultation System. All rights reserved.</p>
            <p>Nếu bạn có thắc mắc, vui lòng liên hệ: support@medical.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Password reset email template
  getPasswordResetTemplate(name, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Đặt lại mật khẩu</h1>
            <p>Medical Consultation System</p>
          </div>
          <div class="content">
            <h2>Xin chào ${name}!</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul>
                <li>Link này sẽ hết hạn sau 10 phút</li>
                <li>Chỉ sử dụng link nếu bạn thực sự yêu cầu đặt lại mật khẩu</li>
                <li>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </p>
            
            <p><small>Hoặc copy link này vào trình duyệt:<br>
            <code>${resetUrl}</code></small></p>
          </div>
          <div class="footer">
            <p>© 2025 Medical Consultation System. All rights reserved.</p>
            <p>Vì bảo mật, không chia sẻ email này với ai khác.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Appointment confirmation email
  getAppointmentConfirmationTemplate(patientName, doctorName, appointmentDate, appointmentTime) {
    const formattedDate = new Date(appointmentDate).toLocaleDateString('vi-VN');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); color: white; padding: 30px; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; }
          .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Xác nhận lịch hẹn</h1>
            <p>Medical Consultation System</p>
          </div>
          <div class="content">
            <h2>Xin chào ${patientName}!</h2>
            <p>Lịch hẹn của bạn đã được xác nhận thành công.</p>
            
            <div class="appointment-details">
              <h3>📋 Chi tiết lịch hẹn:</h3>
              <p><strong>👨‍⚕️ Bác sĩ:</strong> ${doctorName}</p>
              <p><strong>📅 Ngày:</strong> ${formattedDate}</p>
              <p><strong>🕐 Giờ:</strong> ${appointmentTime}</p>
              <p><strong>📍 Hình thức:</strong> Tư vấn trực tuyến</p>
            </div>
            
            <p><strong>Lưu ý quan trọng:</strong></p>
            <ul>
              <li>Vui lòng có mặt đúng giờ</li>
              <li>Chuẩn bị đầy đủ thông tin bệnh lý</li>
              <li>Kiểm tra kết nối internet trước buổi tư vấn</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2025 Medical Consultation System. All rights reserved.</p>
            <p>Hotline hỗ trợ: 1900-xxxx</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send welcome email
  async sendWelcomeEmail(email, name, role) {
    const html = this.getWelcomeEmailTemplate(name, role);
    return await this.sendEmail({
      to: email,
      subject: '🏥 Chào mừng đến với Medical Consultation System',
      html
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name, resetToken) {
    const html = this.getPasswordResetTemplate(name, resetToken);
    return await this.sendEmail({
      to: email,
      subject: '🔒 Yêu cầu đặt lại mật khẩu - Medical Consultation',
      html
    });
  }

  // Send appointment confirmation
  async sendAppointmentConfirmation(email, patientName, doctorName, appointmentDate, appointmentTime) {
    const html = this.getAppointmentConfirmationTemplate(patientName, doctorName, appointmentDate, appointmentTime);
    return await this.sendEmail({
      to: email,
      subject: '✅ Xác nhận lịch hẹn - Medical Consultation',
      html
    });
  }
}

module.exports = new EmailService();