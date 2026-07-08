# Chrome Web Store Upload Content

Google’s Chrome Web Store listing uses a concise **summary of 132 characters or less**, plus longer store listing details, screenshots, privacy declarations, and permission justifications. Google also says the privacy tab is used to state the extension’s purpose and justify permissions.

## Extension name

```text
Less Than Required
```

## Short description / Summary

132 characters max. Use this:

```text
Resize photos, signatures, and files to match annoying upload size requirements directly in your browser.
```

Alternative shorter version:

```text
Resize photos and signatures to exact KB, dimensions, and format requirements for online forms.
```

## Category

Use:

```text
Productivity
```

or

```text
Tools
```

Pick **Productivity** if available; it sounds more user-facing.

## Full description

```text
Less Than Required helps you fix files that do not meet upload requirements on government, exam, admission, job, and document portals.

Many websites reject photos, signatures, and documents because the file is too large, too small, the wrong format, or the wrong dimensions. This extension helps you resize and prepare files before uploading them.

Key features:

• Resize passport photos to required dimensions
• Compress images to a target file size
• Convert PNG/JPG/JPEG formats
• Prepare signature images for online forms
• Check file size, format, and image dimensions
• Use presets for common upload requirements
• Download the corrected file and upload it manually
• Process files locally in your browser

Privacy-first:

Less Than Required processes selected files locally in your browser. Your photos, signatures, and documents are not uploaded to our servers.

Useful for:

• Government forms
• Exam applications
• College admission forms
• Job portals
• Scholarship portals
• Passport-size photo uploads
• Signature upload requirements
• Any website with strict file upload limits

This extension is designed to reduce the frustration of repeatedly resizing, compressing, and converting files just to satisfy “less than required” upload rules.
```

## Single-line promo tagline

```text
Fix rejected uploads before the website rejects them.
```

## Website / support text

If you do not have a website yet, keep it simple:

```text
For support, feedback, or bug reports, contact the developer through the support email listed on this Chrome Web Store page.
```

## Privacy practices — purpose

Use this:

```text
Less Than Required is a local file preparation tool that helps users resize, compress, convert, and check selected files before uploading them to websites with strict upload requirements.
```

## Privacy practices — data handling

Use this:

```text
This extension processes selected files locally in the browser. Files are not uploaded to any external server. The extension does not collect, store, sell, or share user photos, signatures, documents, browsing history, or personal information.
```

## Permission justification

Use only what your extension actually uses.

### If using `storage`

```text
Storage permission is used to save user preferences, such as selected presets, target file size, image dimensions, and format settings.
```

### If using `activeTab`

```text
ActiveTab permission is used only when the user interacts with the extension on the current page, such as detecting upload fields or helping prepare a selected file for upload.
```

### If using `scripting`

```text
Scripting permission is used to run the extension’s helper logic on the active page when the user requests upload assistance.
```

### Avoid this if possible

```json
"host_permissions": ["<all_urls>"]
```

That makes review harder. Use it only if your extension truly needs to work automatically across all sites.

## Privacy policy draft

Create a simple page later. For now, this is the text you can use:

```text
Privacy Policy for Less Than Required

Less Than Required is designed as a privacy-first file preparation tool.

The extension allows users to resize, compress, convert, and check selected files before uploading them to websites with file size, dimension, or format requirements.

Files are processed locally in the user’s browser. The extension does not upload user files to any server.

We do not collect, store, sell, or share user photos, signatures, documents, browsing history, or personal information.

The extension may store basic preferences locally in the browser, such as selected presets, target file size, dimensions, and format settings. This data remains on the user’s device unless the browser itself syncs extension settings through the user’s Chrome account.

If you contact us for support, we may use your email address only to respond to your request.

For questions or support, contact: [your email here]
```

## Screenshot ideas

Upload at least a few clean screenshots:

1. **Main popup**
   * Shows “Photo”, “Signature”, “PDF”
   * Target KB input
   * Width/height input

2. **Before/after result**
   * Before: 2.4MB, 1080×1350
   * After: 48KB, 200×230

3. **Preset screen**
   * Passport Photo
   * Signature
   * Custom Requirement

4. **Success screen**
   * “File ready”
   * Download button
   * “Meets requirement”

## Store listing keywords

Use naturally in the description, not spammy:

```text
passport photo resizer, signature resizer, image compressor, file size reducer, photo to 50KB, government form upload, exam form photo, JPG compressor, image resize, upload requirement checker
```

## Recommended first version positioning

Do **not** claim:

```text
Works automatically on every government website.
```

Say this instead:

```text
Helps prepare files for websites with strict upload requirements.
```
