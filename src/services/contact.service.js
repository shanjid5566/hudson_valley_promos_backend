const nodemailer = require('nodemailer');

class ContactService {
  constructor() {
    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendContactMessage(data) {
    const { fullName, email, phone, projectType, message } = data;

    try {
      // Email to client
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.CLIENT_EMAIL || process.env.EMAIL_FROM,
        replyTo: email,
        subject: `New Contact Form Submission - ${projectType}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">
                New Contact Form Submission
              </h2>
              
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 10px 0; color: #555;">
                  <strong style="color: #333; display: inline-block; width: 140px;">Full Name:</strong> ${fullName}
                </p>
                <p style="margin: 10px 0; color: #555;">
                  <strong style="color: #333; display: inline-block; width: 140px;">Email:</strong> 
                  <a href="mailto:${email}" style="color: #4CAF50; text-decoration: none;">${email}</a>
                </p>
                <p style="margin: 10px 0; color: #555;">
                  <strong style="color: #333; display: inline-block; width: 140px;">Phone:</strong> 
                  <a href="tel:${phone}" style="color: #4CAF50; text-decoration: none;">${phone}</a>
                </p>
                <p style="margin: 10px 0; color: #555;">
                  <strong style="color: #333; display: inline-block; width: 140px;">Project Type:</strong> ${projectType}
                </p>
              </div>
              
              <div style="margin-top: 25px;">
                <h3 style="color: #333; margin-bottom: 15px;">Message:</h3>
                <div style="background-color: #f9f9f9; padding: 20px; border-left: 4px solid #4CAF50; border-radius: 4px;">
                  <p style="color: #555; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
                </div>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                This email was sent from the Hudson Valley Promos contact form.<br>
                Received on ${new Date().toLocaleString('en-US', { 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })}
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Contact form email sent successfully from ${email}`);

      // Optional: Send auto-reply to customer
      await this.sendAutoReply(email, fullName);

      return { 
        success: true, 
        messageId: result.messageId 
      };
    } catch (error) {
      console.error(`Failed to send contact form email:`, error);
      throw new Error(`Failed to send contact form: ${error.message}`);
    }
  }

  async sendAutoReply(email, fullName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Thank You for Contacting Hudson Valley Promos',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Thank You for Reaching Out!</h2>
              
              <p style="color: #666; font-size: 16px;">Hi ${fullName},</p>
              
              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                Thank you for contacting <strong>Hudson Valley Promos</strong>! We have received your message and our team will review it shortly.
              </p>
              
              <div style="background-color: #f0f0f0; padding: 20px; border-radius: 4px; margin: 30px 0; border-left: 4px solid #4CAF50;">
                <p style="color: #555; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>What happens next?</strong><br>
                  One of our team members will get back to you within 24-48 business hours to discuss your project and guide you through the best options for your needs.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Our team works with businesses and organizations throughout the Hudson Valley and beyond to provide:
              </p>
              
              <ul style="color: #666; font-size: 14px; line-height: 1.8;">
                <li>Custom Apparel & Promotional Products</li>
                <li>Signage & Printed Materials</li>
                <li>Awards & Plaques</li>
                <li>Screen Printing & Embroidery</li>
              </ul>
              
              <p style="color: #666; font-size: 14px; margin-top: 25px;">
                If you have any urgent questions, feel free to reach us directly at:
              </p>
              
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 8px 0; color: #555;">
                  <strong>Phone:</strong> 845.202.7600
                </p>
                <p style="margin: 8px 0; color: #555;">
                  <strong>Email:</strong> cs@hvpromos.com
                </p>
                <p style="margin: 8px 0; color: #555;">
                  <strong>Location:</strong> 10 Corporate Park Drive, Suite B, Hopewell Junction, NY 12533
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Hudson Valley Promos © ${new Date().getFullYear()}. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Auto-reply sent to ${email}`);
    } catch (error) {
      // Don't throw error for auto-reply failure
      console.error(`Failed to send auto-reply to ${email}:`, error);
    }
  }
}

module.exports = new ContactService();
