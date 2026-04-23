const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { verifyUserOrAdminToken } = require('../middleware/admin.middleware');

/**
 * User Address Routes
 * Base path: /api/users/addresses
 */

router.get('/', verifyUserOrAdminToken, addressController.getUserAddresses.bind(addressController));
router.post('/', verifyUserOrAdminToken, addressController.createAddress.bind(addressController));
router.put('/:id', verifyUserOrAdminToken, addressController.updateAddress.bind(addressController));
router.delete('/:id', verifyUserOrAdminToken, addressController.deleteAddress.bind(addressController));

module.exports = router;