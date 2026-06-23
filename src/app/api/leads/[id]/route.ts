import { NextRequest, NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/db";
import type { LeadStatus } from "@/types/content";

/** Lead-Status ändern (neu / kontaktiert / abgeschlossen). */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const status = body.status as LeadStatus;
  if (!["neu", "kontaktiert", "abgeschlossen"].includes(status)) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }
  await updateLeadStatus(params.id, status);
  return NextResponse.json({ ok: true });
}
