const { ActivityRepository } = require('./activity.repository');

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
      date: data.date,
      status: data.status || 'active'
    });
  },

  // Update an activity by ID.
  update: (idActivity, data) => {
    return ActivityRepository.update(idActivity, {
      idHeadquarter: data.idHeadquarter,
      title: data.title,
      description: data.description,
      type: data.type,
      modality: data.modality,
      capacity: data.capacity,
      location: data.location,
      date: data.date,
      status: data.status
    });
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
  }
};

module.exports = { ActivityService };
