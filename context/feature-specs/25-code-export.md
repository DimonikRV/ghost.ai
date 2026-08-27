# 25 — Code Export (Diagram Formats + AI-Powered Code Scaffolds)

Add export functionality to the canvas editor. Users export their architecture diagrams as text/image formats (Mermaid, PlantUML, PNG, SVG, JSON) instantly via client-side conversion, and as production-ready project scaffolds for 10 frameworks via an AI-powered Trigger.dev background task.

## Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Diagram export | Pure TypeScript functions in `lib/export/` | Graph → text format conversion (no dependencies) |
| Image export | `html-to-image` (client-side) | ReactFlow viewport DOM → PNG/SVG |
| ZIP creation | `jszip` (server-side, in Trigger.dev task) | Assemble generated files into downloadable archive |
| AI generation | `ai` SDK + `@ai-sdk/google` (Gemini 2.5 Flash) | Structured code generation from canvas graph |
| Background processing | `@trigger.dev/sdk` v4 | Durable task execution for AI code generation |
| Storage | `@vercel/blob` | Store generated ZIP files for download |
| Tracking | Prisma 7 + PostgreSQL (`ExportRun` model) | Track export task status and ownership |
| Realtime progress | Trigger.dev public tokens + `@trigger.dev/react-hooks` | Stream generation progress to the export dialog |
| UI | shadcn Dialog, existing component patterns | Export dialog with format/framework selection |

## What This Feature Does

### Diagram Formats (client-side, instant)

Convert the canvas graph (nodes + edges) into standard diagram-as-code formats and images:

- **Mermaid** — `graph TD` syntax with shape-mapped nodes (rectangle→`["..."]`, diamond→`{"..."}`, circle→`(())`, cylinder→`[(...)]`, hexagon→`{{...}}`, pill→`([...])`) and labeled edges.
- **PlantUML** — `@startuml` syntax mapping shapes to UML component, database, actor, and boundary stereotypes.
- **PNG** — Raster image of the ReactFlow viewport via `html-to-image`'s `toPng()`.
- **SVG** — Vector image of the ReactFlow viewport via `html-to-image`'s `toSvg()`.
- **JSON** — Raw `{ nodes, edges }` canvas state as a downloadable `.json` file.

All diagram exports run entirely in the browser with zero server calls.

### Code Scaffolds (AI-powered, Trigger.dev)

Convert the canvas architecture into a runnable project scaffold for a chosen framework:

1. User clicks a framework button in the export dialog.
2. Client POSTs `{ projectId, framework }` to `/api/export/code`.
3. Server fetches canvas state from Vercel Blob, triggers the `code-export` Trigger.dev task, creates an `ExportRun` record, returns `{ runId }`.
4. Client fetches a public token from `/api/export/code/[runId]/token`, subscribes to run progress via `useRealtimeRun`.
5. The Trigger.dev task: builds a prompt from the graph + framework hints, calls Gemini via `generateObject()` with a structured schema (`{ files: [{ path, content }] }`), creates a ZIP via `jszip`, uploads to Vercel Blob, marks the `ExportRun` as completed.
6. On completion, client calls `/api/export/code/[runId]/download` which streams the ZIP from Vercel Blob.

### Supported Frameworks

| ID | Name | Language | Key Conventions |
|----|------|----------|-----------------|
| `spring-boot` | Java Spring Boot | Java | Spring Boot 3.x, Java 17+, Maven, `application.yml` |
| `node-fastify` | Node.js Fastify | TypeScript | Fastify 5.x, ESM, `package.json` + `tsconfig.json` |
| `python-fastapi` | Python FastAPI | Python | FastAPI 0.115+, Python 3.12+, `pyproject.toml` |
| `go-chi` | Go (Chi router) | Go | Go 1.22+, chi, `go.mod`, `cmd/` + `internal/` |
| `rust-axum` | Rust (Axum) | Rust | Axum 0.7+, tokio, `Cargo.toml` |
| `dotnet-aspnet` | .NET ASP.NET Core | C# | .NET 8+, minimal APIs, `.csproj` |
| `docker-compose` | Docker Compose | YAML | One service per node, `Dockerfile` per custom service |
| `terraform` | Terraform | HCL | AWS resources, `main.tf` + `variables.tf` + `outputs.tf` |
| `mermaid` | Mermaid Diagram | Markdown | Annotated Mermaid with groupings and subgraphs |
| `adr` | Architecture Decision Record | Markdown | ADR format: Title, Status, Context, Decision, Consequences |

## Design

