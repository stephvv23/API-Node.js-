// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Seeding...');

  /* ===================== ROLES Y VENTANAS ===================== */
  const adminRole = await prisma.role.create({
    data: { rolName: 'ADMIN', status: 'active' },
  });
  const coordinatorRole = await prisma.role.create({
    data: { rolName: 'COORDINATOR', status: 'active' },
  });

  const windows = await Promise.all(
    ['Assets', 'Suppliers', 'Survivors', 'Activities', 'Users', 'Categories', 'headquarters', 'EmergencyContacts', 'Volunteers', 'GodParents', 'Cancers', 'Phones', 'Roles'].map((w) =>
      prisma.window.create({ data: { windowName: w, status: 'active' } })
    )
  );

  /* ===================== USUARIOS / ROLES ===================== */
  const admin = await prisma.user.create({
    data: {
      email: 'admin@funca.org',
      name: 'Admin Funca',
      status: 'active',
      password: 'Admin#123', // solo demo
    },
  });

  const coordinator = await prisma.user.create({
    data: {
      email: 'coordinator@funca.org',
      name: 'Coordinador Sede Central',
      status: 'active',
      password: 'Coord#123', // solo demo
    },
  });

  await prisma.userRole.createMany({
    data: [
      { idRole: adminRole.idRole, email: admin.email },
      { idRole: coordinatorRole.idRole, email: coordinator.email },
    ],
  });

  // Permisos RoleWindow
  await Promise.all(
    windows.map((win) =>
      prisma.roleWindow.create({
        data: {
          idRole: adminRole.idRole,
          idWindow: win.idWindow,
          create: true,
          read: true,
          update: true,
          delete: true,
        },
      })
    )
  );

  await prisma.roleWindow.createMany({
    data: [
      {
        idRole: coordinatorRole.idRole,
        idWindow: windows[0].idWindow, // Assets
        create: false,
        read: true,
        update: true,
        delete: false,
      },
      {
        idRole: coordinatorRole.idRole,
        idWindow: windows[1].idWindow, // Suppliers
        create: false,
        read: true,
        update: true,
        delete: false,
      },
      {
        idRole: coordinatorRole.idRole,
        idWindow: windows[2].idWindow, // Survivors
        create: false,
        read: true,
        update: true,
        delete: false,
      },
      {
        idRole: coordinatorRole.idRole,
        idWindow: windows[3].idWindow, // Activities
        create: true,
        read: true,
        update: true,
        delete: false,
      },
      {
        idRole: coordinatorRole.idRole,
        idWindow: windows[4].idWindow, // Security
        create: false,
        read: true,
        update: false,
        delete: false,
      },
    ],
  });

  await prisma.loginAccess.createMany({
    data: [
      { email: admin.email, date: new Date('2025-08-30T09:00:00.000Z') },
      { email: coordinator.email, date: new Date('2025-08-30T09:15:00.000Z') },
    ],
  });

  await prisma.securityLog.createMany({
    data: [
      {
        email: admin.email,
        date: new Date('2025-08-30T09:00:05.000Z'),
        action: 'LOGIN',
        description: 'Inicio de sesión exitoso',
        affectedTable: 'User',
      },
      {
        email: admin.email,
        date: new Date('2025-08-30T09:05:00.000Z'),
        action: 'CREATE',
        description: 'Registro de sede y categorías iniciales',
        affectedTable: 'Headquarter',
      },
      {
        email: coordinator.email,
        date: new Date('2025-08-30T09:16:00.000Z'),
        action: 'LOGIN',
        description: 'Inicio de sesión exitoso',
        affectedTable: 'User',
      },
    ],
  });

  /* ===================== HEADQUARTERS / CATEGORY ===================== */
  const [hq1, hq2] = await Promise.all([
    prisma.headquarter.create({
      data: {
        name: 'Sede Central',
        schedule: 'L-V 8:00-17:00',
        location: 'San José, Costa Rica',
        email: 'central@funca.org',
        description: 'Sede administrativa y de atención',
        status: 'active',
      },
    }),
    prisma.headquarter.create({
      data: {
        name: 'Sede Pacífico',
        schedule: 'L-V 8:00-16:00',
        location: 'Puntarenas, Costa Rica',
        email: 'pacifico@funca.org',
        description: 'Cobertura región Pacífico',
        status: 'active',
      },
    }),
  ]);

  const [cat1, cat2] = await Promise.all([
    prisma.category.create({ data: { name: 'Equipos médicos', status: 'active' } }),
    prisma.category.create({ data: { name: 'Mobiliario', status: 'active' } }),
  ]);

  /* ===================== SUPPLIERS ===================== */
  const [sup1, sup2] = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Meditech CR',
        taxId: '3-101-123456',
        type: 'Empresa',
        email: 'soporte@meditech.cr',
        address: 'San José, Curridabat',
        paymentTerms: '30 días',
        description: 'Proveedor de equipos médicos',
        status: 'active',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Muebles PZ',
        taxId: '3-102-654321',
        type: 'Empresa',
        email: 'ventas@mueblespz.cr',
        address: 'Pérez Zeledón',
        paymentTerms: 'Contado',
        description: 'Mobiliario para salas de espera',
        status: 'active',
      },
    }),
  ]);

  /* ===================== PHONES ===================== */
  const phoneObjs = await Promise.all(
    [88881234, 22223333, 70707070, 60501234, 70112233, 89112233, 24567890, 88885555, 40001234, 24501234].map(
      (p) => prisma.phone.create({ data: { phone: p } })
    )
  );

  /* ===================== VOLUNTEER / SURVIVOR / CANCER ===================== */
  const volunteer = await prisma.volunteer.create({
    data: {
      name: 'María Fernández',
      identifier: '1-2345-0678',
      country: 'Costa Rica',
      birthday: new Date('2001-05-10'),
      email: 'maria.fernandez@example.com',
      residence: 'San Ramón, Alajuela',
      modality: 'TCU',
      institution: 'UCR',
      availableSchedule: 'L-V 8:00-12:00',
      requiredHours: 150,
      startDate: new Date('2025-08-01'),
      finishDate: null,
      imageAuthorization: true,
      notes: 'Interés en logística y ferias',
      status: 'active',
    },
  });

  const survivor = await prisma.survivor.create({
    data: {
      idHeadquarter: hq1.idHeadquarter,
      survivorName: 'José Pérez',
      documentNumber: '2-3456-0789',
      country: 'Costa Rica',
      birthday: new Date('1980-03-12'),
      email: 'jose.perez@example.com',
      residence: 'Alajuela, Costa Rica',
      genre: 'Masculino',
      workingCondition: 'Desempleado',
      CONAPDIS: true,
      IMAS: false,
      physicalFileStatus: 'Completo',
      medicalRecord: 'Activo',
      dateHomeSINRUBE: '2023-10-05',
      foodBank: 'Activo',
      socioEconomicStudy: 'Completado',
      notes: 'Requiere apoyo de transporte',
      status: 'active',
    },
  });

  const cancer1 = await prisma.cancer.create({
    data: {
      cancerName: 'Cáncer de mama',
      description: 'Tratamiento oncológico y acompañamiento psicosocial',
      status: 'active',
    },
  });
  const cancer2 = await prisma.cancer.create({
    data: {
      cancerName: 'Cáncer de próstata',
      description: 'Seguimiento y control',
      status: 'active',
    },
  });

  await prisma.cancerSurvivor.create({
    data: {
      idCancer: cancer1.idCancer,
      idSurvivor: survivor.idSurvivor,
      status: 'en recuperación',
      aftermath: 'quimioterapia 2023, seguimiento 2024',
    },
  });

  /* ===================== GODPARENT ===================== */
  const godparent = await prisma.godparent.create({
    data: {
      idSurvivor: survivor.idSurvivor,
      idHeadquarter: hq1.idHeadquarter,
      name: 'Ana Gómez',
      email: 'ana.gomez@example.com',
      paymentMethod: 'Transferencia',
      startDate: new Date('2025-01-15'),
      finishDate: null,
      description: 'Aporte mensual de ₡20.000',
      status: 'active',
    },
  });

  /* ===================== ACTIVITIES ===================== */
  const activity = await prisma.activity.create({
    data: {
      idHeadquarter: hq1.idHeadquarter,
      tittle: 'Jornada de acompañamiento',
      description: 'Taller de acompañamiento y orientación a familias',
      type: 'Taller',
      modality: 'Presencial',
      capacity: 30,
      location: 'Sede Central - Auditorio',
      date: new Date('2025-09-15T09:00:00'),
      status: 'active',
    },
  });

  await prisma.activityVolunteer.create({
    data: { idActivity: activity.idActivity, idVolunteer: volunteer.idVolunteer },
  });
  await prisma.activitySurvivor.create({
    data: { idActivity: activity.idActivity, idSurvivor: survivor.idSurvivor },
  });
  await prisma.activityGodparent.create({
    data: { idActivity: activity.idActivity, idGodparent: godparent.idGodparent },
  });

  /* ===================== ASSETS ===================== */
  await prisma.asset.create({
    data: {
      idCategory: cat1.idCategory,
      idHeadquarter: hq1.idHeadquarter,
      name: 'Electrocardiógrafo',
      type: 'Equipo',
      description: 'ECG portátil de 12 derivaciones',
      status: 'operativo',
    },
  });
  await prisma.asset.create({
    data: {
      idCategory: cat2.idCategory,
      idHeadquarter: hq2.idHeadquarter,
      name: 'Sillas de espera',
      type: 'Mobiliario',
      description: 'Juego de 10 sillas metálicas',
      status: 'operativo',
    },
  });

  /* ===================== RELACIONES / PUENTES ===================== */
  // Usuarios por sede
  await prisma.headquarterUser.createMany({
    data: [
      { idHeadquarter: hq1.idHeadquarter, email: admin.email },
      { idHeadquarter: hq1.idHeadquarter, email: coordinator.email },
      { idHeadquarter: hq2.idHeadquarter, email: coordinator.email },
    ],
  });

  // Voluntarios por sede
  await prisma.headquarterVolunteer.create({
    data: { idHeadquarter: hq1.idHeadquarter, idVolunteer: volunteer.idVolunteer },
  });

  // Teléfonos por sede
  await prisma.headquarterPhone.createMany({
    data: [
      { idHeadquarter: hq1.idHeadquarter, idPhone: phoneObjs[0].idPhone }, // 8888-1234
      { idHeadquarter: hq1.idHeadquarter, idPhone: phoneObjs[1].idPhone }, // 2222-3333
      { idHeadquarter: hq2.idHeadquarter, idPhone: phoneObjs[2].idPhone }, // 7070-7070
    ],
  });

  // Teléfonos de personas
  await prisma.phoneSurvivor.create({
    data: { idPhone: phoneObjs[3].idPhone, idSurvivor: survivor.idSurvivor }, // 6050-1234
  });
  await prisma.phoneVolunteer.create({
    data: { idPhone: phoneObjs[4].idPhone, idVolunteer: volunteer.idVolunteer }, // 7011-2233
  });
  await prisma.godparentPhone.create({
    data: { idGodparent: godparent.idGodparent, idPhone: phoneObjs[5].idPhone }, // 8911-2233
  });

  // Contactos de emergencia
  const [ec1, ec2] = await Promise.all([
    prisma.emergencyContact.create({
      data: {
        nameEmergencyContact: 'Carlos Fernández',
        emailEmergencyContact: 'carlos.fernandez@example.com',
        relationship: 'Padre',
        status: 'active',
      },
    }),
    prisma.emergencyContact.create({
      data: {
        nameEmergencyContact: 'Laura Pérez',
        emailEmergencyContact: 'laura.perez@example.com',
        relationship: 'Esposa',
        status: 'active',
      },
    }),
  ]);

  await prisma.emergencyContactVolunteer.create({
    data: { idEmergencyContact: ec1.idEmergencyContact, idVolunteer: volunteer.idVolunteer },
  });
  await prisma.emergencyContactSurvivor.create({
    data: { idEmergencyContact: ec2.idEmergencyContact, idSurvivor: survivor.idSurvivor },
  });

  await prisma.emergencyContactPhone.createMany({
    data: [
      { idEmergencyContact: ec1.idEmergencyContact, idPhone: phoneObjs[6].idPhone }, // 2456-7890
      { idEmergencyContact: ec2.idEmergencyContact, idPhone: phoneObjs[7].idPhone }, // 8888-5555
    ],
  });

  // Proveedores por categoría / teléfonos / sede
  await prisma.categorySupplier.createMany({
    data: [
      { idCategory: cat1.idCategory, idSupplier: sup1.idSupplier }, // Meditech → Equipos médicos
      { idCategory: cat2.idCategory, idSupplier: sup2.idSupplier }, // Muebles PZ → Mobiliario
    ],
  });

  await prisma.phoneSupplier.createMany({
    data: [
      { idPhone: phoneObjs[8].idPhone, idSupplier: sup1.idSupplier }, // 4000-1234
      { idPhone: phoneObjs[9].idPhone, idSupplier: sup2.idSupplier }, // 2450-1234
    ],
  });

  await prisma.headquarterSupplier.createMany({
    data: [
      { idHeadquarter: hq1.idHeadquarter, idSupplier: sup1.idSupplier },
      { idHeadquarter: hq2.idHeadquarter, idSupplier: sup2.idSupplier },
    ],
  });

  console.log('✅ Seed completado con éxito');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
