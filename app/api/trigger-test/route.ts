import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import type { exampleTask } from "@/trigger/tasks";

export async function GET() {
  try {
    console.log("Triggering example-task...");
    const handle = await tasks.trigger<typeof exampleTask>("example-task", {
      message: "Triggered from API route at " + new Date().toISOString(),
    });
    console.log("Task triggered:", handle);

    return NextResponse.json({
      success: true,
      runId: handle.id,
    });
  } catch (error) {
    console.error("Failed to trigger task:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