### Canvas Graph → AI Prompt Mapping

The AI prompt interprets canvas shapes as architectural components:

| Shape | Semantic Meaning | Example |
|-------|-----------------|---------|
| `rectangle` | Service / API / compute unit | "API Gateway", "User Service" |
| `cylinder` | Database / data store | "PostgreSQL", "Redis Cache" |
| `circle` | Event trigger / entry point | "Webhook", "Cron Trigger" |
| `pill` | Background worker / job | "Email Worker", "Queue Processor" |
| `hexagon` | External system / third-party API | "Stripe API", "SendGrid" |
| `diamond` | Load balancer / router / decision | "Nginx Load Balancer" |

Edge labels describe the connection protocol or data flow: "HTTP", "gRPC", "async events", "TCP".

### Export Dialog Layout

A shadcn Dialog opened from a new "Export" button in the `CanvasControlBar`.

```
┌─────────────────────────────────────────────────┐
│  Export                                    [X]   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Diagram Formats                                 │
│  ┌──────────┐ ┌──────────┐ ┌─────┐ ┌─────┐     │
│  │ Mermaid  │ │ PlantUML │ │ PNG │ │ SVG │     │
│  └──────────┘ └──────────┘ └─────┘ └─────┘     │
│  ┌──────┐                                        │
│  │ JSON │                                        │
│  └──────┘                                        │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Code Scaffolds                                  │
│  ┌────────────┐ ┌─────────┐ ┌─────────┐        │
│  │ Spring Boot│ │ Fastify │ │ FastAPI │        │
│  └────────────┘ └─────────┘ └─────────┘        │
│  ┌─────────┐ ┌──────┐ ┌────────┐               │
│  │ Go Chi  │ │ Axum │ │ .NET   │               │
│  └─────────┘ └──────┘ └────────┘               │
│  ┌──────────────┐ ┌───────────┐                 │
│  │Docker Compose│ │ Terraform │                 │
│  └──────────────┘ └───────────┘                 │
│  ┌─────────┐ ┌─────┐                            │
│  │Mermaid  │ │ ADR │                            │
│  └─────────┘ └─────┘                            │
│                                                  │
│  [Generate & Download ZIP →]                     │
│  Status: ▓▓▓▓▓▓░░░░ Generating files...         │
│  6 of 12 files generated                         │
│                                                  │
└─────────────────────────────────────────────────┘
```

- Diagram format buttons: instant download on click, no progress needed.
- Code scaffold buttons: select one framework → click "Generate & Download ZIP" → progress bar updates via Trigger.dev realtime → auto-downloads ZIP on completion.
- Framework selection is single-choice (radio-style highlight).

### Filename Conventions

| Format | Filename Pattern |
|--------|-----------------|
| Mermaid | `{project-name}.mmd` |
| PlantUML | `{project-name}.puml` |
| PNG | `{project-name}.png` |
| SVG | `{project-name}.svg` |
| JSON | `{project-name}-canvas.json` |
| Code scaffold | `{project-name}-{framework}.zip` |

Project name is slugified (lowercase, hyphens, no special chars) for filenames.

## Implementation

### 1. Create the shared download utility.

   Create: `lib/export/download.ts`

   A single `downloadFile(content: string | Blob, filename: string, mimeType: string)` function that:
   - creates a Blob from the content (if string, wrap with `new Blob([content], { type: mimeType })`)
   - generates an object URL via `URL.createObjectURL()`
   - creates a temporary `<a>` element, sets `href` and `download`, clicks it, revokes the URL
   - for Blob input, uses the Blob directly

   Export this function for use by all diagram export modules.

### 2. Create the Mermaid export module.

   Create: `lib/export/mermaid.ts`

   Export `graphToMermaid(nodes: DiagramNode[], edges: DiagramEdge[]): string`

   Logic:
   - Start with `graph TD` header
   - For each node, sanitize the ID (replace non-alphanumeric with `_`), then map shape to Mermaid syntax:
     - `rectangle` → `ID["label"]`
     - `diamond` → `ID{"label"}`
     - `circle` → `ID(("label"))`
     - `cylinder` → `ID[("label")]`
     - `hexagon` → `ID{{"label"}}`
     - `pill` → `ID(["label"])`
   - For each edge, emit `source --> target` with optional `|label|` syntax if `edge.data?.label` exists
   - Join all lines with `\n`

   Import `DiagramNode`, `DiagramEdge` from `components/editor/starter-templates.ts`.

