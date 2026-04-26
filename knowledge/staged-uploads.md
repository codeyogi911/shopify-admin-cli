---
title: "Staged uploads — three-step file upload"
type: pattern
source: shopify-docs
discovered: 2026-04-26
applies-to: ["files.upload"]
---

**What.** Uploading a file to Shopify is three calls:

1. **`stagedUploadsCreate`** — Shopify returns a signed URL + form parameters.
2. **POST file** to that URL as `multipart/form-data` (handled internally with `FormData`). Body includes the parameters from step 1 plus the binary file.
3. **`fileCreate`** — register the resulting object as a Shopify File using `originalSource: <resourceUrl>`.

The CLI's `files upload` action does all three steps in sequence.

**Why.** Shopify's file storage is on Google Cloud Storage / S3-compatible buckets. The Admin API mints short-lived signed URLs so the file never traverses Shopify's servers — it lands directly in storage and the API only stores the reference.

**How to apply.**

```bash
shopify-admin-cli files upload --file ./hero.jpg --alt "Product hero shot" --resource IMAGE
```

Resource types: `FILE` (default — generic), `IMAGE`, `VIDEO`, `MODEL_3D`. Wrong type produces a `validation_error` from `fileCreate`.

**MIME type.** The CLI guesses MIME from the filename extension. For unusual types (e.g. `.heic`), pass `--body` to `stagedUploadsCreate` directly via the `gql` command.

**Size limits.** Images: 20 MB. Video: 1 GB but requires resource: VIDEO. PDFs: 20 MB. Larger files need direct multipart upload to GCS — outside this CLI's scope.
