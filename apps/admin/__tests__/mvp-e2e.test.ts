import { describe, it, expect, afterAll, vi } from 'vitest';

// SC-001 MVP integration test (T041). Unlike a mocked unit test, this exercises the REAL
// database and the real cross-module wiring (slug generation, FK constraints, the
// transactional Media usageCount) end to end. Only R2 (external infra) is mocked.
//
// Runs only when INTEGRATION_DB=1 and a reachable DATABASE_URL is set (CI provides both against
// its Postgres service). Skipped in the normal `pnpm test` run so it never touches a dev DB.

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: vi.fn().mockResolvedValue({ ContentLength: 1024 }) })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
}));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(() => Promise.resolve('https://example.com/upload-url')),
}));

process.env.R2_ACCOUNT_ID ??= 'test-account';
process.env.R2_ACCESS_KEY_ID ??= 'test-key';
process.env.R2_SECRET_ACCESS_KEY ??= 'test-secret';
process.env.R2_BUCKET ??= 'test-bucket';

const RUN = !!process.env.INTEGRATION_DB;
const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe.skipIf(!RUN)('SC-001 MVP integration (real Postgres)', () => {
  const created: { projectId?: string; clientId?: string; serviceId?: string; mediaId?: string } = {};

  afterAll(async () => {
    const { projectsService } = await import('@studioflow/core/projects');
    const { clientsService } = await import('@studioflow/core/clients');
    const { servicesService } = await import('@studioflow/core/services');
    const { mediaService } = await import('@studioflow/core/media');
    // Order matters: the project holds the (restricted) refs, so it goes first.
    if (created.projectId) await projectsService.delete(created.projectId).catch(() => undefined);
    if (created.mediaId) await mediaService.delete(created.mediaId).catch(() => undefined);
    if (created.clientId) await clientsService.delete(created.clientId).catch(() => undefined);
    if (created.serviceId) await servicesService.delete(created.serviceId).catch(() => undefined);
  }, 30_000);

  it('media → client → service → project → publish, against the real DB', async () => {
    const { db } = await import('@studioflow/db');
    const { mediaService } = await import('@studioflow/core/media');
    const { clientsService } = await import('@studioflow/core/clients');
    const { servicesService } = await import('@studioflow/core/services');
    const { projectsService } = await import('@studioflow/core/projects');

    // 1. Media upload-intent → real Media row
    const intent = await mediaService.createUploadIntent({
      filename: 'hero.jpg',
      contentType: 'image/jpeg',
      size: 500_000,
    });
    created.mediaId = intent.mediaId;
    expect(intent.uploadUrl).toBeTruthy();

    // 2. Client + 3. Service (real rows, real slugs)
    const client = await clientsService.create({ name: `E2E Client ${uniq()}` });
    created.clientId = client.id;
    const service = await servicesService.create({ name: `E2E Service ${uniq()}` });
    created.serviceId = service.id;

    // 4. Project referencing all three — exercises FK checks + transactional usageCount
    const project = await projectsService.create({
      title: `E2E Project ${uniq()}`,
      clientId: client.id,
      mediaRefs: [{ mediaId: intent.mediaId, type: 'GALLERY' }],
      serviceIds: [service.id],
    });
    created.projectId = project.id;
    expect(project.status).toBe('DRAFT');

    // The reference must have bumped the media's usageCount in a real transaction.
    const mediaAfter = await db.media.findUnique({
      where: { id: intent.mediaId },
      select: { usageCount: true },
    });
    expect(mediaAfter?.usageCount).toBe(1);

    // 5. Publish — stamps publishedAt via the real content-engine transition
    const published = await projectsService.updateStatus(project.id, 'publish', project.version);
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).toBeTruthy();

    // Referenced media cannot be hard-deleted while the project holds it (SC-004).
    await expect(mediaService.delete(intent.mediaId)).rejects.toMatchObject({ statusCode: 409 });
  }, 30_000);
});
