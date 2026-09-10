MALIKS GROUP HUB - CATALOGUE IMAGE UPLOAD FIX

Replace:
  app/catalogue.tsx

Then commit and push.

What this fixes:
- Prevents technical "Unexpected token 'P', Payload Too Large" errors.
- Large catalogue images are resized/compressed in the browser before upload.
- Upload payload is kept below ~1MB for vinext compatibility.
- PNG/JPG/WebP source images up to 30MB can be selected; the uploaded catalogue copy is optimised to WebP when needed.
- Small images are left unchanged.
- Clear error messages are shown if an image cannot be processed.
