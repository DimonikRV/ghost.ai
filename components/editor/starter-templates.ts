import type { ShapeType } from "@/types/canvas";

export interface DiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    color: string;
    shape: ShapeType;
    width?: number;
    height?: number;
  };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: { label?: string };
}

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// ---------------------------------------------------------------------------
// Template library — pre-built diagram templates for quick canvas creation.
// Node colors use CSS custom property tokens from the existing palette.
// ---------------------------------------------------------------------------

function node(
  id: string,
  shape: ShapeType,
  label: string,
  x: number,
  y: number,
  color = "var(--color-card)",
  width?: number,
  height?: number
): DiagramNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color, shape, width, height },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  label?: string
): DiagramEdge {
  return {
    id,
    source,
    target,
    type: "canvasEdge",
    data: label ? { label } : undefined,
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description:
      "API gateway routing to independent services with their own databases, connected via a message broker.",
    nodes: [
      node("api-gateway", "pill", "API Gateway", 350, 20, "var(--color-node-teal)", 180, 60),
      node("auth-service", "rectangle", "Auth Service", 60, 140, "var(--color-node-red)", 160, 80),
      node("user-service", "rectangle", "User Service", 260, 140, "var(--color-node-blue)", 160, 80),
      node("order-service", "rectangle", "Order Service", 460, 140, "var(--color-node-green)", 160, 80),
      node("notification-service", "rectangle", "Notification Service", 660, 140, "var(--color-node-amber)", 160, 80),
      node("message-broker", "cylinder", "Message Broker", 360, 280, "var(--color-node-violet)", 140, 100),
      node("auth-db", "cylinder", "Auth DB", 60, 280, "var(--color-node-red)", 120, 80),
      node("user-db", "cylinder", "User DB", 260, 280, "var(--color-node-blue)", 120, 80),
      node("order-db", "cylinder", "Order DB", 460, 280, "var(--color-node-green)", 120, 80),
    ],
    edges: [
      edge("e1", "api-gateway", "auth-service"),
      edge("e2", "api-gateway", "user-service"),
      edge("e3", "api-gateway", "order-service"),
      edge("e4", "api-gateway", "notification-service"),
      edge("e5", "auth-service", "auth-db"),
      edge("e6", "user-service", "user-db"),
      edge("e7", "order-service", "order-db"),
      edge("e8", "order-service", "message-broker"),
      edge("e9", "message-broker", "notification-service"),
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Source control triggers build, test, and deploy stages with artifact registry and monitoring feedback.",
    nodes: [
      node("source", "rectangle", "Source Control", 40, 100, "var(--color-node-blue)", 160, 80),
      node("build", "pill", "Build", 260, 100, "var(--color-node-teal)", 140, 60),
      node("test", "diamond", "Test", 460, 100, "var(--color-node-amber)", 140, 100),
      node("registry", "cylinder", "Artifact Registry", 460, 260, "var(--color-node-violet)", 160, 80),
      node("deploy", "pill", "Deploy", 660, 100, "var(--color-node-green)", 140, 60),
      node("staging", "rectangle", "Staging", 860, 40, "var(--color-node-orange)", 140, 80),
      node("production", "rectangle", "Production", 860, 160, "var(--color-node-red)", 140, 80),
      node("monitoring", "hexagon", "Monitoring", 660, 260, "var(--color-node-pink)", 140, 100),
    ],
    edges: [
      edge("e1", "source", "build", "push"),
      edge("e2", "build", "test", "artifact"),
      edge("e3", "test", "registry", "pass"),
      edge("e4", "test", "build", "fail"),
      edge("e5", "registry", "deploy"),
      edge("e6", "deploy", "staging"),
      edge("e7", "deploy", "production", "promote"),
      edge("e8", "production", "monitoring"),
      edge("e9", "monitoring", "source", "feedback"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producers publish events to an event bus, consumers subscribe and react, with dead-letter queue for failures.",
    nodes: [
      node("producer-1", "rectangle", "Order Service", 40, 60, "var(--color-node-green)", 140, 80),
      node("producer-2", "rectangle", "User Service", 40, 180, "var(--color-node-blue)", 140, 80),
      node("producer-3", "rectangle", "Payment Service", 40, 300, "var(--color-node-teal)", 140, 80),
      node("event-bus", "pill", "Event Bus", 280, 180, "var(--color-node-violet)", 160, 60),
      node("consumer-1", "rectangle", "Notification Service", 520, 60, "var(--color-node-amber)", 160, 80),
      node("consumer-2", "rectangle", "Analytics Service", 520, 180, "var(--color-node-orange)", 160, 80),
      node("consumer-3", "rectangle", "Audit Service", 520, 300, "var(--color-node-pink)", 160, 80),
      node("dlq", "cylinder", "Dead Letter Queue", 740, 180, "var(--color-node-red)", 160, 80),
    ],
    edges: [
      edge("e1", "producer-1", "event-bus", "order.created"),
      edge("e2", "producer-2", "event-bus", "user.updated"),
      edge("e3", "producer-3", "event-bus", "payment.processed"),
      edge("e4", "event-bus", "consumer-1"),
      edge("e5", "event-bus", "consumer-2"),
      edge("e6", "event-bus", "consumer-3"),
      edge("e7", "event-bus", "dlq", "failed events"),
    ],
  },
];
