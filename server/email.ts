import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmailVerificationEmail(
  toEmail: string,
  verificationToken: string,
  baseUrl: string
): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY em falta. Envio de verificação ignorado.");
    return;
  }
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

  await resend.emails.send({
    from: "ServNtrak <onboarding@resend.dev>",
    to: toEmail,
    subject: "Verifica o teu email — ServNtrak",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #2D1B0E; margin-bottom: 8px;">Confirma o teu email</h2>
        <p style="color: #9B7B5E; margin-bottom: 24px;">
          Clica no botão abaixo para verificar o teu endereço de email e activar todas as funcionalidades da tua conta ServNtrak.
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: linear-gradient(to right, #F97316, #EAB308);
                  color: white; padding: 12px 24px; border-radius: 8px;
                  text-decoration: none; font-weight: 600; margin-bottom: 24px;">
          Verificar email
        </a>
        <p style="color: #9B7B5E; font-size: 14px;">
          Este link expira em <strong>24 horas</strong>.<br/>
          Se não criaste esta conta, podes ignorar este email.
        </p>
        <hr style="border: none; border-top: 1px solid #f0e8df; margin: 24px 0;" />
        <p style="color: #9B7B5E; font-size: 12px;">Peralta Gardens — ServNtrak</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  baseUrl: string
): Promise<void> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY em falta. Envio de recuperação ignorado.");
    return;
  }
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: "ServNtrak <onboarding@resend.dev>",
    to: toEmail,
    subject: "Recuperação de palavra-passe — ServNtrak",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #2D1B0E; margin-bottom: 8px;">Recuperação de palavra-passe</h2>
        <p style="color: #9B7B5E; margin-bottom: 24px;">
          Recebemos um pedido para redefinir a palavra-passe da tua conta ServNtrak.
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background: linear-gradient(to right, #F97316, #EAB308);
                  color: white; padding: 12px 24px; border-radius: 8px;
                  text-decoration: none; font-weight: 600; margin-bottom: 24px;">
          Redefinir palavra-passe
        </a>
        <p style="color: #9B7B5E; font-size: 14px;">
          Este link expira em <strong>1 hora</strong>.<br/>
          Se não pediste a recuperação, ignora este email.
        </p>
        <hr style="border: none; border-top: 1px solid #f0e8df; margin: 24px 0;" />
        <p style="color: #9B7B5E; font-size: 12px;">Peralta Gardens — ServNtrak</p>
      </div>
    `,
  });
}
