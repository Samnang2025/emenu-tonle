DirectPrint_8085 Print Server
=============================

This is a Node.js print server that receives HTML + printer name, renders it to a PDF via Puppeteer, and prints it via `pdf-to-printer` (which uses native Windows printing APIs). Run this directly on the Windows POS machine connected to the printers.

Quick Start
-----------

1. **Install Node.js**: Ensure Node.js is installed on the POS machine (https://nodejs.org).
2. **Launch the Server**:
   - Double-click **`run-printer.bat`** in this folder to start the server. This script will automatically check and install all required dependencies (Express, Puppeteer, pdf-to-printer) if they are missing.
   - By default, the server runs on port **`8085`** (accessible at `http://localhost:8085` or `http://192.168.51.220:8085`).

Auto-Run on Startup
-------------------

To make the print server start automatically whenever the Windows POS machine boots up:

1. Press **`Win + R`** on the keyboard to open the "Run" dialog box.
2. Type **`shell:startup`** and press **Enter**. This opens the Windows **Startup** folder.
3. Right-click on **`run-printer-silent.vbs`** in this directory, select **Show more options** -> **Create shortcut** (or copy it and select **Paste shortcut**).
4. Drag and drop or paste that shortcut into the Startup folder.
5. The next time the computer boots, the print server will automatically run silently in the background (no command prompt window visible).

Connecting From Phones or Tablets (Mixed Content Notice)
--------------------------------------------------------

When you open the E-Menu web application from other devices (like a phone or tablet), they must connect to this print server. 

### Critical Security Rule: Mixed Content
If your E-Menu application is hosted on a public domain with HTTPS (e.g. `https://my-emenu.vercel.app`), the phone's browser **will block** print requests to the local HTTP print server (`http://192.168.51.220:8085`) due to security restrictions (Mixed Content: HTTPS blocking HTTP requests).

To solve this, use one of the following methods:

#### Method 1: Local HTTP Network (Recommended)
Run the Next.js application locally on the POS machine or on your local network, and open it on the phone using HTTP:
- Example: Open `http://192.168.51.220:3000` on the phone/tablet.
- Since the client is loaded via HTTP, the browser allows sending print requests to the HTTP server at `http://192.168.51.220:8085`.

#### Method 2: Use an HTTPS Tunnel (e.g., ngrok)
If you must load the E-Menu via an HTTPS web URL:
1. Download **ngrok** on the POS machine.
2. Start an HTTPS tunnel pointing to the print server:
   ```bash
   ngrok http 8085
   ```
3. Copy the secure forwarding URL provided by ngrok (e.g., `https://abcdef.ngrok-free.app`).
4. On the phone or tablet, load the E-Menu appending the print server URL in the query string:
   `https://my-emenu.vercel.app/[projectName]/[tableNumber]?print_server=https://abcdef.ngrok-free.app`
5. The application will save this HTTPS print server endpoint in local storage and successfully route all print jobs through the secure tunnel.
