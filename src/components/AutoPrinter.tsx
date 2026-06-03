"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { DirectPrint } from "@/helper/directPrint";

interface AutoPrinterProps {
  projectName: string;
  logoUrl: string;
}

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warn";
}

export default function AutoPrinter({ projectName, logoUrl }: AutoPrinterProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [serverUrl, setServerUrl] = useState<string>("http://192.168.51.220:8085");
  const [status, setStatus] = useState<"idle" | "polling" | "offline" | "error">("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initialize configuration from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEnabled = window.localStorage.getItem("auto_print_enabled") === "true";
      setIsEnabled(storedEnabled);

      const storedUrl = window.localStorage.getItem("print_server_url") || "http://192.168.51.220:8085";
      setServerUrl(storedUrl);
      window.localStorage.setItem("print_server_url", storedUrl);

      addLog("AutoPrinter initialized.", "info");
    }
  }, []);

  // 2. Scroll log window to the bottom when new logs are added
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Log helper
  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    const time = new Date().toLocaleTimeString();
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time,
      message,
      type,
    };
    setLogs((prev) => [...prev.slice(-49), entry]); // Keep last 50 logs
  };

  // 3. Test connection to the local print server
  const testConnection = useCallback(async (targetUrl = serverUrl): Promise<boolean> => {
    try {
      // Send OPTIONS request to the CORS-enabled print server to check availability
      const res = await fetch(`${targetUrl.replace(/\/$/, "")}/api/print`, {
        method: "OPTIONS",
      });
      if (res.ok || res.status === 200) {
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }, [serverUrl]);

  const handleTestConnection = async () => {
    addLog(`Testing print server connection at ${serverUrl}...`, "info");
    const connected = await testConnection();
    if (connected) {
      addLog("✅ Connection successful! Print server is online.", "success");
      if (isEnabled) setStatus("polling");
      else setStatus("idle");
    } else {
      addLog("❌ Connection failed. Check if server is running on the POS machine.", "error");
      setStatus("offline");
    }
  };

  // 4. Toggle auto-print mode
  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextState = e.target.checked;
    setIsEnabled(nextState);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auto_print_enabled", String(nextState));
    }

    if (nextState) {
      addLog("Auto-Print Mode enabled. Verifying print server...", "info");
      const connected = await testConnection();
      if (connected) {
        setStatus("polling");
        addLog("✅ Print server is online. Starting order polling loop.", "success");
      } else {
        setStatus("offline");
        addLog("⚠️ Print server is offline. Automatic printing will retry when server is online.", "warn");
      }
    } else {
      setStatus("idle");
      addLog("Auto-Print Mode disabled.", "info");
    }
  };

  // 5. Update print server URL
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setServerUrl(val);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("print_server_url", val);
    }
  };

  // 6. Generate Receipt HTML (mirroring order template in OrderItem)
  const generateReceiptHtml = useCallback((items: any[], title: string, tableName: string) => {
    return `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { margin-right: 15mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              width: 100%;
              font-family: 'Khmer OS Battambang', sans-serif;
              font-size: 12px;
              font-weight: bold;
              color: #000;
            }
            .receipt {
              width: 100%;
              padding: 5px;
            }
            .dashed-line {
              border: none;
              border-top: 1px dashed #000;
              margin: 8px 0;
            }
            .brand-section {
              text-align: center;
              padding: 10px 0 5px 0;
            }
            .brand-logo {
              max-width: 120px;
              max-height: 80px;
              margin: 0 auto;
            }
            .table-info {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              padding: 5px 0;
            }
            .kitchen-title {
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              padding: 8px 0;
            }
            .column-header {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-weight: bold;
              font-size: 12px;
            }
            .column-header-name {
              text-align: left;
            }
            .column-header-qty {
              text-align: right;
            }
            .order-item { 
              display: flex; 
              justify-content: space-between; 
              padding: 3px 0;
              font-size: 13px;
              width: 100%;
            }
            .item-name {
              flex: 1;
              text-align: left;
            }
            .item-qty { 
              width: 40px;
              text-align: right;
              font-weight: bold;
            }
            .comment { 
              font-size: 10px; 
              font-style: italic; 
              padding-left: 10px;
              padding-bottom: 2px;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              padding: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="brand-section">
              <img src="${logoUrl}" class="brand-logo" alt="Logo" />
            </div>

            <div class="table-info">Table: ${tableName}</div>

            <hr class="dashed-line" />

            <div class="kitchen-title">${title}</div>

            <hr class="dashed-line" />

            <div class="column-header">
              <div class="column-header-name">មុខទំនិញ<br/>Order List</div>
              <div class="column-header-qty">ចំនួន<br/>QTY</div>
            </div>

            <hr class="dashed-line" />

            ${items.map(item => `
              <div class="order-item">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">${item.quantity}</span>
              </div>
              ${item.comment ? `<div class="comment">- ${item.comment}</div>` : ''}
            `).join('')}

            <hr class="dashed-line" />

            <div class="footer">
              <div>${new Date().toLocaleString()}</div>
              <div>*** End of Order ***</div>
            </div>
          </div>
        </body>
      </html>
    `;
  }, [logoUrl]);

  // 7. Polling logic
  useEffect(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (!isEnabled || !projectName) {
      return;
    }

    const pollOrders = async () => {
      setLastChecked(new Date().toLocaleTimeString());

      // Check connection to local print server first
      const connected = await testConnection();
      if (!connected) {
        setStatus("offline");
        return;
      }
      setStatus("polling");

      try {
        // Fetch all tables
        const tablesRes = await axios.get(
          `https://${projectName}.tsdsolution.net/api/DriverController/tables?t=${Date.now()}`
        );

        if (!Array.isArray(tablesRes.data)) return;

        // Iterate over tables
        for (const table of tablesRes.data) {
          const isTableActive = table.active === "1";
          const storageKey = `printed_items_table_${table.id}`;

          if (isTableActive) {
            // Fetch suspended items for the table
            const formData = new FormData();
            formData.append("table_num", `${table.id}`);

            const response = await axios.post(
              `https://${projectName}.tsdsolution.net/api/DriverController/suspends`,
              formData
            );

            const historyOrder = response.data;
            if (!historyOrder || !Array.isArray(historyOrder.items) || historyOrder.items.length === 0) {
              continue;
            }

            // Retrieve list of already printed item IDs for this table
            let printedIds: string[] = [];
            try {
              const cached = localStorage.getItem(storageKey);
              if (cached) printedIds = JSON.parse(cached);
            } catch (e) {
              printedIds = [];
            }

            // Identify items that have NOT been printed yet
            const unprintedItems = historyOrder.items.filter(
              (item: any) => !printedIds.includes(String(item.id))
            );

            if (unprintedItems.length > 0) {
              addLog(`New order items detected on Table: ${table.name}`, "info");

              // Group into drink and kitchen/food
              const drinkItems = unprintedItems.filter((item: any) => {
                const brand = item.brand?.toLowerCase();
                return brand === 'drink' || brand === 'standard';
              });
              const foodItems = unprintedItems.filter((item: any) => {
                const brand = item.brand?.toLowerCase();
                return brand !== 'drink' && brand !== 'standard';
              });

              let drinkSuccess = true;
              let foodSuccess = true;

              // Print Drink Items to "Drink" printer
              if (drinkItems.length > 0) {
                addLog(`Printing ${drinkItems.length} drinks to "Drink" printer for Table ${table.name}...`, "info");
                const htmlContent = generateReceiptHtml(drinkItems, "Drink Order", table.name);
                const printOk = await DirectPrint({
                  printer_name: "Drink",
                  html_data: htmlContent,
                });
                if (printOk) {
                  addLog(`✅ Drinks printed successfully for Table ${table.name}.`, "success");
                } else {
                  drinkSuccess = false;
                  addLog(`❌ Failed to print drinks for Table ${table.name}.`, "error");
                }
              }

              // Print Food/Kitchen Items to "Kitchen" printer
              if (foodItems.length > 0) {
                addLog(`Printing ${foodItems.length} foods to "Kitchen" printer for Table ${table.name}...`, "info");
                const htmlContent = generateReceiptHtml(foodItems, "Food Order", table.name);
                const printOk = await DirectPrint({
                  printer_name: "Kitchen",
                  html_data: htmlContent,
                });
                if (printOk) {
                  addLog(`✅ Food order printed successfully for Table ${table.name}.`, "success");
                } else {
                  foodSuccess = false;
                  addLog(`❌ Failed to print food order for Table ${table.name}.`, "error");
                }
              }

              // Update cache if prints were successful
              const processedIds = [...printedIds];
              if (drinkSuccess && drinkItems.length > 0) {
                drinkItems.forEach((item: any) => processedIds.push(String(item.id)));
              }
              if (foodSuccess && foodItems.length > 0) {
                foodItems.forEach((item: any) => processedIds.push(String(item.id)));
              }

              if (processedIds.length > printedIds.length) {
                localStorage.setItem(storageKey, JSON.stringify(processedIds));
              }
            }
          } else {
            // Table is not active, clear cache to free space
            if (localStorage.getItem(storageKey)) {
              localStorage.removeItem(storageKey);
              addLog(`Cleared printed cache for Table ${table.name} (table checked out/free).`, "info");
            }
          }
        }
      } catch (err: any) {
        console.error("AutoPrinter loop error:", err);
        addLog(`Error during polling: ${err.message || String(err)}`, "error");
        setStatus("error");
      }
    };

    // Run immediately, then run every 7 seconds
    pollOrders();
    pollingIntervalRef.current = setInterval(pollOrders, 7000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isEnabled, projectName, serverUrl, generateReceiptHtml, testConnection]);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-sm font-battambong text-gray-800 flex flex-col gap-3">
      {/* Header section */}
      <div className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex flex-col">
          <h2 className="font-dangrek text-lg tracking-wide flex items-center gap-2">
            🖨️ POS Auto-Printing Terminal
          </h2>
          <p className="text-xs text-gray-500">
            Automatically prints suspended orders to local network printers
          </p>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          <span className="ml-2 text-sm font-bold text-gray-700">
            {isEnabled ? "RUNNING" : "STOPPED"}
          </span>
        </label>
      </div>

      {/* Network Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600">
            POS Print Server URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={handleUrlChange}
            placeholder="http://localhost:8085"
            disabled={isEnabled}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
        <button
          onClick={handleTestConnection}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2 px-4 rounded-xl border border-gray-200 transition-colors"
        >
          Test Connection
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-500">Status:</span>
          {status === "polling" && (
            <span className="flex items-center gap-1 font-bold text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              Active Polling
            </span>
          )}
          {status === "idle" && (
            <span className="font-bold text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Idle
            </span>
          )}
          {status === "offline" && (
            <span className="font-bold text-red-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Print Server Offline
            </span>
          )}
          {status === "error" && (
            <span className="font-bold text-rose-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Polling Error
            </span>
          )}
        </div>

        {lastChecked && (
          <div className="text-gray-500">
            Last checked: <span className="font-mono font-bold text-gray-600">{lastChecked}</span>
          </div>
        )}
      </div>

      {/* Logger Window */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-gray-600">Print Server Logs</span>
        <div className="bg-gray-950 text-gray-300 font-mono text-xs rounded-xl p-3 h-32 overflow-y-auto flex flex-col gap-1 border border-gray-900 shadow-inner">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-gray-500 shrink-0 select-none">[{log.time}]</span>
              <span
                className={
                  log.type === "success"
                    ? "text-emerald-400"
                    : log.type === "error"
                    ? "text-rose-400"
                    : log.type === "warn"
                    ? "text-amber-400"
                    : "text-gray-300"
                }
              >
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
