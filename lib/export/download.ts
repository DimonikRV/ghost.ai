/**
 * Triggers a browser download for the given content.
 *
 * @param content  Raw string content or a pre-built Blob.
 * @param filename Target filename (including extension).
 * @param mimeType MIME type used when content is a string.
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string,
): void {
  const blob =
    typeof content === "string"
      ? new Blob([content], { type: mimeType })
      : content;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // The browser copies the blob URL to disk asynchronously after click().
  // Revoking it synchronously can interrupt that copy and truncate the
  // download (files extract but are broken/empty). Defer the revoke so the
  // browser finishes writing the file first.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
