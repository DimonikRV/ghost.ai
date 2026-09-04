// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { downloadFile } from "@/lib/export/download";

describe("downloadFile", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    createObjectURL = vi.fn(() => "blob:mock");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
    clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy as unknown as typeof HTMLAnchorElement.prototype.click;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("creates a Blob from string content with the given mime type", () => {
    downloadFile("hello", "file.txt", "text/plain");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/plain");
  });

  it("uses a provided Blob directly", () => {
    const input = new Blob(["data"], { type: "application/zip" });
    downloadFile(input, "out.zip", "application/zip");
    expect(createObjectURL).toHaveBeenCalledWith(input);
  });

  it("clicks an anchor with the download attribute and defers revoking the URL", () => {
    let captured: { download?: string; href?: string } = {};
    clickSpy.mockImplementation(function (this: HTMLAnchorElement) {
      captured = { download: this.download, href: this.href };
    });
    downloadFile("hello", "named.txt", "text/plain");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(captured.download).toBe("named.txt");
    expect(captured.href).toBe("blob:mock");
    // The object URL must not be revoked synchronously — the browser copies
    // the blob to disk asynchronously after click(), and revoking early
    // truncates the download.
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(document.querySelectorAll("a")).toHaveLength(0);

    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("defers revoking for a binary Blob download to avoid truncation", () => {
    const input = new Blob(["PK\x03\x04zipbytes"], {
      type: "application/zip",
    });
    downloadFile(input, "out.zip", "application/zip");
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });
});
