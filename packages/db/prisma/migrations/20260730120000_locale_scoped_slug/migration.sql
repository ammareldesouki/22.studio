-- Slugs are now unique per locale (not globally), so the same base slug can exist
-- once in English and once in Arabic. Drop the global unique index on `slug` and
-- replace it with a composite unique index on (`slug`, `locale`) for every content type.

-- Client
DROP INDEX "Client_slug_key";
CREATE UNIQUE INDEX "Client_slug_locale_key" ON "Client"("slug", "locale");

-- Service
DROP INDEX "Service_slug_key";
CREATE UNIQUE INDEX "Service_slug_locale_key" ON "Service"("slug", "locale");

-- Project
DROP INDEX "Project_slug_key";
CREATE UNIQUE INDEX "Project_slug_locale_key" ON "Project"("slug", "locale");

-- HomepageSection
DROP INDEX "HomepageSection_slug_key";
CREATE UNIQUE INDEX "HomepageSection_slug_locale_key" ON "HomepageSection"("slug", "locale");

-- Testimonial
DROP INDEX "Testimonial_slug_key";
CREATE UNIQUE INDEX "Testimonial_slug_locale_key" ON "Testimonial"("slug", "locale");

-- Page
DROP INDEX "Page_slug_key";
CREATE UNIQUE INDEX "Page_slug_locale_key" ON "Page"("slug", "locale");
