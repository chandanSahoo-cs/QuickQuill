import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const orgId = body.orgId;

  if (!orgId) {
    return NextResponse.json(
      {
        error: "Missing orgId",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const org = (await clerkClient()).organizations.getOrganization({
      organizationId: orgId,
    });

    return NextResponse.json({
      id: (await org).id,
      name: (await org).name,
      slug: (await org).slug,
      createdAt: (await org).createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch organization", error);
    return NextResponse.json({ error: "Could not fetch org" }, { status: 500 });
  }
}
