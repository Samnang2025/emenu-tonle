"use client";
import React from "react";

type PropType = {
  images: string[];
  imgUrl: string;
};

const NightFoodBanner: React.FC<PropType> = ({ images, imgUrl }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="night-food-banner flex flex-col gap-3 mb-4">
      {images.map((image, index) => (
        <div key={index} className="w-full rounded-xl overflow-hidden" style={{ height: "250px" }}>
          <img
            className="object-cover w-full h-full"
            src={`${imgUrl}${image}`}
            alt={`Night food banner ${index + 1}`}
          />
        </div>
      ))}
    </div>
  );
};

export default NightFoodBanner;
