# Contract: Media Library

Base path `/api/media`, `/api/folders`. Session required. Uploads use **presigned direct-to-R2**
(research §7). Lists keyset-paginated + filterable by `folderId`/`tag`/`type`.

## Upload flow — permission `media:upload`
1. `POST /api/media/upload-intent` `{ filename, contentType, size, folderId?, alt? }`
   → **200** `{ mediaId, uploadUrl }` (presigned PUT); **422** if type/size invalid
   (images ≤10MB `jpeg,png,webp,avif,svg`; video ≤100MB `mp4,webm`).
2. Client `PUT`s the file directly to `uploadUrl` (R2).
3. `POST /api/media/:id/confirm` → **200** finalized `Media` (persists dims/url). Unconfirmed
   intents expire (no orphan row).

## Manage
- `GET /api/media?folderId=&tag=&type=&cursor=&limit=` → paginated media
- `PATCH /api/media/:id` `{ alt?, tags?, folderId?, version }` → 200 (409 stale)
- `DELETE /api/media/:id` → 204; **403** without `media:delete`; **409 blocked** when `usageCount>0`
- `GET /api/media/:id` → includes `usageCount`
- **Folders**: `GET/POST/PATCH/DELETE /api/folders` (name, parentId).

Maps to FR-008–012; SC-004. Video beyond 100MB is referenced via YouTube/Vimeo (stored as a Media
row of that `type` with a URL, no upload).
