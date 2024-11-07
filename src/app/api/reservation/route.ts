import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const GET = async () => {
  const reservations = await prisma.reservation.findMany();

  console.log({ reservations });

  return NextResponse.json({ reservations });
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    console.log({ body });

    const { id, title, start, end, allDay, password } = body;

    const overlappingReservation = await prisma.reservation.findFirst({
      where: {
        OR: [
          {
            start: {
              lte: new Date(start),
            },
            end: {
              gte: new Date(end),
            },
          },
        ],
      },
    });

    console.log({ overlappingReservation });

    if (overlappingReservation) {
      return NextResponse.json({
        success: false,
        message: "指定した時間には既に予約が入っています。",
      });
    }

    const newResevation = await prisma.reservation.create({
      data: {
        reservationId: id,
        title,
        start,
        end,
        allDay,
        password,
      },
    });

    console.log({ newResevation });

    return NextResponse.json({ success: true, newResevation });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false, message: "Server Error" });
  }
};
