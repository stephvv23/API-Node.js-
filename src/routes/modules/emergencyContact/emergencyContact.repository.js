

// Import PrismaClient from Prisma ORM
const { PrismaClient } = require('@prisma/client');

// Create a Prisma client instance to interact with the database
const prisma = new PrismaClient();

// Define a reusable selection of fields for queries
// (Ensures only these properties are returned from the database)
const baseSelect = {
  idEmergencyContact: true,
  nameEmergencyContact: true,
  emailEmergencyContact: true,
  identifier: true,
  status: true,
};


const EmergencyContactsRepository = {
  // Finds all emergency contacts
  findAll: async () => {
    return await prisma.emergencyContact.findMany({
      select: baseSelect,
    });
  },


  // Finds a single emergency contact by ID
  findById: (idEmergencyContact) =>
    prisma.emergencyContact.findUnique({
      where: { idEmergencyContact: Number(idEmergencyContact) },
      select: baseSelect,
    }),


  // Creates a new emergency contact
  create: (data) =>
    prisma.emergencyContact.create({
      data,
      select: baseSelect,
    }),


  // Updates an emergency contact by ID
  update: (idEmergencyContact, data) =>
    prisma.emergencyContact.update({
      where: { idEmergencyContact: Number(idEmergencyContact) },
      data,
      select: baseSelect,
    }),


  // Removes an emergency contact by ID
     // Removes an emergency contact by ID (Corrected)
  remove: async (idEmergencyContact) => {
    try {
      await prisma.emergencyContact.delete({
        where: { idEmergencyContact: Number(idEmergencyContact) },
      });
      return true; // Deletion was successful
    } catch (error) {
      if (error.code === 'P2025') {
        // Record to delete does not exist
        return false;
      }
      // Re-throw any other unexpected errors
      throw error;
    }
  },
};


module.exports = { EmergencyContactsRepository };