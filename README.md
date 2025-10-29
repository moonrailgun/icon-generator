# MacOS Icon Generator

Generate a complete MacOS iconset directly in the browser. Upload a single high-resolution image, review how it renders across every required size, then download both a `.iconset` bundle and an `.icns` file ready for use in MacOS apps, PWAs, or Electron projects.

## Features
- **Drag-and-drop upload**: Supports PNG, JPEG, SVG, and other common image formats.
- **MacOS-specific layout**: Automatically composites a rounded white backdrop with highlights and shadow to match the official template.
- **Full size coverage**: Exports 10 PNG variants from `16×16` up to `1024×1024` (Retina), including menu bar, Dock, Finder, and App Store sizes.
- **One-click downloads**:
  - `AppIcon.iconset` directory packaged as a zip (with `Contents.json`).
  - Standalone `.icns` file built in the browser.
- **Individual previews**: Inspect and download each size separately—large tiles receive more space for clarity.
- **Light/Dark friendly UI**: Responsive layout with Tailwind CSS (v4) accents.

## Getting Started

### Prerequisites
- Node.js 18 or higher (required by Next.js 15).
- npm, pnpm, yarn, or bun for package management.

### Install dependencies
```bash
npm install
# or
pnpm install
# or
yarn install
# or
bun install
```

### Run the development server
```bash
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000) to use the generator locally. Edits to files like `src/app/page.tsx` will hot-reload instantly.

### Build for production
```bash
npm run build
npm run start
```

## Usage
1. Launch the site and drag an image onto the upload card (or click to choose a file).
2. Wait for processing—previews will populate for every MacOS size.
3. Download:
   - **Iconset zip**: Contains all PNG variants + `Contents.json`.
   - **ICNS file**: Ready to drop into your app bundle.
4. Optionally download individual PNGs from each preview tile.

## Technology Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS v4
- **Icon Packaging**: JSZip for `.iconset` zip creation, custom ICNS assembler in the browser
- **Tooling**: TypeScript, Biome, Turbopack dev/build workflow

## Project Structure
```
src/
└── app/
    ├── layout.tsx      # Global metadata, fonts, analytics script
    ├── page.tsx        # Main MacOS icon generator UI & logic
    └── globals.css     # Tailwind CSS entrypoint & theme vars
public/
└── *.svg               # Placeholder assets from the starter template
```

## Analytics
The project loads the Tianji analytics script via `next/script` inside `src/app/layout.tsx`:
```tsx
<Script
  src="https://app.tianji.dev/tracker.js"
  data-website-id="cmg1av4vwmvbujs84nnu211ro"
  strategy="afterInteractive"
  defer
/>
```
Remove or update this snippet if you deploy to your own domain.

## Roadmap Ideas
- Allow background color customization and adjustable corner radius.
- Support multiple source layers (badge overlays, fallback backgrounds).
- Add server-side export for automated pipelines or CLI usage.

## License
MIT. See [LICENSE](LICENSE) if present, or adapt as needed.
