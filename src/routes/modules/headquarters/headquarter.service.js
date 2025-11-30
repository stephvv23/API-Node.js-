const { HeadquarterRepository } = require('./headquarter.repository');

const HeadquarterService = {
  // Lists all headquarters (active and inactive)
  list: async () => {
    return HeadquarterRepository.list();
  },
  // Retrieves a headquarter by id
  findById: async (id) => {
    return HeadquarterRepository.findById(id);
  },
  findbyname: async (name) => {
    return HeadquarterRepository.findbyname(name);
  },
  findbyemail: async (email) => {
    return HeadquarterRepository.findbyemail(email);
  },
  // Creates a new headquarter
  create: async (data) => {
    return HeadquarterRepository.create({
      name: data.name,
      schedule: data.schedule,
      location: data.location,
      email: data.email,
      description: data.description,
      status: data.status || "active"
    });
  },
  // Updates headquarter data by id
  update: async (id, data) => {
    return HeadquarterRepository.update(id, data);
  },
  // Updates only the headquarter status by id
  updateStatus: async (id, status) => {
    return HeadquarterRepository.update(id, { status });
  },
  // Deletes a headquarter by id
  remove: async (id, status) => {
    return HeadquarterRepository.update(id, { status: "inactive" });
  },
};

module.exports = { HeadquarterService };
