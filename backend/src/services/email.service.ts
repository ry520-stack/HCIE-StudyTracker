import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('[email] SMTP_USER 或 SMTP_PASS 未配置');
      return null;
    }

    // 阿里云 ECS 可能封锁 25/587，优先用 465 SSL
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
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
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:30px">
          <h2 style="color:#0071e3;margin:0 0 20px">StudyTracker</h2>
          <p style="color:#333;font-size:15px">你的验证码：</p>
          <div style="border:2px dashed #0071e3;border-radius:10px;padding:18px;text-align:center;margin:16px 0">
            <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#0071e3">${code}</span>
          </div>
          <p style="color:#86868b;font-size:13px">验证码 5 分钟内有效。</p>
        </div>
      `,
    });
    return true;
  } catch (e: unknown) {
    const err = e as any;
    console.error('[email] 发送失败:', err?.message || err);
    return false;
  }
}
