const { ActivityRepository } = require('./activity.repository');
const { ValidationRules } = require('../../../utils/validator');

// ActivityService contains business logic for activity operations.
// It interacts with ActivityRepository for database actions and handles validations.
const ActivityService = {
  // List all activities with optional filters
  list: (filters = {}) => {
    return ActivityRepository.findAll(filters);
  },

  // Get an activity by its ID.
  get: (idActivity) => {
    return ActivityRepository.findById(idActivity);
  },

  // Find an activity by its title.
  findByTitle: (title) => {
    return ActivityRepository.findByTitle(title);
  },

  // Create a new activity.
  create: (data) => {
    return ActivityRepository.create({
      idHeadquarter: data.idHeadquarter,
      title: data.title,
      description: data.description,
      type: data.type,
      modality: data.modality,
      capacity: data.capacity,
      location: data.location,
      date: data.date ? ValidationRules.parseDate(data.date) : new Date(),
      status: data.status || 'active'
    });
  },

  // Update an activity by ID.
  update: (idActivity, data) => {
    // Filter to only include valid activity fields
    const validFields = ['idHeadquarter', 'title', 'description', 'type', 'modality', 'capacity', 'location', 'date', 'status'];
    const filteredUpdateData = {};
    for (const field of validFields) {
      if (data[field] !== undefined) {
        filteredUpdateData[field] = data[field];
      }
    }
    
    // Convert date string to Date object if it exists, using parseDate for timezone adjustment
    if (filteredUpdateData.date) {
      filteredUpdateData.date = ValidationRules.parseDate(filteredUpdateData.date);
    }
    
    return ActivityRepository.update(idActivity, filteredUpdateData);
  },

  // Soft-delete an activity (set status to 'inactive').
  delete: (idActivity) => {
    return ActivityRepository.update(idActivity, {
      status: 'inactive'
    });
  },


  // Get activity with all relations
  getWithRelations: (idActivity) => {
    return ActivityRepository.findByIdWithRelations(idActivity);
  },

  // Check if headquarter exists
  checkHeadquarterExists: (idHeadquarter) => {
    return ActivityRepository.checkHeadquarterExists(idHeadquarter);
  },

  // Get all lookup data needed for activity assignment
  getLookupData: () => {
    return ActivityRepository.getLookupData();
  },

  // Get volunteers assigned to a specific activity
  getVolunteers: (idActivity) => {
    return ActivityRepository.getVolunteers(idActivity);
  },

  // Get survivors assigned to a specific activity
  getSurvivors: (idActivity) => {
    return ActivityRepository.getSurvivors(idActivity);
  },

  // Get godparents assigned to a specific activity
  getGodparents: (idActivity) => {
    return ActivityRepository.getGodparents(idActivity);
  },

  // Assign volunteers to activity
  assignVolunteers: (idActivity, volunteerIds) => {
    return ActivityRepository.assignVolunteers(idActivity, volunteerIds);
  },

  // Remove volunteers from activity
  removeVolunteers: (idActivity, volunteerIds) => {
    return ActivityRepository.removeVolunteers(idActivity, volunteerIds);
  },

  // Assign survivors to activity
  assignSurvivors: (idActivity, survivorIds) => {
    return ActivityRepository.assignSurvivors(idActivity, survivorIds);
  },

  // Remove survivors from activity
  removeSurvivors: (idActivity, survivorIds) => {
    return ActivityRepository.removeSurvivors(idActivity, survivorIds);
  },

  // Assign godparents to activity
  assignGodparents: (idActivity, godparentIds) => {
    return ActivityRepository.assignGodparents(idActivity, godparentIds);
  },

  // Remove godparents from activity
  removeGodparents: (idActivity, godparentIds) => {
    return ActivityRepository.removeGodparents(idActivity, godparentIds);
  },

  // Validation methods
  validateVolunteersExist: (volunteerIds) => {
    return ActivityRepository.validateVolunteersExist(volunteerIds);
  },

  validateSurvivorsExist: (survivorIds) => {
    return ActivityRepository.validateSurvivorsExist(survivorIds);
  },

  validateGodparentsExist: (godparentIds) => {
    return ActivityRepository.validateGodparentsExist(godparentIds);
  },

  // Get valid records and filter out invalid ones
  getValidVolunteers: (volunteerIds) => {
    return ActivityRepository.getValidVolunteers(volunteerIds);
  },

  getValidSurvivors: (survivorIds) => {
    return ActivityRepository.getValidSurvivors(survivorIds);
  },

  getValidGodparents: (godparentIds) => {
    return ActivityRepository.getValidGodparents(godparentIds);
  }
};

module.exports = { ActivityService };
