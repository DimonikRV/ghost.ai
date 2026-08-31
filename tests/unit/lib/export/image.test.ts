// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { exportToPng, exportToSvg } from "@/lib/export/image";
import { toPng, toSvg } from "html-to-image";
import * as downloadModule from "@/lib/export/download";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(() => Promise.resolve("data:image/png;base64,AAA=")),
  toSvg: vi.fn(() => Promise.resolve("data:image/svg+xml;base64,Qg==")),
}));

vi.mock("@/lib/export/download", () => ({
  downloadFile: vi.fn(),
}));

const mockToPng = vi.mocked(toPng);
const mockToSvg = vi.mocked(toSvg);
const mockDownloadFile = vi.mocked(downloadModule.downloadFile);

describe("exportToPng", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures the element as a PNG and downloads it", async () => {
    global.fetch = vi.fn(async () => ({
      blob: async () => new Blob(["png"], { type: "image/png" }),
    })) as unknown as typeof fetch;

    const element = document.createElement("div");
    await exportToPng(element, "diagram");

    expect(mockToPng).toHaveBeenCalledWith(element, {
      quality: 1,
      pixelRatio: 2,
    });
    expect(mockDownloadFile).toHaveBeenCalled();
    const [, filename, mime] = mockDownloadFile.mock.calls[0] as [Blob, string, string];
    expect(filename).toBe("diagram.png");
    expect(mime).toBe("image/png");
  });
});

describe("exportToSvg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures the element as an SVG and downloads it", async () => {
    global.fetch = vi.fn(async () => ({
      blob: async () => new Blob(["svg"], { type: "image/svg+xml" }),
    })) as unknown as typeof fetch;

    const element = document.createElement("div");
    await exportToSvg(element, "diagram");

    expect(mockToSvg).toHaveBeenCalledWith(element);
    const [, filename, mime] = mockDownloadFile.mock.calls[0] as [Blob, string, string];
    expect(filename).toBe("diagram.svg");
    expect(mime).toBe("image/svg+xml");
  });
});
