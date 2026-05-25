
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
  // No-op — kept for backward compatibility with PrintConnection.tsx
  // Printing now goes through the /api/print API route
  console.log('[DirectPrint] Ready (using HTTP API mode)');
}

export function DirectPrint(data: { printer_name: string; html_data: string; position?: number; numprint?: number }) {
  console.log('[DirectPrint] Sending print job:', data.printer_name);

  sendPrintJob(data.html_data, data.printer_name);
  return true;
}

async function sendPrintJob(html: string, printerName: string) {
  try {
    const response = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, printerName }),
    });

    const result = (await response.json()) as PrintResponse;

    if (result.status === 'ok') {
      console.log(`[DirectPrint] ✅ Printed on "${result.printer}"`);
    } else {
      console.error(`[DirectPrint] ❌ Error:`, result.message);
    }
  } catch (error: any) {
    console.error(`[DirectPrint] ❌ Failed:`, error.message);
  }
}
