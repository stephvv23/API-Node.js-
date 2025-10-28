-- Add status field to EmergencyContactSurvivor table

ALTER TABLE `EmergencyContactSurvivor` 
ADD COLUMN `status` VARCHAR(25) NOT NULL DEFAULT 'active' AFTER `idSurvivor`;
