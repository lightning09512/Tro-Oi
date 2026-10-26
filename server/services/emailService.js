import nodemailer from "nodemailer"

export const isEmailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM)

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
})

const sendCodeEmail = async ({ to, subject, purpose, code }) => {
  if (!isEmailConfigured()) throw new Error("Email service is not configured.")
  const transporter = createTransporter()
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text: "Mã xác nhận Trọ Ơi của bạn là " + code + ". Mã có hiệu lực trong 15 phút. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.",
    html: "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#26372e\"><h2>" + purpose + "</h2><p>Mã xác nhận Trọ Ơi của bạn:</p><p style=\"font-size:32px;font-weight:700;letter-spacing:8px;color:#24613e\">" + code + "</p><p>Mã có hiệu lực trong 15 phút. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p></div>",
  })
}

export const sendRegistrationVerificationCode = (to, code) => sendCodeEmail({
  to,
  code,
  purpose: "Xác minh email đăng ký",
  subject: "Mã xác minh email đăng ký Trọ Ơi",
})

