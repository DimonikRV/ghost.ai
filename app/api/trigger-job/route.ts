import { NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk";
import type { processBackgroundJob } from "@/trigger/background-jobs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const handle = await tasks.trigger<typeof processBackgroundJob>(
      "background-job",
      {
        type: body.type || "default",
        data: body.data || {},
      }
    );

    return NextResponse.json({
      success: true,
      runId: handle.id,
    });
  } catch (error) {
    console.error("Failed to trigger background job:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
