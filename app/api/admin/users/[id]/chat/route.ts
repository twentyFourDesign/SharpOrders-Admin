import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

const CHAT_WITH_ADMIN_TITLE = "Chat with Admin";

// GET /api/admin/users/[id]/chat — get or create "Chat with Admin" ticket for this user (AppUser id); returns ticket with replies and user info
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAdminPayload(request)) return unauthorized();

  const { id: appUserId } = await params;

  const appUser = await prisma.appUser.findUnique({
    where: { id: appUserId },
    select: { id: true, email: true, firstName: true, lastName: true, businessName: true },
  });
  if (!appUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = await prisma.profile.findUnique({
    where: { email: appUser.email },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  }

  // Find ticket by profile.id OR appUserId so we get the same ticket the app created (app uses JWT sub = AppUser.id as userId)
  let ticket = await prisma.supportTicket.findFirst({
    where: {
      userId: { in: [profile.id, appUserId] },
      title: CHAT_WITH_ADMIN_TITLE,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      replies: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) {
    ticket = await prisma.supportTicket.create({
      data: {
        userId: profile.id,
        title: CHAT_WITH_ADMIN_TITLE,
        description: "Direct chat with support.",
        status: "open",
      },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  const displayName =
    appUser.businessName?.trim() ||
    [appUser.firstName, appUser.lastName].filter(Boolean).join(" ").trim() ||
    appUser.email;

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      replies: ticket.replies ?? [],
    },
    user: {
      id: appUser.id,
      email: appUser.email,
      displayName,
    },
  });
}
