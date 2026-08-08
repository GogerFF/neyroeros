-- Add optional public author identity fields.
ALTER TABLE "User" ADD COLUMN "handle" TEXT;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
