import { toPng, toSvg } from "html-to-image";
import { downloadFile } from "./download";

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function exportToPng(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await toPng(element, { quality: 1, pixelRatio: 2 });
  const blob = await dataUrlToBlob(dataUrl);
  downloadFile(blob, `${filename}.png`, "image/png");
}

export async function exportToSvg(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await toSvg(element);
  const blob = await dataUrlToBlob(dataUrl);
  downloadFile(blob, `${filename}.svg`, "image/svg+xml");
}