### 3. Create the PlantUML export module.

   Create: `lib/export/plantuml.ts`

   Export `graphToPlantUml(nodes: DiagramNode[], edges: DiagramEdge[]): string`

   Logic:
   - Start with `@startuml` and end with `@enduml`
   - For each node, map shape to PlantUML component:
     - `rectangle` → `component "label" as ID`
     - `cylinder` → `database "label" as ID`
     - `circle` → `actor "label" as ID`
     - `diamond` → `rectangle "label" as ID` with `<<decision>>` stereotype
     - `hexagon` → `rectangle "label" as ID` with `<<external>>` stereotype
     - `pill` → `rectangle "label" as ID` with `<<worker>>` stereotype
   - For each edge, emit `ID1 --> ID2 : label` (label optional)
   - Join with `\n`

### 4. Create the image export module.

   Create: `lib/export/image.ts`

   Export `exportToPng(element: HTMLElement): Promise<Blob>` and `exportToSvg(element: HTMLElement): Promise<Blob>`

   Uses `html-to-image`:
   - `toPng(element, { quality: 1, pixelRatio: 2 })` returns a data URL → convert to Blob
   - `toSvg(element)` returns a data URL → convert to Blob

   Both functions accept the ReactFlow viewport wrapper DOM element.

   Helper: `dataUrlToBlob(dataUrl: string): Promise<Blob>` — fetch the data URL, return as Blob.

### 5. Create the JSON export module.

   Create: `lib/export/json.ts`

   Export `exportToJson(nodes: DiagramNode[], edges: DiagramEdge[]): void`

   Logic:
   - Serialize `{ nodes, edges }` with `JSON.stringify(data, null, 2)`
   - Call `downloadFile(json, filename, "application/json")`

### 6. Create the framework definitions.

   Create: `lib/export/frameworks.ts`

   Define and export:
   - `FrameworkDef` interface: `id`, `name`, `icon` (lucide icon name as string), `description`, `language`, `fileExtensions: string[]`, `promptHints: string`
   - `FRAMEWORKS: FrameworkDef[]` array with all 10 framework entries (see "Supported Frameworks" table above for data)
   - `getFramework(id: string): FrameworkDef | undefined` lookup helper

   The `promptHints` field contains framework-specific instructions for the AI (file structure, naming conventions, package manifests, dependency lists).

### 7. Create the AI prompt builder.

   Create: `lib/export/scaffold-prompt.ts`

   Export two functions:

   `buildSystemPrompt(framework: FrameworkDef): string`
   - Instructs the AI to act as a senior software architect generating a production-ready project scaffold
   - Defines the output schema: `{ files: [{ path: string, content: string }] }`
   - Maps canvas shapes to components: rectangle=service, cylinder=database, circle=event, pill=worker, hexagon=external, diamond=load-balancer
   - States that edges represent connections (HTTP, gRPC, async, etc.)
   - Injects `framework.promptHints` for framework-specific conventions
   - Requires: runnable code (not pseudocode), proper package manifests, entry points, config files
   - States: no placeholder comments like `// TODO: implement` — write real implementation skeletons

   `buildGraphDescription(canvasJson: { nodes: any[]; edges: any[] }): string`
   - Structured text description of the graph for the AI
   - Lists all services with their shape type, label, and position
   - Lists all connections with source label → target label + edge label
   - Format:
     ```
     Services:
     - [rectangle] "API Gateway" at (100, 200)
     - [cylinder] "PostgreSQL" at (400, 300)
     - [hexagon] "Stripe API" at (600, 100)

     Connections:
     - "API Gateway" --> "PostgreSQL" : SQL queries
     - "API Gateway" --> "Stripe API" : HTTPS REST
     ```

### 8. Create the Prisma model.

   Create: `prisma/models/export-run.prisma`

   ```prisma
   model ExportRun {
     id          String    @id @default(cuid())
     runId       String    @unique @map("run_id")
     projectId   String    @map("project_id")
     userId      String    @map("user_id")
     framework   String
     status      String    @default("pending") // pending | generating | completed | failed
     blobUrl     String?   @map("blob_url")
     createdAt   DateTime  @default(now()) @map("created_at")
     completedAt DateTime? @map("completed_at")

     @@index([runId])
     @@index([userId, projectId])
     @@map("export_runs")
   }
   ```

   Run `npx prisma migrate dev --name add_export_runs` to generate the migration.

