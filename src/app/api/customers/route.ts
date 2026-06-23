import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { listCustomers, getCustomerByEmail, saveCustomer } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import type { Customer } from "@/types/content";

export async function GET() {
  const customers = await listCustomers();
  // Passwort-Hash nicht ausliefern
  return NextResponse.json(customers.map(({ passwordHash, ...c }) => c));
}

/** Admin legt einen Kunden an (Name, E-Mail, Initialpasswort). */
export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Name, E-Mail und Passwort sind erforderlich." }, { status: 400 });
  const mail = String(email).toLowerCase().trim();
  if (await getCustomerByEmail(mail)) return NextResponse.json({ error: "Ein Kunde mit dieser E-Mail existiert bereits." }, { status: 409 });
  const customer: Customer = {
    id: randomUUID(),
    name: String(name).trim(),
    email: mail,
    passwordHash: hashPassword(String(password)),
    createdAt: new Date().toISOString(),
  };
  await saveCustomer(customer);
  return NextResponse.json({ id: customer.id, email: customer.email });
}
