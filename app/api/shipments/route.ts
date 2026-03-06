import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/jwt";

// GET /api/shipments  - returns shipments for current user (shipper or driver)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Shipper: keep existing shape
    if (payload.role === "shipper") {
      const shipments = await prisma.shipment.findMany({
        where: { shipperId: payload.sub },
        orderBy: { createdAt: "desc" },
        include: {
          load: {
            select: {
              truckType: true,
              loadDescription: true,
              recipientName: true,
              recipientNumber: true,
              loadImageUrl: true,
              pickupMapsUrl: true,
              deliveryMapsUrl: true,
            },
          },
          driver: {
            select: {
              firstName: true,
              lastName: true,
              phoneNumber: true,
              truckType: true,
            },
          },
          shipper: {
            select: {
              email: true,
              businessName: true,
              displayName: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      return NextResponse.json(shipments);
    }

    // Driver: include bid/payment context so the app can display
    // shipper offer, the driver's bid, and the accepted price.
    const shipments = await prisma.shipment.findMany({
      where: { driverId: payload.sub },
      orderBy: { createdAt: "desc" },
      include: {
        load: {
          select: {
            truckType: true,
            loadDescription: true,
            recipientName: true,
            recipientNumber: true,
            loadImageUrl: true,
            pickupMapsUrl: true,
            deliveryMapsUrl: true,
            bids: {
              where: { driverId: payload.sub },
              select: {
                offerAmount: true,
                status: true,
                payment: {
                  select: {
                    amount: true, // stored in kobo
                    status: true,
                  },
                },
              },
            },
          },
        },
        driver: {
          select: {
            firstName: true,
            lastName: true,
            phoneNumber: true,
            truckType: true,
          },
        },
        shipper: {
          select: {
            email: true,
            businessName: true,
            displayName: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Also load AppUser records for these shippers so we can rely on the
    // latest businessName / phone stored on the auth user table.
    const uniqueShipperIds = Array.from(
      new Set(shipments.map((s) => s.shipperId)),
    );

    const shipperUsers = await prisma.appUser.findMany({
      where: { id: { in: uniqueShipperIds } },
      select: {
        id: true,
        email: true,
        businessName: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneNumber: true,
      },
    });

    const shipperUserById = new Map(
      shipperUsers.map((u) => [u.id, u]),
    );

    const shaped = shipments.map((shipment) => {
      const load: any = shipment.load;
      const myBid = (load?.bids && load.bids[0]) ?? null;

      const profileShipper: any = (shipment as any).shipper;
      const userShipper = shipperUserById.get(shipment.shipperId);

      // Payment.amount is stored in kobo; convert back to naira.
      const paymentNaira =
        myBid?.payment?.status === "success"
          ? Math.round((myBid.payment.amount ?? 0) / 100)
          : null;

      const driverBidAmount = myBid?.offerAmount ?? null;

      const acceptedAmount =
        paymentNaira ??
        driverBidAmount ??
        shipment.fareOffer;

      const mergedShipper = userShipper || profileShipper
        ? {
            email: userShipper?.email ?? profileShipper?.email ?? null,
            businessName:
              userShipper?.businessName ?? profileShipper?.businessName ?? null,
            displayName: profileShipper?.displayName ?? null,
            firstName:
              userShipper?.firstName ?? profileShipper?.firstName ?? null,
            lastName:
              userShipper?.lastName ?? profileShipper?.lastName ?? null,
            phone:
              userShipper?.phone ??
              userShipper?.phoneNumber ??
              profileShipper?.phone ??
              null,
          }
        : null;

      return {
        ...shipment,
        load: load,
        shipper: mergedShipper,
        shipperOfferAmount: shipment.fareOffer,
        driverBidAmount,
        acceptedAmount,
      };
    });

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("[GET /api/shipments] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
