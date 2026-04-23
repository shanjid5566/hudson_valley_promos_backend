const addressService = require('../services/address.service');

class AddressController {
  async getUserAddresses(req, res) {
    try {
      const userId = req.user.id;
      const addresses = await addressService.getUserAddresses(userId);
      res.status(200).json({ success: true, data: addresses });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createAddress(req, res) {
    try {
      const userId = req.user.id;
      const { type, street, city, state, zipCode } = req.body;

      if (!type || !street || !city || !state || !zipCode) {
        return res.status(400).json({ 
          success: false, 
          error: 'Type, street, city, state, and zipCode are required.' 
        });
      }

      const address = await addressService.createAddress(userId, req.body);
      res.status(201).json({ success: true, message: 'Address saved successfully', data: address });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateAddress(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const address = await addressService.updateAddress(userId, id, req.body);
      res.status(200).json({ success: true, message: 'Address updated successfully', data: address });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteAddress(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await addressService.deleteAddress(userId, id);
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AddressController();