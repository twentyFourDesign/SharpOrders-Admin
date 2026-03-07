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
    prisma.load.count({ where: { status: "available" } }),
    prisma.shipment.count(),
    prisma.shipment.count({
      where: { status: { in: ["pending", "picked_up", "in_transit", "approaching_dropoff"] } },
    }),
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

  // Command center: fleet (online vs offline, by truck type and status)
  const [driverProfiles, presenceList] = await Promise.all([
    prisma.profile.findMany({
      where: { userType: "driver" },
      select: { id: true, truckType: true },
    }),
    prisma.driverPresence.findMany({ select: { driverId: true, status: true } }),
  ]);
  const presenceByDriver = new Map(presenceList.map((p) => [p.driverId, p.status]));
  const onlineCount = presenceByDriver.size;
  const fleetByTruckType: Record<string, { total: number; idle: number; enRouteOrLoaded: number }> = {};
  for (const d of driverProfiles) {
    const truckType = d.truckType?.trim() || "Other";
    if (!fleetByTruckType[truckType]) fleetByTruckType[truckType] = { total: 0, idle: 0, enRouteOrLoaded: 0 };
    fleetByTruckType[truckType].total += 1;
    const status = presenceByDriver.get(d.id);
    if (status === "available") fleetByTruckType[truckType].idle += 1;
    else if (status === "busy") fleetByTruckType[truckType].enRouteOrLoaded += 1;
  }

  // GMV = total value of freight moved (successful payments in naira)
  const gmv = totalRevenue;

  // Driver payouts (total credits to wallets, in kobo -> naira)
  const driverPayoutsAgg = await prisma.walletTransaction.aggregate({
    _sum: { amount: true },
    where: { type: "credit", status: "success" },
  });
  const driverPayoutsNaira = Math.round((driverPayoutsAgg._sum.amount ?? 0) / 100);
  const platformTake = Math.max(0, totalRevenue - driverPayoutsNaira);

  // Outstanding payouts (wallet balances waiting to be withdrawn; assume kobo)
  const outstandingAgg = await prisma.wallet.aggregate({
    _sum: { balance: true },
  });
  const outstandingPayoutsNaira = Math.round((outstandingAgg._sum.balance ?? 0) / 100);

  // Volume by cargo/truck type (delivered loads grouped by truckType)
  const deliveredLoadsByType = await prisma.load.groupBy({
    by: ["truckType"],
    where: { status: "delivered" },
    _count: { id: true },
  });
  const totalDelivered = deliveredLoadsByType.reduce((s, r) => s + r._count.id, 0);
  const volumeByCargoCategory = deliveredLoadsByType.map((r) => ({
    category: r.truckType,
    count: r._count.id,
    percentage: totalDelivered > 0 ? Math.round((r._count.id / totalDelivered) * 100) : 0,
  }));

  const body = {
    users: { total: totalUsers, shippers, drivers, newLast30d: newUsersLast30d },
    loads: { total: totalLoads, active: activeLoads },
    shipments: { total: totalShipments, active: activeShipments, delivered: deliveredShipments },
    bids: { total: totalBids, pending: pendingBids, accepted: acceptedBids },
    payments: { total: totalPayments, successful: successfulPayments, totalRevenue },
    support: { openTickets },
    commandCenter: {
      liveActiveOrders: activeShipments,
      fleet: {
        totalDrivers: drivers,
        online: onlineCount,
        offline: Math.max(0, drivers - onlineCount),
        byTruckType: fleetByTruckType,
      },
      gmv,
      platformTakeRate: platformTake,
      outstandingPayouts: outstandingPayoutsNaira,
      volumeByCargoCategory,
    },
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}
