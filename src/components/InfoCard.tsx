"use client";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LOGO_BASE_URL, OrderConfig, getOrderConfig } from "@/lib/api";

type propTypes = {
  children: ReactNode;
  title: string;
  logo: string;
};

export default function InforCard({ children, title, logo }: propTypes) {
  const [info, setInfo] = useState<OrderConfig | null>(null);
  const [hasOpened, setHasOpened] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

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
    if (!hasOpened) return;
    let cancelled = false;
    getOrderConfig()
      .then((data) => {
        if (!cancelled && data) setInfo(data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [hasOpened]);

  return (
    <>
      {children}
      <dialog id="my_modal_2" ref={dialogRef} className="modal backdrop-blur-[2px]">
        <div className="modal-box p-0 bg-white">
          <form method="dialog">
            <button className="btn text-white btn-sm btn-circle btn-ghost absolute right-2 top-2 text-xl z-10">
              ✕
            </button>
          </form>
          {hasOpened && (
            <div className="flex flex-col items-center">
              <div className="h-[200px] w-full mb-20 relative">
                <img
                  src="/images/well.jpg"
                  className="object-cover w-full h-full"
                  width={1000}
                  height={1000}
                  decoding="async"
                  alt=""
                />
                <div className="w-28 h-28 rounded-full flex justify-center items-center absolute border-2 border-gray-400 bottom-[-60px] bg-white left-1/2 transform -translate-x-1/2">
                  {logo && (
                    <img
                      className="object-cover"
                      src={`${LOGO_BASE_URL}${logo}`}
                      alt=""
                      width={1000}
                      height={1000}
                      decoding="async"
                    />
                  )}
                </div>
              </div>
              <p className="font-akbalthom-moul-4 text-center text-2xl text-gray-800">{title}</p>
              <p className="px-5 font-battambong font-light mt-5 text-sm text-center text-gray-600">
                ទំនាក់ទំនងយើងខ្ញុំតាមរយៈបណ្តាញសង្គម <br />
                Contact us through our official social media channels
              </p>
              <div className="flex flex-row space-x-6 mt-5">
                {/* Google Map */}
                <Link
                  href={info?.googlemap || "https://maps.app.goo.gl/HwjG8EuDrrMeAmrY6?g_st=it"}
                >
                  <img
                    className="w-10 h-10 hover:scale-110 transition-transform"
                    src="/icons/map.svg"
                    alt="Google Map"
                    width={40}
                    height={40}
                  />
                </Link>
                {/* Telegram */}
                <Link href={info?.telegram || "https://t.me/@tonle168"}>
                  <img
                    className="w-10 h-10 hover:scale-110 transition-transform"
                    src="/icons/telegram.svg"
                    alt="Telegram"
                    width={40}
                    height={40}
                  />
                </Link>
                {/* Tiktok */}
                <Link href={info?.tiktok || "https://www.tiktok.com/@tonl.noodle.and.c?_r=1"}>
                  <img
                    className="w-10 h-10 hover:scale-110 transition-transform"
                    src="/icons/tiktok.svg"
                    alt="Tiktok"
                    width={40}
                    height={40}
                  />
                </Link>
              </div>

              <div className="flex font-battambong space-x-2 mt-5 p-4 w-full justify-center bg-orange-100">
                <img className="w-5" src={"/icons/call.svg"} alt="" width={100} height={100} />
                <h1 className="text-orange-500">
                  លេខទំនាក់ទំនង / Hotline:{" "}
                  <Link href={`tel:+855${info?.phone_num}`}>{info?.phone_num}</Link>
                </h1>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
