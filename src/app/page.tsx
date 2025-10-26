"use client";

import JSZip from "jszip";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface VariantConfig {
  id: string;
  label: string;
  description: string;
  size: number;
  scale: 1 | 2;
  filename: string;
}

interface VariantResult extends VariantConfig {
  dataUrl: string;
  binary: Uint8Array;
  actualSize: number;
}

const ICON_VARIANTS: VariantConfig[] = [
  {
    id: "16",
    label: "16 × 16",
    description: "Menu bar / toolbar",
    size: 16,
    scale: 1,
    filename: "icon_16x16.png",
  },
  {
    id: "16@2",
    label: "16 × 16 @2x",
    description: "Retina 32 × 32",
    size: 16,
    scale: 2,
    filename: "icon_16x16@2x.png",
  },
  {
    id: "32",
    label: "32 × 32",
    description: "Dock small icon",
    size: 32,
    scale: 1,
    filename: "icon_32x32.png",
  },
  {
    id: "32@2",
    label: "32 × 32 @2x",
    description: "Retina 64 × 64",
    size: 32,
    scale: 2,
    filename: "icon_32x32@2x.png",
  },
  {
    id: "128",
    label: "128 × 128",
    description: "Finder preview",
    size: 128,
    scale: 1,
    filename: "icon_128x128.png",
  },
  {
    id: "128@2",
    label: "128 × 128 @2x",
    description: "Retina 256 × 256",
    size: 128,
    scale: 2,
    filename: "icon_128x128@2x.png",
  },
  {
    id: "256",
    label: "256 × 256",
    description: "HiDPI common size",
    size: 256,
    scale: 1,
    filename: "icon_256x256.png",
  },
  {
    id: "256@2",
    label: "256 × 256 @2x",
    description: "Retina 512 × 512",
    size: 256,
    scale: 2,
    filename: "icon_256x256@2x.png",
  },
  {
    id: "512",
    label: "512 × 512",
    description: "App Store showcase",
    size: 512,
    scale: 1,
    filename: "icon_512x512.png",
  },
  {
    id: "512@2",
    label: "512 × 512 @2x",
    description: "Retina 1024 × 1024",
    size: 512,
    scale: 2,
    filename: "icon_512x512@2x.png",
  },
];

const ICNS_TYPE_MAP: Record<number, string> = {
  16: "icp4",
  32: "icp5",
  64: "icp6",
  128: "ic07",
  256: "ic08",
  512: "ic09",
  1024: "ic10",
};

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  if (!base64) {
    throw new Error("Unable to parse image data");
  }
  const binary = atob(base64);
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    result[index] = binary.charCodeAt(index);
  }
  return result;
}

function drawRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const clampedRadius = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + clampedRadius, y);
  context.lineTo(x + width - clampedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
  context.lineTo(x + width, y + height - clampedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
  context.lineTo(x + clampedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
  context.lineTo(x, y + clampedRadius);
  context.quadraticCurveTo(x, y, x + clampedRadius, y);
}

function drawVariant(image: HTMLImageElement, actualSize: number) {
  const canvas = document.createElement("canvas");
  canvas.width = actualSize;
  canvas.height = actualSize;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas rendering is not supported in this browser");
  }
  context.clearRect(0, 0, actualSize, actualSize);

  const outerPadding = Math.max(Math.round(actualSize * 0.08), 2);
  const baseSize = actualSize - outerPadding * 2;
  const baseRadius = Math.round(baseSize * 0.22);

  context.save();
  context.shadowColor = "rgba(15, 23, 42, 0.18)";
  context.shadowBlur = actualSize * 0.06;
  context.shadowOffsetY = actualSize * 0.02;
  context.beginPath();
  drawRoundedRectPath(context, outerPadding, outerPadding, baseSize, baseSize, baseRadius);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  drawRoundedRectPath(context, outerPadding, outerPadding, baseSize, baseSize, baseRadius);
  context.clip();

  const innerPadding = Math.round(baseSize * 0.12);
  const availableWidth = baseSize - innerPadding * 2;
  const availableHeight = baseSize - innerPadding * 2;
  const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = outerPadding + (baseSize - drawWidth) / 2;
  const offsetY = outerPadding + (baseSize - drawHeight) / 2;

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const highlight = context.createLinearGradient(0, outerPadding, 0, outerPadding + baseSize);
  highlight.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  highlight.addColorStop(0.5, "rgba(255, 255, 255, 0)");
  highlight.addColorStop(1, "rgba(148, 163, 184, 0.25)");
  context.fillStyle = highlight;
  context.fillRect(outerPadding, outerPadding, baseSize, baseSize);

  context.restore();

  context.beginPath();
  drawRoundedRectPath(context, outerPadding, outerPadding, baseSize, baseSize, baseRadius);
  context.strokeStyle = "rgba(148, 163, 184, 0.25)";
  context.lineWidth = Math.max(actualSize * 0.012, 1);
  context.stroke();

  const dataUrl = canvas.toDataURL("image/png");
  const binary = dataUrlToUint8Array(dataUrl);
  return { dataUrl, binary };
}

function createIcnsBuffer(variants: VariantResult[]): ArrayBuffer {
  const unique = new Map<number, Uint8Array>();
  variants.forEach((variant) => {
    const targetSize = variant.actualSize;
    if (!unique.has(targetSize)) {
      unique.set(targetSize, variant.binary);
    }
  });

  const entries = Array.from(unique.entries())
    .filter(([size]) => Boolean(ICNS_TYPE_MAP[size]))
    .map(([size, data]) => ({ type: ICNS_TYPE_MAP[size], data, size }))
    .sort((a, b) => a.size - b.size);

  const totalLength = 8 + entries.reduce((sum, entry) => sum + 8 + entry.data.length, 0);
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const header = new Uint8Array(buffer, 0, 4);
  header[0] = "i".charCodeAt(0);
  header[1] = "c".charCodeAt(0);
  header[2] = "n".charCodeAt(0);
  header[3] = "s".charCodeAt(0);
  view.setUint32(4, totalLength, false);

  let offset = 8;
  entries.forEach((entry) => {
    const tag = new Uint8Array(buffer, offset, 4);
    tag[0] = entry.type.charCodeAt(0);
    tag[1] = entry.type.charCodeAt(1);
    tag[2] = entry.type.charCodeAt(2);
    tag[3] = entry.type.charCodeAt(3);
    view.setUint32(offset + 4, entry.data.length + 8, false);
    new Uint8Array(buffer, offset + 8, entry.data.length).set(entry.data);
    offset += entry.data.length + 8;
  });

  return buffer;
}

function buildContentsJson(variants: VariantResult[]) {
  const images = variants.map((variant) => ({
    idiom: "mac",
    filename: variant.filename,
    scale: `${variant.scale}x`,
    size: `${variant.size}x${variant.size}`,
  }));
  const content = {
    images,
    info: {
      author: "icon-generator",
      version: 1,
    },
  };
  return JSON.stringify(content, null, 2);
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const zipUrlRef = useRef<string | null>(null);
  const icnsUrlRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantResult[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [icnsUrl, setIcnsUrl] = useState<string | null>(null);
  const [baseName, setBaseName] = useState("AppIcon");

  const hasResult = variants.length > 0;

  const revokeZipUrl = useCallback(() => {
    if (zipUrlRef.current) {
      URL.revokeObjectURL(zipUrlRef.current);
      zipUrlRef.current = null;
    }
    setZipUrl(null);
  }, []);

  const revokeIcnsUrl = useCallback(() => {
    if (icnsUrlRef.current) {
      URL.revokeObjectURL(icnsUrlRef.current);
      icnsUrlRef.current = null;
    }
    setIcnsUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (zipUrlRef.current) {
        URL.revokeObjectURL(zipUrlRef.current);
        zipUrlRef.current = null;
      }
      if (icnsUrlRef.current) {
        URL.revokeObjectURL(icnsUrlRef.current);
        icnsUrlRef.current = null;
      }
    };
  }, []);

  const updateZipUrl = useCallback(
    (blob: Blob) => {
      const objectUrl = URL.createObjectURL(blob);
      if (zipUrlRef.current) {
        URL.revokeObjectURL(zipUrlRef.current);
      }
      zipUrlRef.current = objectUrl;
      setZipUrl(objectUrl);
    },
    [],
  );

  const updateIcnsUrl = useCallback(
    (blob: Blob) => {
      const objectUrl = URL.createObjectURL(blob);
      if (icnsUrlRef.current) {
        URL.revokeObjectURL(icnsUrlRef.current);
      }
      icnsUrlRef.current = objectUrl;
      setIcnsUrl(objectUrl);
    },
    [],
  );

  const processImage = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setVariants([]);
      setSourcePreview(null);
      revokeZipUrl();
      revokeIcnsUrl();

      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        const image = new Image();
        image.onload = async () => {
          try {
            const generated = ICON_VARIANTS.map((config) => {
              const actualSize = config.size * config.scale;
              const { dataUrl: variantUrl, binary } = drawVariant(image, actualSize);
              return {
                ...config,
                actualSize,
                dataUrl: variantUrl,
                binary,
              } satisfies VariantResult;
            });

            setSourcePreview(dataUrl);
            setVariants(generated);
            const name = file.name.replace(/\.[^/.]+$/, "");
            setBaseName(name.length > 0 ? name : "AppIcon");

            const zip = new JSZip();
            const folder = zip.folder("AppIcon.iconset");
            if (!folder) {
              throw new Error("Unable to create zip folder");
            }
            generated.forEach((variant) => {
              folder.file(variant.filename, variant.binary, { binary: true });
            });
            folder.file("Contents.json", buildContentsJson(generated));
            const zipBlob = await zip.generateAsync({ type: "blob" });
            updateZipUrl(zipBlob);

            const icnsBuffer = createIcnsBuffer(generated);
            const icnsBlob = new Blob([icnsBuffer], { type: "image/icns" });
            updateIcnsUrl(icnsBlob);
          } catch (exception) {
            console.error(exception);
            setVariants([]);
            setSourcePreview(null);
            revokeZipUrl();
            revokeIcnsUrl();
            setError("Something went wrong while generating icons. Please try another image.");
          } finally {
            setIsProcessing(false);
          }
        };
        image.onerror = () => {
          setIsProcessing(false);
          setError("Unable to read the image. Please confirm the file is not corrupted.");
        };
        image.src = dataUrl;
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setError("Failed to read the file. Please try again.");
      };

      reader.readAsDataURL(file);
    },
    [revokeIcnsUrl, revokeZipUrl, updateIcnsUrl, updateZipUrl],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) {
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file such as PNG, JPEG, or SVG.");
        return;
      }
      processImage(file);
    },
    [processImage],
  );

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      event.target.value = "";
    },
    [handleFiles],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const downloadZipName = useMemo(() => `${baseName}-macos-iconset.zip`, [baseName]);
  const downloadIcnsName = useMemo(() => `${baseName}.icns`, [baseName]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f2f5ff,_#eef2ff,_#ffffff)] dark:bg-[radial-gradient(circle_at_top,_#070a12,_#0d101b,_#111827)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-20 pt-16 text-foreground">
        <header className="space-y-4 text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-500">macOS Icon Studio</p>
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-50 sm:text-5xl">
            Generate polished macOS app icons in one step
          </h1>
          <p className="max-w-3xl text-base text-gray-600 dark:text-gray-300">
            Upload a high-resolution asset and instantly preview every macOS icon size, complete with a ready-to-ship .iconset archive and .icns file. Perfect for macOS apps, PWAs, and Electron projects.
          </p>
          <div className="grid gap-3 text-sm text-gray-500 dark:text-gray-300 sm:grid-cols-2">
            <p>
              Designed for Apple’s Human Interface Guidelines: transparent PNGs are wrapped with a subtle white base, highlights, and soft shadow to match official macOS icon styling.
            </p>
            <p>
              Save production time by exporting all 10 required sizes, Retina variants, and the structured `Contents.json` metadata without opening Xcode or command-line tools.
            </p>
          </div>
        </header>

        <section className="grid gap-12 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <label
              htmlFor="icon-upload"
              data-tianji-event="open-upload-dropzone"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={`relative flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-200 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50/70 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10"
                  : "border-gray-300/60 bg-white/80 text-gray-600 shadow-lg shadow-indigo-100/40 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300">
                <svg viewBox="0 0 24 24" className="h-8 w-8">
                  <path
                    fill="currentColor"
                    d="M12 3a4 4 0 0 1 4 4v1h1.5A3.5 3.5 0 0 1 21 11.5a3.5 3.5 0 0 1-3 3.465V16a2 2 0 0 1-2 2h-1v-2h1a.5.5 0 0 0 .5-.5V14h1.5a1.5 1.5 0 0 0 0-3H16V9a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H6.5a1.5 1.5 0 0 0 0 3H8v1.5a.5.5 0 0 0 .5.5h1v2h-1a2 2 0 0 1-2-2v-1.035a3.5 3.5 0 0 1-3-3.465A3.5 3.5 0 0 1 6.5 8H8V7a4 4 0 0 1 4-4Zm0 6a1 1 0 0 1 1 1v2h1a1 1 0 0 1 .8 1.6l-2.5 3.5a1 1 0 0 1-1.6 0l-2.5-3.5a1 1 0 0 1 .8-1.6h1V10a1 1 0 0 1 1-1Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Click to choose or drop an image here
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Transparent PNG or SVG recommended, ideally 1024 × 1024 or larger
                </span>
              </div>
              <input
                ref={fileInputRef}
                id="icon-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onInputChange}
              />
            </label>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-tianji-event="trigger-file-picker"
              className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-500/80 dark:text-white"
            >
              {isProcessing ? "Processing image..." : "Choose a local file"}
            </button>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            ) : null}

            {sourcePreview ? (
              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Source image preview</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner dark:border-white/10 dark:bg-white/10">
                    <img src={sourcePreview} alt="Source image preview" className="h-full w-full object-cover" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>File name: {baseName}</p>
                    <p>Status: {isProcessing ? "Processing" : "Ready"}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-2xl border border-transparent bg-indigo-50/70 p-4 text-xs text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
              <p className="font-semibold">What you get</p>
              <p>• Complete AppIcon.iconset archive (with Contents.json)</p>
              <p>• Standard .icns bundle, ready to drop into macOS</p>
              <p>• 10 Retina-ready sizes compliant with macOS Sonoma</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Icon sizes preview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ICON_VARIANTS.length} sizes with live scaling preview
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={zipUrl ?? undefined}
                  download={zipUrl ? downloadZipName : undefined}
                  data-tianji-event={zipUrl ? "download-iconset-zip" : undefined}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    zipUrl
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-600 dark:bg-indigo-500/80"
                      : "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-500"
                  }`}
                  aria-disabled={!zipUrl}
                >
                  Download iconset zip
          </a>
          <a
                  href={icnsUrl ?? undefined}
                  download={icnsUrl ? downloadIcnsName : undefined}
                  data-tianji-event={icnsUrl ? "download-icns" : undefined}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    icnsUrl
                      ? "bg-gray-900 text-white shadow-lg shadow-gray-300 hover:bg-black dark:bg-white/20 dark:text-white"
                      : "cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-500"
                  }`}
                  aria-disabled={!icnsUrl}
                >
                  Download ICNS file
          </a>
        </div>
            </div>

            <div
              className={`grid gap-6 rounded-3xl border p-6 shadow-inner backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
                hasResult
                  ? "border-emerald-200/60 bg-white/50 dark:border-emerald-400/20 dark:bg-white/5"
                  : "border-dashed border-gray-200 bg-white/20 dark:border-white/10 dark:bg-white/0"
              }`}
            >
              {ICON_VARIANTS.map((config) => {
                const variant = variants.find((item) => item.id === config.id);
                const actualSize = config.size * config.scale;
                const isHuge = actualSize >= 512;
                const isLarge = actualSize >= 256 && actualSize < 512;
                const displaySize = isHuge
                  ? 240
                  : isLarge
                    ? 180
                    : actualSize >= 128
                      ? 140
                      : actualSize >= 64
                        ? 110
                        : 90;
                const tileSpanClass = isHuge
                  ? "sm:col-span-2 lg:col-span-3 xl:col-span-2"
                  : isLarge
                    ? "sm:col-span-2 lg:col-span-2"
                    : "";
                const tilePaddingClass = isHuge ? "p-6" : isLarge ? "p-5" : "p-4";
                const stagePaddingClass = isHuge ? "min-h-48 p-8" : isLarge ? "min-h-36 p-6" : "min-h-28 p-5";

                return (
                  <div
                    key={config.id}
                    className={`flex flex-col gap-4 rounded-2xl border border-white/60 bg-gradient-to-br from-white to-slate-100/60 shadow-lg shadow-indigo-100/40 dark:border-white/10 dark:from-white/5 dark:to-white/10 dark:shadow-black/30 ${tileSpanClass} ${tilePaddingClass}`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{config.scale}x</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{config.description}</p>
                    </div>
                    <div
                      className={`relative flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-inner dark:from-white/10 dark:via-white/5 dark:to-white/10 ${stagePaddingClass}`}
                    >
                      <div
                        className="flex items-center justify-center rounded-3xl bg-white/95 shadow-xl shadow-slate-200/60 ring-1 ring-indigo-100/80 dark:bg-white/10 dark:shadow-black/60 dark:ring-white/10"
                        style={{ width: displaySize, height: displaySize }}
                      >
                        {variant ? (
                          <img
                            src={variant.dataUrl}
                            alt={`${config.label} preview`}
                            style={{ width: actualSize, height: actualSize }}
                            className="object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">Waiting for image</span>
                        )}
                      </div>
                      {variant ? (
                        <a
                          href={variant.dataUrl}
                          download={variant.filename}
                          data-tianji-event={`download-variant-${config.id}`}
                          className="text-[11px] font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
                        >
                          Download this size
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasResult ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
                Upload an image to see previews for every size and quick download options.
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-10 rounded-3xl border border-gray-200 bg-white/70 p-8 text-sm text-gray-600 shadow-lg dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Why use this macOS icon generator?</h2>
                <ul className="mt-3 space-y-2 list-disc pl-5">
                  <li>No installation—everything runs in your browser.</li>
                  <li>Mac-ready assets including `.iconset` + `.icns` in seconds.</li>
                  <li>Consistent Retina previews aligned with Apple’s template.</li>
                  <li>Ideal for indie developers, designers, and rapid prototyping.</li>
                </ul>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Frequently asked questions</h2>
                <div className="mt-3 space-y-2">
                  <p className="font-medium text-gray-800 dark:text-gray-100">What input formats are supported?</p>
                  <p>Any image the browser can read—PNG, JPEG, SVG, WebP, even HEIC if your browser supports it.</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Is my image uploaded to a server?</p>
                  <p>Processing happens locally via Canvas APIs; nothing leaves your device, keeping assets private.</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Can I customize the background?</p>
                  <p>Currently the generator follows Apple’s white rounded template. Custom backgrounds are on the roadmap.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 p-6 text-white shadow-xl">
              <h3 className="text-lg font-semibold">Need other platforms?</h3>
              <p className="mt-2 text-sm text-indigo-100">
                Extend your workflow with iOS, Android, or web favicon outputs using complementary tools or pipelines. This generator focuses on macOS precision so you can integrate it alongside solutions like AppIcon or custom scripts.
              </p>
            </div>
          </section>
    </div>
    </main>
  );
}
