// modules/emergencyContacts/emergencyContactService.js
const { EmergencyContactsRepository } = require('./emergencyContact.repository');


// EmergencyContactsService contains the business logic for emergency contacts.
// It interacts with EmergencyContactsRepository for all database actions.
const EmergencyContactsService = {
  // Returns a list of all emergency contacts
  list: () => EmergencyContactsRepository.findAll(),


  // Retrieves an emergency contact by id
  get: (idEmergencyContact) => EmergencyContactsRepository.findById(idEmergencyContact),


  // Creates a new emergency contact
  create: async (data) => {
    // You can add data validation or other business logic here before creating the contact.
    // For example: if (!data.nameEmergencyContact) throw new Error("Name is required");
    return EmergencyContactsRepository.create(data);
  },


  // Updates an emergency contact by id
  update: async (idEmergencyContact, data) => {
    // You can add logic to validate the update data here.
    return EmergencyContactsRepository.update(idEmergencyContact, data);
  },

  // Soft deletes an emergency contact by id (marks as inactive)
  softDelete: async (id) => {
    return await EmergencyContactsRepository.update(id, { status: 'inactive' });
  }

};

// Export the service for use in controllers
module.exports = { EmergencyContactsService };
