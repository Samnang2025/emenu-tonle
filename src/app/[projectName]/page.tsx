"use client";
import { ImageSlider, NotFound, SearchBar } from "@/components/";
import { Cart, Footer, Loading, PageNotFound, NavBar, NightFoodCart, NightFoodBanner } from "@/components/core"; //Sok Thean Night Food

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Provider } from "react-redux";
import store from "@/lib/store";
import { MenuType } from "@/types/model";
import { useParams } from "next/navigation";

// Special category name for custom UI rendering
const NIGHT_FOOD_CATEGORY = "ម្ហូបយប់"; //Sok Thean

export default function Home() {

  const { projectName } = useParams();
  const project = Array.isArray(projectName) ? projectName[0] : projectName;
  const [loading, setLoading] = useState(true); // Loading state
  //Sok Thean Subcategory
  const [activeSection, setActiveSection] = useState<number>(0); // State to track active section
  const [activeSubSection, setActiveSubSection] = useState<string>(""); // State to track active sub-section
  const ref = useRef<(HTMLDivElement | null)[]>([]); // Ref to store section elements
  const subRef = useRef<Record<string, HTMLDivElement | null>>({}); // Ref to store sub-section elements
  //End ST Subcategory
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [data, setData] = useState<MenuType>([]); // State for fetched data
  const [filteredMenu, setFilteredMenu] = useState<MenuType>([]); // State for filtered menu items
  const isOrderPage = false; // Flag for order page
  const [images, setImages] = useState<any[]>([])
  const [isNotFound, setNotFound] = useState(false)
  const [cur, setCur] = useState(null);


  const imgUrl = `https://${projectName}.tsdsolution.net/assets/uploads/`;

  // Fetch data on component mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`https://${projectName}.tsdsolution.net/api/DriverController/setting`);
        const data = response.data
        console.log("Data fetched successfully", response.data);
        const correctedSlideShow = data.slide_Show.replace(/,\s*]$/, ']');
        const slideShowArray = JSON.parse(correctedSlideShow);
        setImages(slideShowArray);
        setCur(data.symbol);
        // Handle the fetched data here
      } catch (err) {
        console.log("Error fetching data", err);
      }
    };

    fetchImages();
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://${projectName}.tsdsolution.net/api/DriverController/GetAllProductWithCat?t=${Date.now()}`//Sok Thean Add t=${Date.now()} to prevent caching
        );

        const dataJson: MenuType = response.data;
        console.log(dataJson)
        setData(dataJson); // Set fetched data
        setFilteredMenu(dataJson); // Initialize filteredMenu with fetched data

        if (dataJson.length == 0) {
          setNotFound(true)
        }
        setLoading(false); // Data fetched, set loading to false
      } catch (error) {
        console.error("Error fetching data:", error);
        setNotFound(true)
        setLoading(false); // Error occurred, set loading to false
      }
    };

    fetchData();
  }, [projectName]); // Dependency array ensures fetch occurs when projectName changes

  // Filter items based on search query and update filteredMenu
  useEffect(() => {
    const filteredItems = data
      .map((category) => ({
        category: category.category,
        items: category.items.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.second_name && item.second_name.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      }))
      .filter((category) => category.items.length > 0);

    setFilteredMenu(filteredItems);
  }, [searchQuery, data]); // Update filteredMenu when searchQuery or data changes

  // Memoized handler for search input change
  const handleSearchInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      setSearchQuery(query);
    },
    []
  );

  // Scroll to a section based on index
  const handleScroll = (index: number) => {
    ref.current[index]?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(index);
    //Sok Thean Subcategory
    setActiveSubSection(""); // Reset sub-section when changing main section
  };

  // Scroll to a sub-section based on sub-category name
  const handleSubScroll = (subName: string) => {
    subRef.current[subName]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSubSection(subName);
    //End ST Subcategory
  };


  if (isNotFound) {
    return <>
      <PageNotFound error="404 Page Not Found" />
    </>
  }



  // Render loading indicator while fetching data
  if (loading) {
    return <Loading className="h-screen fixed w-full z-100 bg-white top-0 flex justify-center items-center left-0" />;
  }

  // Render the main content once data is loaded
  return (
    <Provider store={store}>

      <div className="w-full px-3 py-1 fixed flex flex-col gap-2 max-w-[575px] bg-white z-10 left-1/2 -translate-x-1/2">
        <div className="flex justify-between items-center">
          <NavBar />

        </div>
        <ul className="no-scrollbar flex flex-nowrap gap-2 overflow-x-scroll">
          {data.map((item, index) => (
            <li
              key={item.category}
              onClick={() => handleScroll(index)}
              className={`font-dangrek cursor-pointer text-nowrap max-[500px]:text-[14px] text-[17px] py-[5px] px-3 w-fit rounded-full border-orange-600 border-2 ${activeSection === index ? "text-orange-600" : "text-black"
                }`}
            >
              {item.category}
            </li>
          ))}
        </ul>
        {/*Sok Thean Subcategory*/}
        {/* SubCategory section */}
        {data[activeSection] && (
          <ul className="no-scrollbar flex flex-nowrap gap-2 overflow-x-scroll justify-center" style={{ "margin": "0px 60px" }}>
            {Array.from(new Set(data[activeSection].items.map(item => {
              const sub = item.subcategory;
              return sub && sub.trim() !== "" ? sub.trim() : "Other";
            })))
              .filter(subName => subName !== "Other")
              .sort((a, b) => a === "Other" ? 1 : b === "Other" ? -1 : 0)
              .map((subName) => (
                <li
                  key={subName}
                  onClick={() => handleSubScroll(`${data[activeSection].category}-${subName}`)}
                  className={`font-battambong cursor-pointer text-nowrap max-[500px]:text-[16px] text-[16px] py-[3px] px-3 w-fit rounded-full border-orange-600 border ${activeSubSection === `${data[activeSection].category}-${subName}` ? "bg-orange-600 text-white border-orange-600" : "text-gray-900"
                    }`}
                >
                  {subName}
                </li>
              ))}
          </ul>
        )}
        {/*End ST Subcategory*/}

        {/* Search bar component */}
        <SearchBar query={searchQuery} onSearch={handleSearchInput} />
      </div>

      <main className=" pb-[150px] fixed top-3 h-full w-full mt-52 max-[600px]:mt-48  max-w-[575px] overflow-scroll scroll-smooth scroll-pt-0 left-1/2 -translate-x-1/2">
        {/* Navigation and search bar */}


        {/* Main content section */}
        <section className="px-3 mt-5 text-center">
          {/* Display image slider when no search query */}
          {searchQuery.trim().length <= 0 && <ImageSlider images={images} />}

          <div className="mt-2">
            {/* Render filtered menu items */}
            {/*Sok Thean Night Food 3L*/}
            {filteredMenu.map((category, categoryIndex) => {
              const isNightFood = category.category === NIGHT_FOOD_CATEGORY;
              return (
                <div
                  key={categoryIndex}
                  ref={(el) => {
                    ref.current[categoryIndex] = el;
                  }}
                >
                  {/* Display category header if items exist */}
                  {category.items.length > 0 && (
                    <div className="flex gap-3 justify-center  items-center mb-5">
                      <div className="w-20 h-[2px] rounded-full bg-gray-300"></div>
                      <h1
                        id={`${category.category}`}
                        className={`font-bold font-dangrek text-[22px]  text-nowrap  max-[400px]:text-[20px]`}
                      >
                        {category.category}
                      </h1>
                      <div className="w-20 h-[2px] rounded-full bg-gray-300"></div>
                    </div>
                  )}
                  {/*Sok Thean Night Food*/}
                  {/* === Custom UI for ម្ហូបយប់ category === */}
                  {isNightFood ? (
                    <div className="night-food-section">
                      {/* Banner images - use first 2 item images */}
                      {category.items.length > 0 && (
                        <NightFoodBanner
                          images={category.items
                            .slice(0, 1)
                            .map((item) => item.imagePath)}
                          imgUrl={imgUrl}
                        />
                      )}

                      {/* Items listed without images, grouped by subcategory */}
                      <div className="grid grid-cols-2 gap-x-4">
                        {Array.from(new Set(category.items.map(item => {
                          const sub = item.subcategory;
                          return sub && sub.trim() !== "" ? sub.trim() : "Other";
                        })))
                          .sort((a, b) => a === "Other" ? 1 : b === "Other" ? -1 : 0)
                          .map((subName) => (
                            <div
                              key={subName}
                              ref={(el) => {
                                subRef.current[`${category.category}-${subName}`] = el;
                              }}
                              className="mb-4"
                            >
                              {subName !== "Other" && (
                                <h2 className="font-battambong text-[20px] font-semibold mb-2 px-1 text-gray-700">
                                  {subName}
                                </h2>
                              )}
                              <div className="flex flex-col">
                                {category.items
                                  .filter(item => {
                                    const sub = item.subcategory;
                                    const normalizedSub = sub && sub.trim() !== "" ? sub.trim() : "Other";
                                    return normalizedSub === subName;
                                  })
                                  .map((item) => (
                                    <NightFoodCart
                                      key={item.id}
                                      cartItem={item}
                                      isOrderPage={isOrderPage}
                                      cur={cur}
                                    />
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/*End ST Night Food*/}
                      {/*Sok Thean Subcategory*/}
                      {/* Display items grouped by sub-category */}
                      {Array.from(new Set(category.items.map(item => {
                        const sub = item.subcategory;
                        return sub && sub.trim() !== "" ? sub.trim() : "Other";
                      })))
                        .sort((a, b) => a === "Other" ? 1 : b === "Other" ? -1 : 0)
                        .map((subName) => (
                          <div
                            key={subName}
                            ref={(el) => {
                              subRef.current[`${category.category}-${subName}`] = el;
                            }}
                            className="mb-8"
                          >
                            {subName !== "Other" && (
                              <h2 className="font-battambong text-[20px] font-semibold mb-2 px-1 text-gray-700">
                                {subName}
                              </h2>
                            )}
                            <div className="flex flex-wrap flex-row justify-center gap-y-4">
                              {category.items
                                .filter(item => {
                                  const sub = item.subcategory;
                                  const normalizedSub = sub && sub.trim() !== "" ? sub.trim() : "Other";
                                  return normalizedSub === subName;
                                })
                                .map((item) => (
                                  <Cart
                                    key={item.id}
                                    cartItem={item}
                                    isOrderPage={isOrderPage}
                                    cur={cur}
                                  />
                                ))}
                            </div>
                          </div>
                        ))}
                      {/*End ST Subcategory*/}
                    </>
                  )}
                </div>
              );
            })}
            {/*End ST Night Food*/}
          </div>
        </section>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 p-3 max-w-[575px] items-center w-full cursor-pointer rounded-t-xl bg-white flex justify-between left-1/2 -translate-x-1/2">

        </div>

        {/* Footer section */}
        <footer className="mt-16 pb-[120px]"> {/* Sok Thean popup Component */}
          {/* Display not found message when no items */}
          {filteredMenu.length <= 0 && <NotFound />}
          <Footer />
        </footer>
      </main>
    </Provider>
  );
}