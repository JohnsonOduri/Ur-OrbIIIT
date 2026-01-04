import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import type { Browser } from "puppeteer";
import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import type { LeaveRequest } from "@/app/leave-form/types";
import { getLeaveRequestByIdAdmin } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const TEMPLATE_DIR = path.join(process.cwd(), "public", "data");
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, "LeaveFormTemplate.html");
const TEMPLATE_BASE_HREF = withTrailingSlash(pathToFileURL(TEMPLATE_DIR).href);

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyTemplate = (template: string, replacements: Record<string, string>) => {
  return Object.entries(replacements).reduce((acc, [token, v]) => {
    return acc.replace(new RegExp(escapeRegExp(token), "g"), v ?? "");
  }, template);
};

const ensureBaseHref = (html: string) => {
  if (html.includes("<base")) return html;
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head><base href="${TEMPLATE_BASE_HREF}">`);
  }
  return `<head><base href="${TEMPLATE_BASE_HREF}"></head>${html}`;
};

async function resolveLeaveRequest(requestId: string | undefined, provided?: LeaveRequest) {
  if (provided && provided.status === "approved") return provided;
  if (!requestId) return null;
  try {
    return await getLeaveRequestByIdAdmin(requestId);
  } catch (error) {
    console.error("Admin Firestore lookup failed", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { requestId, request: provided } = body as { requestId?: string; request?: LeaveRequest };
    if (!requestId && !provided) {
      return NextResponse.json({ error: "requestId or request payload required" }, { status: 400 });
    }

    const record = await resolveLeaveRequest(requestId, provided);
    if (!record) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (record.status !== "approved") {
      return NextResponse.json({ error: "PDF available only after final approval" }, { status: 400 });
    }

    const template = await fs.readFile(TEMPLATE_PATH, "utf8");

    const replacements: Record<string, string> = {
      "{{STUDENT_NAME}}": record.studentProfile?.name || "",
      "{{STUDENT_ROLL}}": record.studentProfile?.rollNumber || "",
      "{{STUDENT_MOBILE}}": record.studentProfile?.mobile || "",
      "{{STUDENT_COURSE}}": record.studentProfile?.course || "",
      "{{STUDENT_SEMESTER}}": record.studentProfile?.semester || "",
      "{{STUDENT_HOSTEL}}": record.studentProfile?.hostel || "",
      "{{STUDENT_ROOM}}": record.studentProfile?.roomNumber || "",
      "{{STUDENT_ADDRESS}}": record.studentAddress || "",
      "{{PARENT_MOBILE}}": record.parentMobile || "",
      "{{PARENT_EMAIL}}": record.parentEmail || "",
      "{{STUDENT_CONTACT}}": record.contactAddress || "",
      "{{LEAVE_PURPOSE}}": record.leavePurpose || "",
      "{{FACULTY_NAME}}": record.faculty?.name || "Faculty Advisor",
      "{{FACULTY_COMMENTS}}": record.faculty?.comments || "",
      "{{WARDEN_COMMENTS}}": record.warden?.comments || "",
      "{{WARDEN_NAME}}": record.warden?.name || "Warden",
      "{{FROM_DATE}}": formatDate(record.fromDate),
      "{{FROM_TIME}}": record.fromTime || "",
      "{{TO_DATE}}": formatDate(record.toDate),
      "{{TO_TIME}}": record.toTime || "",
      "{{DAYS}}": String(record.totalDays ?? ""),
      "{{W_DAYS}}": String(record.workingDays ?? ""),
      "{{DATE_APPLIED}}": formatDate(record.dateApplied),
      "{{DATE_APPROVAL}}": formatDate(record.warden?.actedAt || record.faculty?.actedAt || new Date().toISOString()),
      "{{APPLICATION_ID}}": record.applicationId || ""
    };

    const htmlWithData = applyTemplate(template, replacements);
    const html = ensureBaseHref(htmlWithData);

    let browser: Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      await page.emulateMediaType("screen");

      const pdfBytes = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" }
      });

      // Convert the returned Uint8Array to a Node Buffer to satisfy BodyInit typing
      const pdfBuffer = Buffer.from(pdfBytes);
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${record.studentProfile?.rollNumber || "LeaveForm"}.pdf`
        }
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  } catch (error) {
    console.error("leave pdf generation failed", error, (error && (error as any).stack));
    return NextResponse.json({ error: "Unable to generate PDF" }, { status: 500 });
  }
}

function withTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}
