import React, { useEffect, useState } from "react";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import Item from "./Item";
import { Footer } from "./core";
import { clearCart } from "@/lib/cart/cartSlice";
import HistoryOrder from "./HistoryOrder";
import numeral from "numeral";
import { useParams } from "next/navigation";
import axios from "axios";
import { orderHistoryType } from "@/types/model";
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from "@/lib/i18n";
import 'react-toastify/dist/ReactToastify.css';
import { DirectPrint } from "@/helper/directPrint";


export default function OrderItem({ cur, historyOrder, setHistoryOrder, isClickOrder, setClickOrder }: any) {
  const { t } = useTranslation();
  const { projectName, tableNumber } = useParams()
  const [isLoading, setIsLoading] = useState(false);

  const { items: basket, totalItems, totalPrice } = useSelector((state: RootState) => state.cart);

  const dispatch = useDispatch()


  // my code akk
  const handlePrint = (printItems: any[], printerName: string) => {
    if (printItems.length === 0) return;

    const title = printerName.toLowerCase() === 'drink' ? 'Drink Order' : 'Kitchen Order';

    const content = `
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
            .text-center { 
              text-align: center; 
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
            <!-- Brand Logo -->
            <div class="brand-section">
              <img src="${window.location.origin}/images/tonle.jpg" class="brand-logo" alt="Logo" />
            </div>

            <!-- Table Info -->
            <div class="table-info">Table: ${historyOrder?.data?.table_name || historyOrder?.data?.table_num || historyOrder?.data?.suspend_note || tableNumber}</div>

            <hr class="dashed-line" />

            <!-- Kitchen Order Title -->
            <div class="kitchen-title">${title}</div>

            <hr class="dashed-line" />

            <!-- Column Headers -->
            <div class="column-header">
              <div class="column-header-name">មុខទំនិញ<br/>Order List</div>
              <div class="column-header-qty">ចំនួន<br/>QTY</div>
            </div>

            <hr class="dashed-line" />

            <!-- Order Items -->
            ${printItems.map(item => `
              <div class="order-item">
                <span class="item-name">${item.name}</span>
                <span class="item-qty">${item.quantity}</span>
              </div>
              ${item.comment ? `<div class="comment">- ${item.comment}</div>` : ''}
            `).join('')}

            <hr class="dashed-line" />

            <!-- Footer -->
            <div class="footer">
              <div>${new Date().toLocaleString()}</div>
              <div>*** End of Order ***</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const success = DirectPrint({
      printer_name: printerName,
      html_data: content
    });

    if (!success) {
      // Fallback to browser print if DirectPrint server is not running
      const printWindow = window.open('', '_blank', 'height=600,width=400');
      if (!printWindow) return;
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };
  // my code old 

  const handleOrder = async () => {
    setIsLoading(true);
    const loading = toast.info("កំពុងធ្វើការកុម្ម៉ង់...", {
      autoClose: 2000,
      position: "top-center",
      className: "font-battambong"

    });

    const product = basket.map(({ id, quantity, comment }) => ({
      id: id,
      quantity: quantity,
      comment: comment || null,
    }));


    try {

      const data = {
        data: {
          id: historyOrder ? historyOrder?.data.id : null,
          suspend_note: historyOrder ? historyOrder?.data.suspend_note : null,
          table_id: tableNumber,
        },
        items: product,
      };
      const jsonData = JSON.stringify(data)
      const response = await axios.post(
        `https://${projectName}.tsdsolution.net/api/DriverController/suspend`,
        jsonData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      toast.dismiss(loading)
      toast.success("ការកុំម្ម៉ង់ទទួលបានជោគជ័យ!", {
        autoClose: 2000,
        position: "top-center",
        className: "font-battambong"
      });

      const drinkItems = basket.filter((item: any) => {
        const brand = item.brand?.toLowerCase();
        return brand === 'drink' || brand === 'standard';
      });
      const kitchenItems = basket.filter((item: any) => {
        const brand = item.brand?.toLowerCase();
        return brand !== 'drink' && brand !== 'standard';
      });
      
      if (kitchenItems.length > 0) handlePrint(kitchenItems, "food");
      if (drinkItems.length > 0) handlePrint(drinkItems, "drink");
      // end akk
      dispatch(clearCart());
      setClickOrder(!isClickOrder);

    } catch (error) {
      console.error('Error sending order:', error);
      toast.dismiss(loading)
      toast.error("ការកុំម្ម៉ង់បរាជ័យ! សូមព្យាយាមម្តងទៀត!", {
        autoClose: 2000,
        position: "top-center",
        className: "font-battambong"
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {/* You can open the modal using document.getElementById('ID').showModal() method */}

      <dialog id={"my_modal_3"} className={`modal backdrop-blur-[2px]`}>
        <div className="modal-box p-0 bg-white text-gray-900">
          <ToastContainer />
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn  btn-sm btn-circle btn-ghost absolute right-2 top-2 text-xl  z-10">
              ✕
            </button>
          </form>
          <div className="flex flex-col h-[100vh]  items-center relative ">
            <div>
              <h1 className="text-center font-dangrek p-2 text-xl"> {t("orderSummary")}<br />
                <span className="text-orange-400">{tableNumber}</span></h1>
            </div>
            <div className="w-full bg-transparent border-[1px] border-dashed border-black"></div>
            <div className="w-full px-4">

              {/* new order  */}
              {basket.length == 0 ? (<></>) : <h1 className="text-center font-dangrek p-2 mb-5">{t("newOrder")}</h1>}
              {/* item cart  */}
              {
                basket.map((item, index) => (
                  <>
                    <Item key={index} cartItem={item} cur={cur} />

                  </>
                ))
              }
            </div>
            {basket.length == 0 ? (<></>) : (<button onClick={handleOrder} className="bg-orange font-dangrek p-2 px-5 rounded-full text-white mt-2">{t("placeOrder")}</button>)}

            {/* history order section  */}
            {historyOrder ? (
              <div className="w-full px-3 ">
                <h1 className="font-dangrek text-center mt-5">{t("completedOrder")}</h1>
                <div className="flex flex-col w-full space-y-3">
                  {
                    historyOrder?.items?.map((item: any, index: any) => (
                      <>
                        <HistoryOrder key={index} cartItem={item} cur={cur} />
                      </>
                    ))
                  }
                </div>
              </div>
            ) : (<></>)
            }
            {/* summary section  */}
            <div className="w-full flex flex-col space-y-2 p-3">
              <p className="text-lg flex flex-row justify-between">
                <span className="font-dangrek  " >{t("totalItems")}:</span>
                <span className="font-bold">{historyOrder ? parseInt(historyOrder.data.totalItems) + totalItems : totalItems}</span>
              </p>
              <p className="text-xl flex flex-row text-orange-500  justify-between">
                <span className="font-dangrek  " >{t("totalAmount")}:</span>
                <span className="font-bold">{cur || "$"}{historyOrder ? numeral(parseFloat(historyOrder.data.total_price) + totalPrice).format('0.[00]') : numeral(totalPrice).format('0.[00]')}</span>
              </p>
            </div>
            <div className="mt-5">
              <Footer></Footer>
            </div>
          </div>

        </div>
      </dialog>
    </>
  );
}


