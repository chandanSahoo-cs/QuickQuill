import { NextResponse } from "next/server";
import { executablePath } from "puppeteer-core";

export const runtime= "nodejs"

const getBrowser = async () =>{
  const isVercel = !!process.env.VERCEL;

  if(isVercel){
    const chromium = (await import("@sparticuz/chromium")).default
    const puppeteer = await import("puppeteer-core")

    return await puppeteer.launch({
      args : chromium.args,
      executablePath : await chromium.executablePath(),
      headless:true,
    })
  }else{
    const puppeteer = await import("puppeteer");
    return await puppeteer.launch({
      headless : true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }
}

export async function POST(req: Request) {
  const { fullHtml } = await req.json();

  const browser = await getBrowser();

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "24px",
      bottom: "24px",
      left: "16px",
      right: "16px",
    },
  });

  console.log(pdfBuffer);

  await browser.close();

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="document.pdf"',
    },
  });
}
