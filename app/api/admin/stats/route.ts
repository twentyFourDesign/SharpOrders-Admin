import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!getAdminPayload(request)) return unauthorized();

  const [
    totalUsers,
    shippers,
    drivers,
    totalLoads,
    activeLoads,
    totalShipments,
    activeShipments,
    deliveredShipments,
    totalBids,
    pendingBids,
    acceptedBids,
    totalPayments,
    successfulPayments,
    openTickets,
  ] = await Promise.all([
    prisma.appUser.count(),
    prisma.appUser.count({ where: { role: "shipper" } }),
    prisma.appUser.count({ where: { role: "driver" } }),
    prisma.load.count(),
    prisma.load.count({ where: { status: "active" } }),
    prisma.shipment.count(),
    prisma.shipment.count({ where: { status: "active" } }),
    prisma.shipment.count({ where: { status: "delivered" } }),
    prisma.bid.count(),
    prisma.bid.count({ where: { status: "pending" } }),
    prisma.bid.count({ where: { status: "accepted" } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "success" } }),
    prisma.supportTicket.count({ where: { status: "open" } }),
  ]);

  // Revenue in naira (payments stored in kobo)
  const revenueAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "success" },
  });
  const totalRevenue = Math.round((revenueAgg._sum.amount ?? 0) / 100);

  // Recent registrations — last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newUsersLast30d = await prisma.appUser.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  return NextResponse.json({
    users: { total: totalUsers, shippers, drivers, newLast30d: newUsersLast30d },
    loads: { total: totalLoads, active: activeLoads },
    shipments: { total: totalShipments, active: activeShipments, delivered: deliveredShipments },
    bids: { total: totalBids, pending: pendingBids, accepted: acceptedBids },
    payments: { total: totalPayments, successful: successfulPayments, totalRevenue },
    support: { openTickets },
  });
}
