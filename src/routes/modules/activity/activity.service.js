const { ActivityRepository } = require('./activity.repository');

// ActivityService contains business logic for activity operations.
// It interacts with ActivityRepository for database actions and handles validations.
const ActivityService = {
  // List all activities
  list: () => {
    return ActivityRepository.findAll();
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
      tittle: data.tittle,
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
      tittle: data.tittle,
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

  // Get activities by headquarter
  getByHeadquarter: (idHeadquarter) => {
    return ActivityRepository.findByHeadquarter(idHeadquarter);
  },

  // Get activities by date range
  getByDateRange: (startDate, endDate) => {
    return ActivityRepository.findByDateRange(startDate, endDate);
  },

  // Get activities by type
  getByType: (type) => {
    return ActivityRepository.findByType(type);
  },

  // Get activities by modality
  getByModality: (modality) => {
    return ActivityRepository.findByModality(modality);
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
