import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsersCollection } from "@/lib/db/collections";
import { applyRateLimit, getRateLimitKey } from "@/lib/api/helpers";

export async function POST(request: Request) {
  try {
    // Stricter rate limiting for registration (unauthenticated)
    const rateLimited = applyRateLimit(getRateLimitKey(request));
    if (rateLimited) return rateLimited;

    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const users = await getUsersCollection();
    const existing = await users.findOne({ email: email.toLowerCase() });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await users.insertOne({
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      createdAt: new Date(),
    });

    return NextResponse.json(
      { id: result.insertedId.toString(), email: email.toLowerCase(), name: name.trim() },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
