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

    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

export async function sendVerificationCode(email: string, code: string): Promise<{ ok: boolean; message: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, message: '服务器邮件服务未配置，请联系管理员' };

  // 重试 3 次，阿里云偶尔抽风
  for (let attempt = 1; attempt <= 3; attempt++) {
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
      return { ok: true, message: '' };
    } catch (e: unknown) {
      const err = e as any;
      console.error(`[email] 第${attempt}次发送失败:`, err?.message || err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1500)); // 等 1.5 秒再试
      }
    }
  }

  return { ok: false, message: '网络抖动，请稍后重试' };
}
