const contactService = require('../services/contact.service');

class ContactController {
  async submitContactForm(req, res) {
    try {
      const { fullName, email, phone, projectType, message } = req.body;

      // Validation
      if (!fullName || !email || !phone || !projectType || !message) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required: fullName, email, phone, projectType, and message'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address'
        });
      }

      // Project type validation
      const validProjectTypes = [
        'Select a Project Type',
        'Promotional Products',
        'Custom Apparel',
        'Signage',
        'Awards & Plaques',
        'Screen Printing',
        'Embroidery',
        'Other'
      ];

      if (!validProjectTypes.includes(projectType) || projectType === 'Select a Project Type') {
        return res.status(400).json({
          success: false,
          error: 'Please select a valid project type'
        });
      }

      // Send email
      await contactService.sendContactMessage({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        projectType: projectType.trim(),
        message: message.trim()
      });

      res.status(200).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you within 24-48 business hours.'
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send your message. Please try again or contact us directly.'
      });
    }
  }
}

module.exports = new ContactController();
