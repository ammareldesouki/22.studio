-- Settings: optional favicon image (separate from the logo).
ALTER TABLE "Settings" ADD COLUMN "faviconId" UUID;
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_faviconId_fkey"
  FOREIGN KEY ("faviconId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Client: how it renders on the public site — "both" (logo + name), "name", or "logo".
ALTER TABLE "Client" ADD COLUMN "displayMode" TEXT NOT NULL DEFAULT 'both';
