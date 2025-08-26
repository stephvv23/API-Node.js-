-- CreateTable
CREATE TABLE `User` (
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `password` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAccess` (
    `loginIdAccess` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`loginIdAccess`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SecurityLog` (
    `securityIdLog` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `affectedTable` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`securityIdLog`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `idRole` INTEGER NOT NULL AUTO_INCREMENT,
    `rolName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`idRole`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Window` (
    `idWindow` INTEGER NOT NULL AUTO_INCREMENT,
    `windowName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',

    PRIMARY KEY (`idWindow`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `idRole` INTEGER NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`idRole`, `email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleWindow` (
    `idRole` INTEGER NOT NULL,
    `idWindow` INTEGER NOT NULL,
    `create` INTEGER NOT NULL,
    `read` INTEGER NOT NULL,
    `update` INTEGER NOT NULL,
    `delete` INTEGER NOT NULL,

    PRIMARY KEY (`idRole`, `idWindow`)
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