### 9. Create the code export Trigger.dev task.

   Create: `trigger/code-export.ts`

   Export `codeExport` task using `task()` from `@trigger.dev/sdk`.

   Payload: `{ canvasJson: { nodes: any[]; edges: any[] }; framework: string; projectId: string; userId: string }`

   Retry: `maxAttempts: 2`, `factor: 2`, `minTimeoutInMs: 2000`, `maxTimeoutInMs: 30_000`

   Logic:
   1. Look up the framework from `FRAMEWORKS` by ID. Reject if not found.
   2. Build system prompt via `buildSystemPrompt(framework)`.
   3. Build user prompt via `buildGraphDescription(canvasJson)`.
   4. Call `generateObject()` from `ai` SDK with `google("gemini-2.5-flash")` model, Zod schema `{ files: z.array(z.object({ path: z.string(), content: z.string() })) }`, system + user prompts.
   5. Create a `JSZip` instance, add each file from the result, generate a `nodebuffer`.
   6. Upload the buffer to Vercel Blob with key `export-{projectId}-{framework}-{timestamp}.zip`.
   7. Update the `ExportRun` record in Prisma: set `status = "completed"`, `blobUrl = blob.url`, `completedAt = now()`.
   8. Return `{ status: "completed", blobUrl: blob.url, fileCount: files.length }`.

   Error handling: if any step fails, update `ExportRun` to `status = "failed"` and throw.

### 10. Create the export API route.

   Create: `app/api/export/code/route.ts`

   POST handler:
   1. Extract `userId` from Clerk `auth()`. Return 401 if unauthenticated.
   2. Parse JSON body: `{ projectId: string, framework: string }`. Return 400 if missing or invalid.
   3. Validate `framework` exists in `FRAMEWORKS`. Return 400 if unknown.
   4. Verify project access via `checkProjectAccess(projectId)`. Return 403 if no access.
   5. Fetch canvas state: read `canvasJsonPath` from Prisma, GET the blob, parse JSON. Return 404 if no canvas saved.
   6. Trigger the `codeExport` task via `tasks.trigger()`. Return 502 if trigger fails.
   7. Create an `ExportRun` record with `runId = handle.id`, `projectId`, `userId`, `framework`, `status = "pending"`.
   8. Return `{ runId: handle.id }`.

### 11. Create the token API route.

   Create: `app/api/export/code/[runId]/token/route.ts`

   POST handler:
   1. Extract `userId` from Clerk `auth()`. Return 401 if unauthenticated.
   2. Parse JSON body: `{ runId: string }`. Return 400 if missing.
   3. Look up `ExportRun` by `runId`. Return 404 if not found.
   4. Verify `exportRun.userId === userId`. Return 403 if mismatch.
   5. Generate Trigger.dev public token scoped to that run via `auth.createPublicToken({ scopes: { read: { runs: [runId] } } })`.
   6. Return `{ token }`.

### 12. Create the download API route.

   Create: `app/api/export/code/[runId]/download/route.ts`

   GET handler:
   1. Extract `userId` from Clerk `auth()`. Return 401 if unauthenticated.
   2. Extract `runId` from params. Return 400 if missing.
   3. Look up `ExportRun` by `runId`. Return 404 if not found.
   4. Verify `exportRun.userId === userId`. Return 403 if mismatch.
   5. Verify `exportRun.status === "completed"` and `exportRun.blobUrl` exists. Return 409 if still processing, 500 if failed.
   6. Fetch the ZIP from the blob URL.
   7. Return the ZIP buffer with headers: `Content-Type: application/zip`, `Content-Disposition: attachment; filename="{projectName}-{framework}.zip"`.

### 13. Create the export dialog component.

   Create: `components/editor/export-dialog.tsx`

   Props: `{ isOpen: boolean; onClose: () => void; projectId: string; projectName: string; nodes: any[]; edges: any[]; reactFlowWrapperRef: React.RefObject<HTMLDivElement> }`

   Structure:
   - shadcn Dialog (reuse existing `dialog.tsx`)
   - Two sections separated by a divider:
     - **Diagram Formats**: row of buttons for Mermaid, PlantUML, PNG, SVG, JSON
     - **Code Scaffolds**: grid of framework buttons (single selection, highlighted with `bg-accent-brand/20 border-accent-brand`) + "Generate & Download ZIP" button
   - Progress section (visible during generation): status text, progress bar, file count

   Behavior:
   - Diagram buttons: on click, call the respective export function, then `downloadFile()` with the slugified project name
   - Framework buttons: on click, set `selectedFramework` state (highlight the button)
   - "Generate & Download ZIP": on click, POST to `/api/export/code` with `{ projectId, framework }`, then POST to `/api/export/code/[runId]/token` to get a public token, then use `useRealtimeRun` to subscribe to the run status. On completion, trigger a GET to `/api/export/code/[runId]/download` via a hidden `<a>` element click.
   - Disable all buttons during generation
   - Show "Generating..." status with file count from run metadata

   Use lucide-react icons: `Download`, `FileCode`, `FileImage`, `FileJson`, `Package`, `Loader2`.

