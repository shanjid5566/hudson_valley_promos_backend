-- CreateTable
CREATE TABLE "ProductStepConfiguration" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStepConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStep" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "stepTitle" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "stepOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStepOption" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "optionValue" TEXT NOT NULL,
    "subtext" TEXT,
    "colorHex" TEXT,
    "optionOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStepOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductStepConfiguration_serviceId_idx" ON "ProductStepConfiguration"("serviceId");

-- CreateIndex
CREATE INDEX "ProductStepConfiguration_categoryId_idx" ON "ProductStepConfiguration"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStepConfiguration_serviceId_categoryId_key" ON "ProductStepConfiguration"("serviceId", "categoryId");

-- CreateIndex
CREATE INDEX "ProductStep_configurationId_idx" ON "ProductStep"("configurationId");

-- CreateIndex
CREATE INDEX "ProductStepOption_stepId_idx" ON "ProductStepOption"("stepId");

-- AddForeignKey
ALTER TABLE "ProductStepConfiguration" ADD CONSTRAINT "ProductStepConfiguration_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStepConfiguration" ADD CONSTRAINT "ProductStepConfiguration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStep" ADD CONSTRAINT "ProductStep_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "ProductStepConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductStepOption" ADD CONSTRAINT "ProductStepOption_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProductStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
