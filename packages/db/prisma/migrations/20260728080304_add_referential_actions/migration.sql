-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_logoId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMedia" DROP CONSTRAINT "ProjectMedia_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectService" DROP CONSTRAINT "ProjectService_projectId_fkey";

-- DropForeignKey
ALTER TABLE "RelatedProject" DROP CONSTRAINT "RelatedProject_projectId_fkey";

-- DropForeignKey
ALTER TABLE "RelatedProject" DROP CONSTRAINT "RelatedProject_relatedProjectId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_iconMediaId_fkey";

-- DropForeignKey
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_logoId_fkey";

-- DropForeignKey
ALTER TABLE "SubService" DROP CONSTRAINT "SubService_serviceId_fkey";

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_iconMediaId_fkey" FOREIGN KEY ("iconMediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubService" ADD CONSTRAINT "SubService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectService" ADD CONSTRAINT "ProjectService_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMedia" ADD CONSTRAINT "ProjectMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedProject" ADD CONSTRAINT "RelatedProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedProject" ADD CONSTRAINT "RelatedProject_relatedProjectId_fkey" FOREIGN KEY ("relatedProjectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
