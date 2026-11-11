"use client";
import React, { memo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Menu } from "@/types/model";
import { addToCart } from "@/lib/cart/cartSlice";
import { RootState } from "@/lib/store";
import numeral from "numeral";
import { useTranslation } from "@/lib/i18n";
import { IMG_BASE_URL } from "@/lib/api";
import FoodItemModal from "./FoodItemModal"; // Sok Thean popup Cofmponent

type PropType = {
  cartItem: Menu;
  isOrderPage?: boolean;
  cur?: any;
  priority?: boolean;
};

function Cart({ cartItem, isOrderPage, cur, priority = false }: PropType) {
  //AKK Translation
  const { locale } = useTranslation();
  const { id, name, second_name, imagePath, price, promo_price, code, type, subcategory, brand } =
    cartItem; //Sok Thean Subcategory

  const displayName = locale === "en" && second_name ? second_name : name;
  //End AKK Translation
  const real_price = promo_price ? numeral(promo_price).format("0.[00]") : "";
  const actual_price = numeral(price).format("0.[00]");

  const dispatch = useDispatch();
  const currentQuantity = useSelector((state: RootState) => {
    let sum = 0;
    const items = state.cart.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === id) sum += items[i].quantity;
    }
    return sum;
  });

  const [isModalOpen, setIsModalOpen] = useState(false); // Sok Thean popup Component

  // Handle adding item to cart
  const handleOrder = (comment?: string) => {
    //Sok Thean Add comment
    const cartData = {
      id,
      name,
      second_name, //AKK Translation
      imagePath,
      price,
      quantity: currentQuantity + 1,
      promo_price,
      code,
      type,
      //Sok Thean Subcategory
      subcategory,
      brand,
      comment: comment || null, //Sok Thean Add comment
    };

    dispatch(addToCart(cartData)); // Dispatch action to add item to Redux store
  };

  return (
    <>
      <div className="card w-[49%]">
        <div className="w-full rounded-xl overflow-hidden relative">
          <button
            onClick={() => isOrderPage && setIsModalOpen(true)}
            className="w-full h-full"
          >
            {/* Sok Thean popup Component */}
            <img
              className="object-cover w-full h-[200px]"
              src={`${IMG_BASE_URL}${cartItem.imagePath}`}
              alt={cartItem.name}
              width={250}
              height={250}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
            />
          </button>
          {/* Button to add item to basket (visible only if isOrderPage is true) */}
          {isOrderPage && (
            <button
              // Sok Thean popup Component
              className={`absolute bottom-2 right-2 flex justify-center items-center w-[40px] h-[40px] rounded-full z-20 border-2 border-white shadow-lg transition-all active:scale-90 ${
                currentQuantity > 0 ? "bg-orange text-black" : "bg-white text-orange"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              // End popup Component
            >
              {currentQuantity > 0 ? currentQuantity : "+"}
            </button>
          )}
        </div>
        <div
          className="card-body px-1 py-1 flex justify-between items-start gap-y-0"
          onClick={() => isOrderPage && setIsModalOpen(true)}
        >
          {/* Sok Thean popup Component */}
          <h2 className="card-title text-[16px] font-battambong font-extralight leading-tight text-black">
            {displayName}
          </h2>
          <div className="flex flex-col items-end">
            <span className="text-[15px] text-orange-600 font-bold whitespace-nowrap">
              {cur || "$"}
              {promo_price ? real_price : actual_price}
            </span>
            {promo_price && (
              <span className="text-[13px] text-gray-500 line-through">
                {cur || "$"}
                {actual_price}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Sok Thean popup Component */}
      {isModalOpen && (
        <FoodItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cartItem={cartItem}
          cur={cur}
          onAdd={(comment) => handleOrder(comment)} //Sok Thean Add comment
          imgUrl={IMG_BASE_URL}
        />
      )}
      {/* End popup Component */}
    </>
  );
}

export default memo(Cart);