### 14. Add the Export button to the canvas control bar.

   Modify: `components/editor/canvas-control-bar.tsx`

   - Add `onExport` prop to the interface
   - Add an "Export" button with `Download` icon between the Templates button and the Help button
   - Style: same as other control bar buttons (`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors`)

### 15. Wire the export dialog into the workspace shell.

   Modify: `components/editor/workspace-shell.tsx`

   - Add `exportDialogOpen` state (`useState(false)`)
   - Pass `onExport={() => setExportDialogOpen(true)}` to `CanvasControlBar`
   - Render `<ExportDialog>` with `isOpen={exportDialogOpen}`, `onClose`, `projectId`, `projectName`, `nodes`, `edges`, `reactFlowWrapperRef`

### 16. Expose the ReactFlow viewport ref from the canvas.

   Modify: `components/editor/canvas.tsx`

   - Accept an optional `reactFlowWrapperRef` prop from the parent
   - Attach it to the existing wrapper `<div>` that contains the ReactFlow instance
   - This ref is needed by the image export module to capture the viewport DOM

   Modify: `components/editor/live-canvas.tsx`

   - Create a `useRef<HTMLDivElement>` for the wrapper
   - Pass it to `<Canvas>` as `reactFlowWrapperRef`
   - Pass it to `<ExportDialog>` via the shell (thread through props or context)

### 17. Add dependencies.

   Modify: `package.json`

   Add to `dependencies`:
   - `"html-to-image": "^1.11.11"` — PNG/SVG export from DOM
   - `"jszip": "^3.10.1"` — ZIP creation in Trigger.dev task

### 18. Add tests.

   Create: `tests/unit/lib/export/mermaid.test.ts`
   - Test shape-to-Mermaid mapping for all 6 shapes
   - Test edge label rendering
   - Test special characters in node labels (sanitize)
   - Test empty graph returns just `graph TD`

   Create: `tests/unit/lib/export/plantuml.test.ts`
   - Test shape-to-PlantUML mapping for all 6 shapes
   - Test edge label rendering
   - Test empty graph returns `@startuml\n@enduml`

   Create: `tests/unit/lib/export/frameworks.test.ts`
   - Test `FRAMEWORKS` has exactly 10 entries
   - Test each framework has required fields (id, name, language, promptHints)
   - Test `getFramework` returns correct entry and undefined for unknown

   Create: `tests/integration/api/export/code.test.ts`
   - Test POST returns 401 without auth
   - Test POST returns 400 with missing projectId
   - Test POST returns 400 with unknown framework
   - Test POST returns 403 without project access

   Create: `tests/integration/api/export/download.test.ts`
   - Test GET returns 401 without auth
   - Test GET returns 404 for non-existent runId
   - Test GET returns 403 for run belonging to another user

## Scope Limits

- Don't implement subset selection (export all nodes only — future enhancement)
- Don't add rate limiting
- Don't implement drift detection (diagram vs codebase comparison)
- Don't add MCP server integration (future enhancement)
- Don't modify the AI sidebar — export dialog is a separate modal from the control bar
- Don't add code export to the AI sidebar's Specs tab — keep export in its own dialog
- Image export captures the ReactFlow viewport only (not the full page)

## Verify When Done

- [ ] Mermaid export produces valid `graph TD` syntax for all 6 shape types
- [ ] PlantUML export produces valid `@startuml`/`@enduml` syntax
- [ ] PNG export downloads a visible image of the canvas
- [ ] SVG export downloads a vector image of the canvas
- [ ] JSON export downloads a valid `{ nodes, edges }` JSON file
- [ ] Clicking a framework button highlights it as selected
- [ ] "Generate & Download ZIP" triggers the Trigger.dev task and shows progress
- [ ] Completed export downloads a valid ZIP file containing framework-appropriate files
- [ ] Export dialog opens from the canvas control bar Export button
- [ ] Export dialog closes cleanly and reopens without state leaks
- [ ] All 10 frameworks are listed and selectable
- [ ] `ExportRun` records are created in Prisma with correct status transitions
- [ ] Download route returns 403 for runs belonging to other users
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes
- [ ] Unit tests pass for mermaid, plantuml, and frameworks modules
