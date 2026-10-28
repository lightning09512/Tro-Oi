import nodemailer from "nodemailer"

export const isEmailConfigured = () => Boolean(
  process.env.RESEND_API_KEY ||
  (process.env.SMTP_HOST && process.env.SMTP_FROM) ||
  process.env.ALLOW_DEV_OTP !== "false"
)

export const sendCodeEmail = async ({ to, subject, purpose, code }) => {
  const textContent = `Mã xác nhận Trọ Ơi của bạn là ${code}. Mã có hiệu lực trong 15 phút. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.`
  const htmlContent = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#26372e;padding:20px;border:1px solid #dfe8e2;border-radius:12px">
    <h2 style="color:#24613e;margin-top:0">${purpose}</h2>
    <p>Mã xác nhận Trọ Ơi của bạn:</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#24613e;background:#edf5ef;padding:14px 20px;border-radius:8px;text-align:center;margin:18px 0">${code}</div>
    <p style="color:#6b7873;font-size:13px">Mã có hiệu lực trong 15 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
  </div>`

  // 1. Try Resend API (HTTP-based, works 100% on Render Free Tier via Port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Trọ Ơi <onboarding@resend.dev>",
          to: [to],
          subject,
          html: htmlContent,
          text: textContent,
        }),
      })
      if (response.ok) {
        return { delivered: true, method: "resend" }
      }
      const errorData = await response.json().catch(() => ({}))
      console.warn("Resend API failed:", errorData)
    } catch (err) {
      console.warn("Resend request error:", err.message)
    }
  }

  // 2. Try SMTP via Nodemailer (with short timeout so blocked ports fail fast)
  if (process.env.SMTP_HOST && process.env.SMTP_FROM) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000,
      })
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      })
      return { delivered: true, method: "smtp" }
    } catch (err) {
      console.warn(`SMTP delivery to ${to} failed: ${err.message}`)
    }
  }

  // 3. Fallback: If outbound mail delivery is blocked by host firewall
  console.log(`[Tro Oi OTP] Generated verification code for ${to}: ${code}`)
  return { delivered: false, fallback: true, code }
}

export const sendRegistrationVerificationCode = (to, code) => sendCodeEmail({
  to,
  code,
  purpose: "Xác minh email đăng ký",
  subject: "Mã xác minh email đăng ký Trọ Ơi",
})

export const sendPasswordResetCode = (to, code) => sendCodeEmail({
  to,
  code,
  purpose: "Đặt lại mật khẩu tài khoản",
  subject: "Mã đặt lại mật khẩu Trọ Ơi",
})
