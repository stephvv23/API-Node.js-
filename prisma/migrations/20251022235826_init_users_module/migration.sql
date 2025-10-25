-- CreateTable
CREATE TABLE `User` (
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',
    `password` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAccess` (
    `loginIdAccess` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(150) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`loginIdAccess`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityLog` (
    `securityIdLog` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(150) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(25) NOT NULL,
    `description` VARCHAR(4000) NOT NULL,
    `affectedTable` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`securityIdLog`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `idRole` INTEGER NOT NULL AUTO_INCREMENT,
    `rolName` VARCHAR(50) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    UNIQUE INDEX `Role_rolName_key`(`rolName`),
    PRIMARY KEY (`idRole`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Window` (
    `idWindow` INTEGER NOT NULL AUTO_INCREMENT,
    `windowName` VARCHAR(75) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    UNIQUE INDEX `Window_windowName_key`(`windowName`),
    PRIMARY KEY (`idWindow`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `idRole` INTEGER NOT NULL,
    `email` VARCHAR(150) NOT NULL,

    PRIMARY KEY (`idRole`, `email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleWindow` (
    `idRole` INTEGER NOT NULL,
    `idWindow` INTEGER NOT NULL,
    `create` BOOLEAN NOT NULL,
    `read` BOOLEAN NOT NULL,
    `update` BOOLEAN NOT NULL,
    `delete` BOOLEAN NOT NULL,

    PRIMARY KEY (`idRole`, `idWindow`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `idAsset` INTEGER NOT NULL AUTO_INCREMENT,
    `idCategory` INTEGER NOT NULL,
    `idHeadquarter` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `description` VARCHAR(750) NOT NULL,
    `status` VARCHAR(25) NOT NULL,

    PRIMARY KEY (`idAsset`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `idCategory` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `status` VARCHAR(25) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`idCategory`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Supplier` (
    `idSupplier` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `taxId` VARCHAR(20) NULL,
    `type` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `address` VARCHAR(150) NOT NULL,
    `paymentTerms` VARCHAR(50) NOT NULL,
    `description` VARCHAR(750) NOT NULL,
    `status` VARCHAR(25) NOT NULL,

    PRIMARY KEY (`idSupplier`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `idActivity` INTEGER NOT NULL AUTO_INCREMENT,
    `idHeadquarter` INTEGER NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(750) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `modality` VARCHAR(25) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `location` VARCHAR(300) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`idActivity`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Volunteer` (
    `idVolunteer` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `identifier` VARCHAR(30) NOT NULL,
    `country` VARCHAR(75) NOT NULL,
    `birthday` DATETIME(3) NOT NULL,
    `email` VARCHAR(80) NOT NULL,
    `residence` VARCHAR(300) NOT NULL,
    `modality` VARCHAR(20) NOT NULL,
    `institution` VARCHAR(100) NOT NULL,
    `availableSchedule` VARCHAR(300) NOT NULL,
    `requiredHours` INTEGER NULL,
    `startDate` DATETIME(3) NOT NULL,
    `finishDate` DATETIME(3) NULL,
    `imageAuthorization` BOOLEAN NOT NULL,
    `notes` VARCHAR(250) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`idVolunteer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Godparent` (
    `idGodparent` INTEGER NOT NULL AUTO_INCREMENT,
    `idSurvivor` INTEGER NULL,
    `idHeadquarter` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `paymentMethod` VARCHAR(50) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `finishDate` DATETIME(3) NULL,
    `description` VARCHAR(250) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`idGodparent`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyContact` (
    `idEmergencyContact` INTEGER NOT NULL AUTO_INCREMENT,
    `nameEmergencyContact` VARCHAR(150) NOT NULL,
    `emailEmergencyContact` VARCHAR(150) NOT NULL,
    `relationship` VARCHAR(50) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`idEmergencyContact`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Survivor` (
    `idSurvivor` INTEGER NOT NULL AUTO_INCREMENT,
    `idHeadquarter` INTEGER NOT NULL,
    `survivorName` VARCHAR(200) NOT NULL,
    `documentNumber` VARCHAR(30) NOT NULL,
    `country` VARCHAR(75) NOT NULL,
    `birthday` DATETIME(3) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `residence` VARCHAR(300) NOT NULL,
    `genre` VARCHAR(25) NOT NULL,
    `workingCondition` VARCHAR(50) NOT NULL,
    `CONAPDIS` BOOLEAN NOT NULL,
    `IMAS` BOOLEAN NOT NULL,
    `physicalFileStatus` VARCHAR(25) NOT NULL,
    `medicalRecord` VARCHAR(25) NOT NULL,
    `dateHomeSINRUBE` VARCHAR(25) NOT NULL,
    `foodBank` VARCHAR(25) NOT NULL,
    `socioEconomicStudy` VARCHAR(25) NOT NULL,
    `notes` VARCHAR(250) NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`idSurvivor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cancer` (
    `idCancer` INTEGER NOT NULL AUTO_INCREMENT,
    `cancerName` VARCHAR(100) NOT NULL,
    `description` VARCHAR(300) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    UNIQUE INDEX `Cancer_cancerName_key`(`cancerName`),
    PRIMARY KEY (`idCancer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Phone` (
    `idPhone` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` INTEGER NOT NULL,

    PRIMARY KEY (`idPhone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Headquarter` (
    `idHeadquarter` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `schedule` VARCHAR(300) NOT NULL,
    `location` VARCHAR(300) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `description` VARCHAR(750) NOT NULL,
    `status` VARCHAR(25) NOT NULL DEFAULT 'active',

    UNIQUE INDEX `Headquarter_name_key`(`name`),
    PRIMARY KEY (`idHeadquarter`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeadquarterUser` (
    `idHeadquarter` INTEGER NOT NULL,
    `email` VARCHAR(150) NOT NULL,

    PRIMARY KEY (`idHeadquarter`, `email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeadquarterVolunteer` (
    `idHeadquarter` INTEGER NOT NULL,
    `idVolunteer` INTEGER NOT NULL,

    PRIMARY KEY (`idHeadquarter`, `idVolunteer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeadquarterPhone` (
    `idHeadquarter` INTEGER NOT NULL,
    `idPhone` INTEGER NOT NULL,

    PRIMARY KEY (`idHeadquarter`, `idPhone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhoneSurvivor` (
    `idPhone` INTEGER NOT NULL,
    `idSurvivor` INTEGER NOT NULL,

    PRIMARY KEY (`idPhone`, `idSurvivor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhoneVolunteer` (
    `idPhone` INTEGER NOT NULL,
    `idVolunteer` INTEGER NOT NULL,

    PRIMARY KEY (`idPhone`, `idVolunteer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GodparentPhone` (
    `idGodparent` INTEGER NOT NULL,
    `idPhone` INTEGER NOT NULL,

    PRIMARY KEY (`idGodparent`, `idPhone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityVolunteer` (
    `idActivity` INTEGER NOT NULL,
    `idVolunteer` INTEGER NOT NULL,

    PRIMARY KEY (`idActivity`, `idVolunteer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivityGodparent` (
    `idActivity` INTEGER NOT NULL,
    `idGodparent` INTEGER NOT NULL,

    PRIMARY KEY (`idActivity`, `idGodparent`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActivitySurvivor` (
    `idActivity` INTEGER NOT NULL,
    `idSurvivor` INTEGER NOT NULL,

    PRIMARY KEY (`idActivity`, `idSurvivor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyContactVolunteer` (
    `idEmergencyContact` INTEGER NOT NULL,
    `idVolunteer` INTEGER NOT NULL,

    PRIMARY KEY (`idEmergencyContact`, `idVolunteer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyContactSurvivor` (
    `idEmergencyContact` INTEGER NOT NULL,
    `idSurvivor` INTEGER NOT NULL,

    PRIMARY KEY (`idEmergencyContact`, `idSurvivor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyContactPhone` (
    `idEmergencyContact` INTEGER NOT NULL,
    `idPhone` INTEGER NOT NULL,

    PRIMARY KEY (`idEmergencyContact`, `idPhone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CancerSurvivor` (
    `idCancer` INTEGER NOT NULL,
    `idSurvivor` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `aftermath` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`idCancer`, `idSurvivor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategorySupplier` (
    `idCategory` INTEGER NOT NULL,
    `idSupplier` INTEGER NOT NULL,

    PRIMARY KEY (`idCategory`, `idSupplier`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhoneSupplier` (
    `idPhone` INTEGER NOT NULL,
    `idSupplier` INTEGER NOT NULL,

    PRIMARY KEY (`idPhone`, `idSupplier`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HeadquarterSupplier` (
    `idHeadquarter` INTEGER NOT NULL,
    `idSupplier` INTEGER NOT NULL,

    PRIMARY KEY (`idHeadquarter`, `idSupplier`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LoginAccess` ADD CONSTRAINT `LoginAccess_email_fkey` FOREIGN KEY (`email`) REFERENCES `User`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SecurityLog` ADD CONSTRAINT `SecurityLog_email_fkey` FOREIGN KEY (`email`) REFERENCES `User`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_idRole_fkey` FOREIGN KEY (`idRole`) REFERENCES `Role`(`idRole`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_email_fkey` FOREIGN KEY (`email`) REFERENCES `User`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleWindow` ADD CONSTRAINT `RoleWindow_idRole_fkey` FOREIGN KEY (`idRole`) REFERENCES `Role`(`idRole`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleWindow` ADD CONSTRAINT `RoleWindow_idWindow_fkey` FOREIGN KEY (`idWindow`) REFERENCES `Window`(`idWindow`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_idCategory_fkey` FOREIGN KEY (`idCategory`) REFERENCES `Category`(`idCategory`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Godparent` ADD CONSTRAINT `Godparent_idSurvivor_fkey` FOREIGN KEY (`idSurvivor`) REFERENCES `Survivor`(`idSurvivor`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Godparent` ADD CONSTRAINT `Godparent_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Survivor` ADD CONSTRAINT `Survivor_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterUser` ADD CONSTRAINT `HeadquarterUser_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterUser` ADD CONSTRAINT `HeadquarterUser_email_fkey` FOREIGN KEY (`email`) REFERENCES `User`(`email`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterVolunteer` ADD CONSTRAINT `HeadquarterVolunteer_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterVolunteer` ADD CONSTRAINT `HeadquarterVolunteer_idVolunteer_fkey` FOREIGN KEY (`idVolunteer`) REFERENCES `Volunteer`(`idVolunteer`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterPhone` ADD CONSTRAINT `HeadquarterPhone_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterPhone` ADD CONSTRAINT `HeadquarterPhone_idPhone_fkey` FOREIGN KEY (`idPhone`) REFERENCES `Phone`(`idPhone`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneSurvivor` ADD CONSTRAINT `PhoneSurvivor_idPhone_fkey` FOREIGN KEY (`idPhone`) REFERENCES `Phone`(`idPhone`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneSurvivor` ADD CONSTRAINT `PhoneSurvivor_idSurvivor_fkey` FOREIGN KEY (`idSurvivor`) REFERENCES `Survivor`(`idSurvivor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneVolunteer` ADD CONSTRAINT `PhoneVolunteer_idPhone_fkey` FOREIGN KEY (`idPhone`) REFERENCES `Phone`(`idPhone`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneVolunteer` ADD CONSTRAINT `PhoneVolunteer_idVolunteer_fkey` FOREIGN KEY (`idVolunteer`) REFERENCES `Volunteer`(`idVolunteer`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GodparentPhone` ADD CONSTRAINT `GodparentPhone_idGodparent_fkey` FOREIGN KEY (`idGodparent`) REFERENCES `Godparent`(`idGodparent`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GodparentPhone` ADD CONSTRAINT `GodparentPhone_idPhone_fkey` FOREIGN KEY (`idPhone`) REFERENCES `Phone`(`idPhone`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityVolunteer` ADD CONSTRAINT `ActivityVolunteer_idActivity_fkey` FOREIGN KEY (`idActivity`) REFERENCES `Activity`(`idActivity`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityVolunteer` ADD CONSTRAINT `ActivityVolunteer_idVolunteer_fkey` FOREIGN KEY (`idVolunteer`) REFERENCES `Volunteer`(`idVolunteer`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityGodparent` ADD CONSTRAINT `ActivityGodparent_idActivity_fkey` FOREIGN KEY (`idActivity`) REFERENCES `Activity`(`idActivity`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityGodparent` ADD CONSTRAINT `ActivityGodparent_idGodparent_fkey` FOREIGN KEY (`idGodparent`) REFERENCES `Godparent`(`idGodparent`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivitySurvivor` ADD CONSTRAINT `ActivitySurvivor_idActivity_fkey` FOREIGN KEY (`idActivity`) REFERENCES `Activity`(`idActivity`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivitySurvivor` ADD CONSTRAINT `ActivitySurvivor_idSurvivor_fkey` FOREIGN KEY (`idSurvivor`) REFERENCES `Survivor`(`idSurvivor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContactVolunteer` ADD CONSTRAINT `EmergencyContactVolunteer_idEmergencyContact_fkey` FOREIGN KEY (`idEmergencyContact`) REFERENCES `EmergencyContact`(`idEmergencyContact`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContactVolunteer` ADD CONSTRAINT `EmergencyContactVolunteer_idVolunteer_fkey` FOREIGN KEY (`idVolunteer`) REFERENCES `Volunteer`(`idVolunteer`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContactSurvivor` ADD CONSTRAINT `EmergencyContactSurvivor_idEmergencyContact_fkey` FOREIGN KEY (`idEmergencyContact`) REFERENCES `EmergencyContact`(`idEmergencyContact`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContactSurvivor` ADD CONSTRAINT `EmergencyContactSurvivor_idSurvivor_fkey` FOREIGN KEY (`idSurvivor`) REFERENCES `Survivor`(`idSurvivor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContactPhone` ADD CONSTRAINT `EmergencyContactPhone_idEmergencyContact_fkey` FOREIGN KEY (`idEmergencyContact`) REFERENCES `EmergencyContact`(`idEmergencyContact`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContactPhone` ADD CONSTRAINT `EmergencyContactPhone_idPhone_fkey` FOREIGN KEY (`idPhone`) REFERENCES `Phone`(`idPhone`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CancerSurvivor` ADD CONSTRAINT `CancerSurvivor_idCancer_fkey` FOREIGN KEY (`idCancer`) REFERENCES `Cancer`(`idCancer`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CancerSurvivor` ADD CONSTRAINT `CancerSurvivor_idSurvivor_fkey` FOREIGN KEY (`idSurvivor`) REFERENCES `Survivor`(`idSurvivor`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategorySupplier` ADD CONSTRAINT `CategorySupplier_idCategory_fkey` FOREIGN KEY (`idCategory`) REFERENCES `Category`(`idCategory`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategorySupplier` ADD CONSTRAINT `CategorySupplier_idSupplier_fkey` FOREIGN KEY (`idSupplier`) REFERENCES `Supplier`(`idSupplier`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneSupplier` ADD CONSTRAINT `PhoneSupplier_idPhone_fkey` FOREIGN KEY (`idPhone`) REFERENCES `Phone`(`idPhone`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneSupplier` ADD CONSTRAINT `PhoneSupplier_idSupplier_fkey` FOREIGN KEY (`idSupplier`) REFERENCES `Supplier`(`idSupplier`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterSupplier` ADD CONSTRAINT `HeadquarterSupplier_idHeadquarter_fkey` FOREIGN KEY (`idHeadquarter`) REFERENCES `Headquarter`(`idHeadquarter`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HeadquarterSupplier` ADD CONSTRAINT `HeadquarterSupplier_idSupplier_fkey` FOREIGN KEY (`idSupplier`) REFERENCES `Supplier`(`idSupplier`) ON DELETE RESTRICT ON UPDATE CASCADE;
