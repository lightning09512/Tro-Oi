import nodemailer from "nodemailer"

export const isEmailConfigured = () => Boolean(
  process.env.BREVO_API_KEY ||
  process.env.RESEND_API_KEY ||
  process.env.SENDGRID_API_KEY ||
  (process.env.SMTP_HOST && process.env.SMTP_FROM) ||
  process.env.ALLOW_DEV_OTP !== "false"
)

export const sendCodeEmail = async ({ to, subject, purpose, code }) => {
  const textContent = `Mã xác nhận Trọ Ơi của bạn là ${code}. Mã có hiệu lực trong 15 phút. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.`
  const htmlContent = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#26372e;padding:24px;border:1px solid #dfe8e2;border-radius:12px;background:#ffffff">
    <div style="text-align:center;margin-bottom:20px">
      <h1 style="color:#24613e;margin:0;font-size:24px;font-weight:700">Trọ Ơi</h1>
      <p style="color:#6b7873;font-size:13px;margin:4px 0 0">Nền tảng tìm kiếm và quản lý phòng trọ tiện lợi</p>
    </div>
    <h2 style="color:#26372e;font-size:18px;margin-top:0">${purpose}</h2>
    <p style="color:#4a5550;font-size:14px;line-height:1.5">Bạn vừa yêu cầu mã xác nhận để thao tác trên hệ thống <strong>Trọ Ơi</strong>. Mã xác nhận của bạn là:</p>
    <div style="font-size:36px;font-weight:700;letter-spacing:10px;color:#24613e;background:#edf5ef;padding:16px 20px;border-radius:8px;text-align:center;margin:20px 0">${code}</div>
    <p style="color:#6b7873;font-size:13px;line-height:1.5">Mã này có hiệu lực trong vòng <strong>15 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai để bảo vệ tài khoản.</p>
    <hr style="border:none;border-top:1px solid #dfe8e2;margin:24px 0 16px" />
    <p style="color:#94a39b;font-size:12px;margin:0;text-align:center">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
  </div>`

  // 1. Try Brevo (Sendinblue) Transactional API (HTTPS Port 443 - Recommended for Render, sends to ANY recipient)
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "lightning09512@gmail.com"
      const senderName = process.env.BREVO_SENDER_NAME || "Trọ Ơi"
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent,
          textContent,
        }),
      })
      if (response.ok) {
        console.log(`[Tro Oi OTP] Email sent successfully via Brevo HTTPS to ${to}`)
        return { delivered: true, method: "brevo" }
      }
      const errorData = await response.json().catch(() => ({}))
      console.warn("Brevo API failed:", response.status, errorData)
    } catch (err) {
      console.warn("Brevo request error:", err.message)
    }
  }

  // 2. Try Resend API (HTTPS Port 443 - Works on Render)
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
        console.log(`[Tro Oi OTP] Email sent successfully via Resend HTTPS to ${to}`)
        return { delivered: true, method: "resend" }
      }
      const errorData = await response.json().catch(() => ({}))
      console.warn("Resend API failed:", errorData)
    } catch (err) {
      console.warn("Resend request error:", err.message)
    }
  }

  // 3. Try SendGrid API (HTTPS Port 443)
  if (process.env.SENDGRID_API_KEY) {
    try {
      const fromEmail = process.env.SENDGRID_FROM || process.env.SMTP_USER || "lightning09512@gmail.com"
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail, name: "Trọ Ơi" },
          subject,
          content: [
            { type: "text/plain", value: textContent },
            { type: "text/html", value: htmlContent },
          ],
        }),
      })
      if (response.status >= 200 && response.status < 300) {
        console.log(`[Tro Oi OTP] Email sent successfully via SendGrid HTTPS to ${to}`)
        return { delivered: true, method: "sendgrid" }
      }
      const errText = await response.text().catch(() => "")
      console.warn("SendGrid API failed:", response.status, errText)
    } catch (err) {
      console.warn("SendGrid request error:", err.message)
    }
  }

  // 4. Try SMTP via Nodemailer (Port 587 / 465 - Works on localhost or VPS without port blocks)
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
      console.log(`[Tro Oi OTP] Email sent successfully via SMTP to ${to}`)
      return { delivered: true, method: "smtp" }
    } catch (err) {
      console.warn(`SMTP delivery to ${to} failed: ${err.message}`)
    }
  }

  // 5. Fallback: If outbound mail delivery is blocked by host firewall
  console.log(`[Tro Oi OTP] Fallback generated verification code for ${to}: ${code}`)
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
