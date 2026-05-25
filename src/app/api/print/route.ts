import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

type PrintRequestBody = {
  html?: string;
  printerName?: string;
};

/**
 * DirectPrint API Route
 * 
 * Handles printing directly inside Next.js — no separate print server needed.
 * Receives HTML + printer name → renders to PDF via Puppeteer → sends to Windows printer.
 * 
 * NOTE: This endpoint is only available in Node.js environments (local dev/deployment).
 * It will not work in Cloudflare Workers due to sandboxing constraints.
 */

// Map logical printer names to actual Windows printer names
const PRINTER_MAP: Record<string, string> = {
  'kitchen': 'kitchen',
  'food': 'food',
  'drink': 'drink',
  'POS-80C': 'POS-80C',
};

const TMP_DIR = path.join(process.cwd(), 'print-server', 'tmp');

// Check if running in Cloudflare Workers environment
const isCloudflareWorker = typeof global !== 'undefined' && (global as any).__VITEST_WORKER__;

export async function POST(request: NextRequest) {
  // Block print requests on Cloudflare Workers
  if (typeof (global as any).caches !== 'undefined' && !process.versions.node) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Print endpoint is not available in Cloudflare Workers. Use a Node.js backend for printing.'
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as PrintRequestBody;
    const { html, printerName } = body;

    if (!html || !printerName) {
      return NextResponse.json(
        { status: 'error', message: 'Missing html or printerName' },
        { status: 400 }
      );
    }

    const resolvedPrinter = PRINTER_MAP[printerName] || printerName;
    console.log(`[DirectPrint] Print job received → "${printerName}" → Printer: "${resolvedPrinter}"`);

    await printHtml(html, resolvedPrinter);
    console.log(`[DirectPrint] ✓ Sent to "${resolvedPrinter}"`);

    return NextResponse.json({ status: 'ok', printer: resolvedPrinter });
  } catch (error: any) {
    console.error('[DirectPrint] ✗ Print failed:', error.message);
    return NextResponse.json(
      { status: 'error', message: error.message || 'Print failed' },
      { status: 500 }
    );
  }
}

async function printHtml(htmlContent: string, printerName: string) {
  // Only available in Node.js environments
  if (!process.versions.node) {
    throw new Error('Printing is only supported in Node.js environments');
  }

  // Lazy load Node.js-specific dependencies
  let puppeteer: any;
  let pdfToPrinter: any;

  try {
    puppeteer = await import('puppeteer').then(m => m.default);
    pdfToPrinter = await import('pdf-to-printer').then(m => m.default || m);
  } catch (err: any) {
    throw new Error(`Failed to load print dependencies: ${err.message}`);
  }

  // Ensure tmp directory exists
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 302, height: 800 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const tmpFile = path.join(TMP_DIR, `pos_print_${Date.now()}.pdf`);

  await page.pdf({
    path: tmpFile,
    width: '80mm',
    printBackground: true,
    margin: { top: '2mm', right: '2mm', bottom: '2mm', left: '2mm' },
  });

  await browser.close();

  // Print PDF to the named Windows printer
  await pdfToPrinter.print(tmpFile, { printer: printerName });

  // Clean up temp file
  fs.unlink(tmpFile, () => { });
}
