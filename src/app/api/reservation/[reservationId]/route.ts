import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface Params {
  reservationId?: string;
}

export const DELETE = async (
  request: Request,
  { params }: { params: Params }
) => {
  const { reservationId } = params;
  console.log({ reservationId });
  const body = await request.json();

  console.log({ body });

  try {
    const reservation = await prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },
    });

    if (body === "kasinokiadmin") {
      await prisma.reservation.delete({
        where: {
          id: reservationId,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (reservation) {
      if (reservation.password === body) {
        await prisma.reservation.delete({
          where: {
            id: reservationId,
          },
        });

        return NextResponse.json({
          success: true,
          message: "予約が正常に削除されました。",
        });
      } else {
        return NextResponse.json({
          success: false,
        });
      }
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false });
  }
};
