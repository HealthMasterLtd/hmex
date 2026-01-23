import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  internalCorporateTemplate,
  corporateAutoReplyTemplate,
} from "@/lib/corporateEmailTemplates";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      name,
      department,
      organization,
      employeeCount,
      email,
      phone,
      preferredDate,
    } = data;

    if (!name || !organization || !employeeCount || !email || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 1️⃣ Internal sales email
    await transporter.sendMail({
      from: `"HealthMaster Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `Corporate Demo — ${organization}`,
      html: internalCorporateTemplate(data),
    });

    // 2️⃣ Auto-reply to corporate client
    await transporter.sendMail({
      from: `"HealthMaster" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your HealthMaster demo request",
      html: corporateAutoReplyTemplate(name),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Corporate demo error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit demo request" },
      { status: 500 }
    );
  }
}
