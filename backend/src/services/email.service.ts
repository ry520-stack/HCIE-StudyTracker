import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('[email] SMTP_USER 或 SMTP_PASS 未配置，验证码功能不可用');
      return null;
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  try {
    await t.sendMail({
      from: `"StudyTracker" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '验证码 - StudyTracker',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:30px;background:#f8f9fa;border-radius:12px">
          <h2 style="color:#0071e3;margin:0 0 20px">📚 StudyTracker</h2>
          <p style="color:#333;font-size:15px">你的验证码是：</p>
          <div style="background:#fff;border:2px dashed #0071e3;border-radius:10px;padding:18px;text-align:center;margin:16px 0">
            <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#0071e3">${code}</span>
          </div>
          <p style="color:#86868b;font-size:13px">验证码 5 分钟内有效，请勿转发给他人。</p>
          <hr style="border:0;border-top:1px solid #e5e5e5;margin:20px 0" />
          <p style="color:#aeaeb2;font-size:11px">由 ranyv520@gmail.com 发送 · HCIE 备考学习追踪器</p>
        </div>
      `,
    });
    return true;
  } catch (e) {
    console.error('[email] 发送失败:', e);
    return false;
  }
}
