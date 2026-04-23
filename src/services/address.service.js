const prisma = require('../utils/prisma');

class AddressService {
  async getUserAddresses(userId) {
    try {
      const addresses = await prisma.address.findMany({
        where: { 
          userId: userId,
        },
        orderBy: { createdAt: 'desc' }
      });
      return addresses;
    } catch (error) {
      throw new Error(`Failed to fetch addresses: ${error.message}`);
    }
  }

  async createAddress(userId, data) {
    const { type, company, street, city, state, zipCode, isDefault } = data;

    try {
      if (!['BILLING', 'SHIPPING'].includes(type)) {
        throw new Error('Invalid address type. Must be BILLING or SHIPPING.');
      }

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId, type },
          data: { isDefault: false }
        });
      }

      const address = await prisma.address.create({
        data: {
          userId,
          type,
          company: company || null,
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
          isDefault: Boolean(isDefault)
        }
      });

      return address;
    } catch (error) {
      throw new Error(`Failed to create address: ${error.message}`);
    }
  }

  async updateAddress(userId, addressId, data) {
    const { company, street, city, state, zipCode, isDefault } = data;

    try {
      const existingAddress = await prisma.address.findUnique({
        where: { id: addressId }
      });

      if (!existingAddress || existingAddress.userId !== userId) {
        throw new Error('Address not found or unauthorized');
      }

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId, type: existingAddress.type },
          data: { isDefault: false }
        });
      }

      const updateData = {};
      if (company !== undefined) updateData.company = company;
      if (street !== undefined) updateData.street = street.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (state !== undefined) updateData.state = state.trim();
      if (zipCode !== undefined) updateData.zipCode = zipCode.trim();
      if (isDefault !== undefined) updateData.isDefault = Boolean(isDefault);

      const updatedAddress = await prisma.address.update({
        where: { id: addressId },
        data: updateData
      });

      return updatedAddress;
    } catch (error) {
      throw new Error(`Failed to update address: ${error.message}`);
    }
  }

  async deleteAddress(userId, addressId) {
    try {
      const existingAddress = await prisma.address.findUnique({
        where: { id: addressId }
      });

      if (!existingAddress || existingAddress.userId !== userId) {
        throw new Error('Address not found or unauthorized');
      }

      // Check if address is being used by any orders
      const ordersUsingAddress = await prisma.order.findFirst({
        where: { shippingAddressId: addressId }
      });

      if (ordersUsingAddress) {
        throw new Error('Cannot delete address. It is associated with existing orders.');
      }

      await prisma.address.delete({
        where: { id: addressId }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete address: ${error.message}`);
    }
  }
}

module.exports = new AddressService();