/**
 * DirectPrint — sends print jobs via HTTP POST to /api/print
 * Works from any device (PC, phone, etc.) — no separate print server needed.
 */

type PrintResponse = {
  status: 'ok' | 'error';
  printer?: string;
  message?: string;
};

export function connectWS() {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const printServer = urlParams.get('print_server');
    if (printServer) {
      window.localStorage.setItem('print_server_url', printServer);
      console.log('[DirectPrint] Configured print server from URL query:', printServer);
    }
    const currentConfig = window.localStorage.getItem('print_server_url');
    console.log('[DirectPrint] Ready (using HTTP API mode). Configured server:', currentConfig || 'Default (current origin)');
  }
}

export async function DirectPrint(data: { printer_name: string; html_data: string; position?: number; numprint?: number }): Promise<boolean> {
  console.log('[DirectPrint] Sending print job:', data.printer_name);
  return await sendPrintJob(data.html_data, data.printer_name);
}

async function sendPrintJob(html: string, printerName: string): Promise<boolean> {
  try {
    let printServerUrl = '';
    if (typeof window !== 'undefined') {
      printServerUrl = window.localStorage.getItem('print_server_url') || '';
    }

    // Default to the NEXT_PUBLIC_PRINT_SERVER_URL environment variable if localStorage is not configured
    if (!printServerUrl && process.env.NEXT_PUBLIC_PRINT_SERVER_URL) {
      printServerUrl = process.env.NEXT_PUBLIC_PRINT_SERVER_URL;
    }

    const endpoint = printServerUrl 
      ? `${printServerUrl.replace(/\/$/, '')}/api/print` 
      : '/api/print';

    console.log(`[DirectPrint] Fetching endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, printerName }),
    });

    const result = (await response.json()) as PrintResponse;

    if (result.status === 'ok') {
      console.log(`[DirectPrint] ✅ Printed on "${result.printer}"`);
      return true;
    } else {
      console.error(`[DirectPrint] ❌ Error:`, result.message);
      return false;
    }
  } catch (error: any) {
    console.error(`[DirectPrint] ❌ Failed:`, error.message);
    return false;
  }
}
