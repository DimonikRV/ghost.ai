export interface FrameworkDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  language: string;
  fileExtensions: string[];
  promptHints: string;
}

export const FRAMEWORKS: FrameworkDef[] = [
  {
    id: "spring-boot",
    name: "Java Spring Boot",
    icon: "Coffee",
    description: "Enterprise Java with Spring Boot, Spring Data JPA, Spring Web",
    language: "java",
    fileExtensions: [".java", ".xml", ".properties", ".yml"],
    promptHints:
      "Use Spring Boot 3.x, Java 17+, Maven. Include pom.xml with spring-boot-starter-web, spring-boot-starter-data-jpa. " +
      "Map cylinder nodes to @Entity classes + JPA repositories. Rectangle nodes to @RestController services. " +
      "Include application.yml with H2/PostgreSQL config. Create proper package structure under src/main/java.",
  },
  {
    id: "node-fastify",
    name: "Node.js Fastify",
    icon: "Server",
    description: "Fast, low-overhead Node.js web framework",
    language: "typescript",
    fileExtensions: [".ts", ".js", ".json"],
    promptHints:
      "Use Fastify 5.x, TypeScript, ESM modules. Include package.json with fastify and @fastify/cors. " +
      "Map cylinder nodes to database model/service files. Rectangle nodes to route plugins. " +
      "Include tsconfig.json, src/ directory with main.ts entry point and routes/ directory.",
  },
  {
    id: "python-fastapi",
    name: "Python FastAPI",
    icon: "Code",
    description: "Modern Python web framework with async support",
    language: "python",
    fileExtensions: [".py", ".toml", ".txt"],
    promptHints:
      "Use FastAPI 0.115+, Python 3.12+. Include pyproject.toml with fastapi and uvicorn dependencies. " +
      "Map cylinder nodes to SQLAlchemy models. Rectangle nodes to APIRouter files. " +
      "Include main.py entry point, src/ structure with models/, routes/, services/ directories.",
  },
  {
    id: "go-chi",
    name: "Go (Chi router)",
    icon: "Terminal",
    description: "Lightweight Go HTTP router",
    language: "go",
    fileExtensions: [".go", ".mod", ".sum"],
    promptHints:
      "Use Go 1.22+, github.com/go-chi/chi/v5 router. Include go.mod, main.go. " +
      "Map cylinder nodes to database packages with SQL/Redis clients. Rectangle nodes to handler packages. " +
      "Create cmd/ and internal/ structure with proper Go project layout.",
  },
  {
    id: "rust-axum",
    name: "Rust (Axum)",
    icon: "Wrench",
    description: "Ergonomic Rust web framework",
    language: "rust",
    fileExtensions: [".rs", ".toml"],
    promptHints:
      "Use Axum 0.7+, tokio async runtime. Include Cargo.toml with axum, tokio, serde dependencies. " +
      "Map cylinder nodes to database modules with sqlx/sled. Rectangle nodes to handler modules. " +
      "Include src/main.rs, src/routes/, src/models/, src/state.rs structure.",
  },
  {
    id: "dotnet-aspnet",
    name: ".NET ASP.NET Core",
    icon: "Globe",
    description: "Cross-platform .NET web framework",
    language: "csharp",
    fileExtensions: [".cs", ".csproj", ".sln"],
    promptHints:
      "Use .NET 8+, minimal APIs pattern. Include .csproj with ASP.NET Core SDK. " +
      "Map cylinder nodes to Entity Framework DbContext + model classes. Rectangle nodes to endpoint groups. " +
      "Include Program.cs, Controllers/ or Endpoints/, Models/, Services/ directories.",
  },
  {
    id: "docker-compose",
    name: "Docker Compose",
    icon: "Container",
    description: "Multi-service Docker orchestration",
    language: "yaml",
    fileExtensions: [".yml", ".yaml", "Dockerfile"],
    promptHints:
      "Map each canvas node to a Docker service in docker-compose.yml. " +
      "Cylinder nodes get named volumes. Hexagon nodes use external_image references. " +
      "Include individual Dockerfiles for custom services, .env.example with required variables, " +
      "and a .dockerignore file. Use proper networking between services.",
  },
  {
    id: "terraform",
    name: "Terraform",
    icon: "Cloud",
    description: "Infrastructure as Code for cloud resources",
    language: "hcl",
    fileExtensions: [".tf", ".tfvars"],
    promptHints:
      "Map architecture to AWS resources. Rectangle nodes → aws_instance or aws_lambda_function. " +
      "Cylinder nodes → aws_db_instance or aws_s3_bucket. Hexagon nodes → data sources. " +
      "Include main.tf, variables.tf, outputs.tf, provider.tf with AWS provider config. " +
      "Use terraform blocks, proper resource naming, and variable references.",
  },
  {
    id: "mermaid-export",
    name: "Mermaid Diagram",
    icon: "GitBranch",
    description: "Annotated Mermaid diagram with groupings and subgraphs",
    language: "markdown",
    fileExtensions: [".md", ".mmd"],
    promptHints:
      "Generate a comprehensive Mermaid diagram file. Use graph TD direction. " +
      "Group related services into subgraphs. Add node annotations with shape-specific syntax. " +
      "Include edge labels for protocols/actions. Add a legend comment at the top explaining the notation.",
  },
  {
    id: "adr",
    name: "Architecture Decision Record",
    icon: "FileText",
    description: "Markdown ADR documenting architecture decisions",
    language: "markdown",
    fileExtensions: [".md"],
    promptHints:
      "Generate an Architecture Decision Record (ADR) in markdown format. " +
      "Sections: Title, Status (Proposed/Accepted), Context, Decision, Consequences. " +
      "Reference all canvas services and their relationships. Explain technology choices. " +
      "Document trade-offs, risks, and alternatives considered.",
  },
];

export function getFramework(id: string): FrameworkDef | undefined {
  return FRAMEWORKS.find((f) => f.id === id);
}
