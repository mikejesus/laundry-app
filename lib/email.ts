import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPasswordResetEmailParams {
  email: string;
  resetUrl: string;
  firstName?: string | null;
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
  firstName,
}: SendPasswordResetEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "LaundryMS <onboarding@resend.dev>", // You can customize this later
      to: email,
      subject: "Reset Your Password - LaundryMS",
      html: getPasswordResetEmailTemplate(resetUrl, firstName),
    });

    if (error) {
      console.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }

    console.log("Password reset email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

function getPasswordResetEmailTemplate(resetUrl: string, firstName?: string | null): string {
  const greeting = firstName ? `Hi ${firstName}` : "Hello";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .link {
            color: #2563eb;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LaundryMS</div>
            <h2 style="margin: 0; color: #111827;">Reset Your Password</h2>
          </div>

          <div class="content">
            <p>${greeting},</p>

            <p>We received a request to reset your password for your LaundryMS account. If you didn't make this request, you can safely ignore this email.</p>

            <p>To reset your password, click the button below:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p class="link">${resetUrl}</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for security reasons. If you need a new reset link, you can request one from the login page.
            </div>
          </div>

          <div class="footer">
            <p>This email was sent by LaundryMS. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} LaundryMS. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface SendWelcomeEmailParams {
  email: string;
  firstName?: string | null;
  temporaryPassword?: string;
}

export async function sendWelcomeEmail({
  email,
  firstName,
  temporaryPassword,
}: SendWelcomeEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "LaundryMS <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to LaundryMS",
      html: getWelcomeEmailTemplate(firstName, temporaryPassword, email),
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      throw new Error("Failed to send welcome email");
    }

    console.log("Welcome email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

function getWelcomeEmailTemplate(firstName?: string | null, temporaryPassword?: string, email?: string): string {
  const greeting = firstName ? `Hi ${firstName}` : "Hello";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to LaundryMS</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            padding: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 14px 28px;
            background-color: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .credentials {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">LaundryMS</div>
            <h2 style="margin: 0; color: #111827;">Welcome to LaundryMS!</h2>
          </div>

          <div class="content">
            <p>${greeting},</p>

            <p>Your account has been created successfully. You can now access the LaundryMS platform to manage your laundry operations.</p>

            ${
              temporaryPassword
                ? `
              <div class="credentials">
                <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
              </div>

              <p><strong>⚠️ Important:</strong> Please change your password after your first login for security reasons.</p>
            `
                : ""
            }

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-in" class="button">Sign In Now</a>
            </div>
          </div>

          <div class="footer">
            <p>If you have any questions or need assistance, please don't hesitate to contact support.</p>
            <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} LaundryMS. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
