-- CreateTable
CREATE TABLE "ServicePrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceType" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ServicePrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ServicePrice_userId_idx" ON "ServicePrice"("userId");

-- CreateIndex
CREATE INDEX "ServicePrice_serviceType_idx" ON "ServicePrice"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePrice_userId_serviceType_itemType_key" ON "ServicePrice"("userId", "serviceType", "itemType");
