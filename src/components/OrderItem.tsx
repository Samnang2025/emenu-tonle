"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import Item from "./Item";
import Footer from "./core/Footer";
import { clearCart } from "@/lib/cart/cartSlice";
import HistoryOrder from "./HistoryOrder";
import numeral from "numeral";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "@/lib/i18n";
import { getTables, invalidateTablesCache, peekCachedTables, submitOrder } from "@/lib/api";

export default function OrderItem({
  cur,
  historyOrder,
  historyLoaded,
  isClickOrder,
  setClickOrder,
}: any) {
  const { t } = useTranslation();
  const { tableNumber } = useParams();
  const tableIdStr = Array.isArray(tableNumber) ? tableNumber[0] : tableNumber;
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const { items: basket, totalItems, totalPrice } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();

  const [tableName, setTableName] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const checkOpen = () => {
      if (dialog.open) {
        setHasOpened(true);
      }
    };

    const observer = new MutationObserver(checkOpen);
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    checkOpen();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (historyOrder?.data?.table_name) {
      setTableName(historyOrder.data.table_name);
      return;
    }
    if (!tableIdStr) return;

    // Show cached table name immediately if available
    const cachedTables = peekCachedTables();
    if (cachedTables?.data) {
      const match = cachedTables.data.find((tbl) => tbl.id === tableIdStr);
      if (match) {
        setTableName(match.name);
        return;
      }
    }

    // Only hit tables API if historyOrder has finished resolving without table_name
    if (!historyLoaded) return;

    let cancelled = false;
    getTables()
      .then((tables) => {
        if (cancelled) return;
        const currentTable = tables.find((tbl) => tbl.id === tableIdStr);
        if (currentTable) {
          setTableName(currentTable.name);
        }
      })
      .catch((e) => {
        console.error("Error fetching table name", e);
      });

    return () => {
      cancelled = true;
    };
  }, [historyOrder, historyLoaded, tableIdStr]);

  const handleOrder = async () => {
    setIsLoading(true);
    const loading = toast.info("កំពុងធ្វើការកុម្ម៉ង់...", {
      autoClose: 2000,
      position: "top-center",
      className: "font-battambang",
    });

    const product = basket.map(({ id, quantity, comment }) => ({
      id: id,
      quantity: quantity,
      comment: comment || null,
    }));

    try {
      const data = {
        data: {
          id: historyOrder?.data?.id ?? null,
          suspend_note: historyOrder?.data?.suspend_note ?? null,
          table_id: tableIdStr,
        },
        items: product,
      };

      await submitOrder(data);

      toast.dismiss(loading);
      toast.success("ការកុម្ម៉ង់ទទួលបានជោគជ័យ!", {
        autoClose: 2000,
        position: "top-center",
        className: "font-battambong",
      });

      invalidateTablesCache();
      dispatch(clearCart());
      setClickOrder(!isClickOrder);
    } catch (error) {
      console.error("Error sending order:", error);
      toast.dismiss(loading);
      toast.error("ការកុំម្ម៉ង់បរាជ័យ! សូមព្យាយាមម្តងទៀត!", {
        autoClose: 2000,
        position: "top-center",
        className: "font-battambong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasHistory = Boolean(historyOrder?.data);

  return (
    <>
      <dialog id="my_modal_3" ref={dialogRef} className="modal backdrop-blur-[2px]">
        <div className="modal-box p-0 bg-white text-gray-900">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-xl z-10">
              ✕
            </button>
          </form>
          {hasOpened && (
            <div className="flex flex-col h-[100vh] items-center relative ">
              <div>
                <h1 className="text-center font-dangrek p-2 text-xl">
                  {" "}
                  {t("orderSummary")}
                  <br />
                  <span className="text-orange-400">{tableName}</span>
                </h1>
              </div>
              <div className="w-full bg-transparent border-[1px] border-dashed border-black"></div>
              <div className="w-full px-4">
                {basket.length > 0 && (
                  <h1 className="text-center font-dangrek p-2 mb-5">{t("newOrder")}</h1>
                )}
                {basket.map((item, index) => (
                  <Item
                    key={item.cartItemId || `${item.id}-${index}`}
                    cartItem={item}
                    cur={cur}
                    index={index}
                  />
                ))}
              </div>
              {basket.length > 0 && (
                <button
                  disabled={isLoading}
                  onClick={handleOrder}
                  className={`bg-orange font-dangrek p-2 px-5 rounded-full text-white mt-2 ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {t("placeOrder")}
                </button>
              )}

              {/* history order section  */}
              {hasHistory && (
                <div className="w-full px-3 ">
                  <h1 className="font-dangrek text-center mt-5">{t("completedOrder")}</h1>
                  {(historyOrder.data?.note ||
                    (historyOrder.data?.suspend_note &&
                      historyOrder.data.suspend_note !== tableName)) && (
                    <p className="text-xs text-gray-500 italic text-center font-battambong mb-2">
                      {historyOrder.data.note || historyOrder.data.suspend_note}
                    </p>
                  )}
                  <div className="flex flex-col w-full space-y-3">
                    {historyOrder?.items?.map((item: any, index: any) => (
                      <HistoryOrder key={index} cartItem={item} cur={cur} index={index} />
                    ))}
                  </div>
                </div>
              )}
              {/* summary section  */}
              <div className="w-full flex flex-col space-y-2 p-3">
                <p className="text-lg flex flex-row justify-between">
                  <span className="font-dangrek  ">{t("totalItems")}:</span>
                  <span className="font-bold">
                    {hasHistory ? parseInt(historyOrder.data.totalItems) + totalItems : totalItems}
                  </span>
                </p>
                <p className="text-xl flex flex-row text-orange-500  justify-between">
                  <span className="font-dangrek  ">{t("totalAmount")}:</span>
                  <span className="font-bold">
                    {cur || "$"}
                    {hasHistory
                      ? numeral(parseFloat(historyOrder.data.total_price) + totalPrice).format(
                          "0.[00]"
                        )
                      : numeral(totalPrice).format("0.[00]")}
                  </span>
                </p>
              </div>
              <div className="mt-5">
                <Footer></Footer>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
