"use client";

import ImageSlider from "@/components/ImageSlider";
import Model from "@/components/Model";
import NotFound from "@/components/NotFound";
import SearchBar from "@/components/SearchBar";
import Cart from "@/components/core/Cart";
import BasketBar from "@/components/core/BasketBar";
import Footer from "@/components/core/Footer";
import Loading from "@/components/core/loading";
import PageNotFound from "@/components/core/PageNotFound";
import NavBar from "@/components/core/NavBar";
import NightFoodCart from "@/components/core/NightFoodCart";
import NightFoodBanner from "@/components/core/NightFoodBanner";
import OrderItem from "@/components/OrderItem";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useDeferredValue,
  startTransition,
} from "react";
import { Provider } from "react-redux";
import store from "@/lib/store";
import { Menu, MenuType } from "@/types/model";
import { useParams } from "next/navigation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  IMG_BASE_URL,
  getMenuData,
  getSetting,
  getTableOrders,
  parseSlideShow,
  peekCachedMenuData,
  peekCachedSetting,
} from "@/lib/api";

// Special category names for custom UI rendering
const NIGHT_FOOD_CATEGORY = "ម្ហូបយប់"; //Sok Thean
const RIVER_SNACK_CATEGORY = "គ្រឿងក្លែមទន្លេ"; //Sok Thean
const MENU_SOFT_FRESH_MS = 15_000;
const INITIAL_CATEGORY_COUNT = 3;

interface SubGroup {
  subName: string;
  items: Menu[];
}

interface GroupedCategory {
  category: string;
  isListStyle: boolean;
  bannerImages: string[];
  subGroups: SubGroup[];
  totalItems: number;
}

function groupCategoryItems(items: Menu[]): SubGroup[] {
  const map = new Map<string, Menu[]>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sub = item.subcategory;
    const subName = sub && sub.trim() !== "" ? sub.trim() : "ផ្សេងៗ";
    let list = map.get(subName);
    if (!list) {
      list = [];
      map.set(subName, list);
    }
    list.push(item);
  }
  const keys = Array.from(map.keys()).sort((a, b) =>
    a === "ផ្សេងៗ" ? 1 : b === "ផ្សេងៗ" ? -1 : 0
  );
  return keys.map((subName) => ({
    subName,
    items: map.get(subName)!,
  }));
}

export default function MenuPageClient() {
  const { projectName, tableNumber } = useParams();
  const tableIdStr = Array.isArray(tableNumber) ? tableNumber[0] : tableNumber;
  const [loading, setLoading] = useState(true);
  const [historyOrder, setHistoryOrder] = useState<any>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isClickOrder, setClickOrder] = useState(false);

  // Fetch history order details (suspend order) on component mount and when an order is placed
  useEffect(() => {
    if (!projectName || !tableIdStr) return;
    let cancelled = false;
    setHistoryLoaded(false);

    getTableOrders(tableIdStr)
      .then((res) => {
        if (!cancelled) {
          setHistoryOrder(res);
          setHistoryLoaded(true);
        }
      })
      .catch((error) => {
        console.error("Error fetching history order:", error);
        if (!cancelled) {
          setHistoryLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectName, tableIdStr, isClickOrder]);

  //Sok Thean Subcategory
  const [activeSection, setActiveSection] = useState<number>(0);
  const [activeSubSection, setActiveSubSection] = useState<string>("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const subRef = useRef<Record<string, HTMLDivElement | null>>({});
  //End ST Subcategory
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [data, setData] = useState<MenuType>([]);
  const isOrderPage = true;
  const [images, setImages] = useState<any[]>([]);
  const [isNotFound, setNotFound] = useState(false);
  const [cur, setCur] = useState<any>(null);
  const [renderAllCategories, setRenderAllCategories] = useState(false);
  const pendingScrollCategoryRef = useRef<string | null>(null);

  // Fetch setting (deduplicated with NavBar) & menu data (instant SWR cache + fresh refresh)
  useEffect(() => {
    let cancelled = false;

    const cachedSetting = peekCachedSetting();
    if (cachedSetting?.data) {
      setImages(parseSlideShow(cachedSetting.data.slide_Show));
      setCur(cachedSetting.data.symbol ?? null);
    }

    getSetting()
      .then((settingData) => {
        if (cancelled || !settingData) return;
        setImages(parseSlideShow(settingData.slide_Show));
        setCur(settingData.symbol ?? null);
      })
      .catch((err) => {
        console.log("Error fetching data", err);
      });

    const cachedMenu = peekCachedMenuData();
    const hasCachedMenu = Boolean(cachedMenu?.data && cachedMenu.data.length > 0);
    if (hasCachedMenu && cachedMenu) {
      setData(cachedMenu.data);
      setLoading(false);
    }

    const isFreshPrefetch =
      hasCachedMenu && cachedMenu && Date.now() - cachedMenu.ts < MENU_SOFT_FRESH_MS;

    if (!isFreshPrefetch) {
      getMenuData({ forceRefresh: true })
        .then((dataJson) => {
          if (cancelled) return;
          if (!Array.isArray(dataJson) || dataJson.length === 0) {
            if (!hasCachedMenu) {
              setNotFound(true);
            }
          } else {
            setData((prev) => {
              if (prev.length === dataJson.length && JSON.stringify(prev) === JSON.stringify(dataJson)) {
                return prev;
              }
              return dataJson;
            });
          }
          setLoading(false);
        })
        .catch((error) => {
          if (cancelled) return;
          console.error("Error fetching data:", error);
          if (!hasCachedMenu) {
            setNotFound(true);
          }
          setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [projectName]);

  // Filter & pre-group menu items based on deferred search query
  const groupedMenu = useMemo<GroupedCategory[]>(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const source = normalizedQuery
      ? data
          .map((category) => ({
            category: category.category,
            items: category.items.filter((item) =>
              item.name.toLowerCase().includes(normalizedQuery)
            ),
          }))
          .filter((category) => category.items.length > 0)
      : data;

    return source.map((category) => {
      const isListStyle =
        category.category === NIGHT_FOOD_CATEGORY ||
        category.category === RIVER_SNACK_CATEGORY;

      const bannerImages = isListStyle
        ? Array.from(
            new Set(
              category.items
                .map((item) => item.imagePath)
                .filter((img) => img && img.trim() !== "")
            )
          )
        : [];

      return {
        category: category.category,
        isListStyle,
        bannerImages,
        subGroups: groupCategoryItems(category.items),
        totalItems: category.items.length,
      };
    });
  }, [data, deferredQuery]);

  // Pre-compute subcategory tabs for the currently selected main category
  const activeSubNames = useMemo(() => {
    const currentCategory = data[activeSection];
    if (!currentCategory) return [];
    const uniqueSubs = Array.from(
      new Set(
        currentCategory.items.map((item) => {
          const sub = item.subcategory;
          return sub && sub.trim() !== "" ? sub.trim() : "ផ្សេងៗ";
        })
      )
    );
    return uniqueSubs.sort((a, b) => (a === "ផ្សេងៗ" ? 1 : b === "ផ្សេងៗ" ? -1 : 0));
  }, [data, activeSection]);

  // Progressive render: paint top categories immediately, then mount remaining categories in a non-blocking transition
  useEffect(() => {
    if (loading || data.length <= INITIAL_CATEGORY_COUNT) {
      if (!loading) setRenderAllCategories(true);
      return;
    }
    const rafId = requestAnimationFrame(() => {
      startTransition(() => {
        setRenderAllCategories(true);
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [loading, data.length]);

  useEffect(() => {
    if (renderAllCategories && pendingScrollCategoryRef.current) {
      const target = pendingScrollCategoryRef.current;
      pendingScrollCategoryRef.current = null;
      sectionRefs.current[target]?.scrollIntoView({ behavior: "smooth" });
    }
  }, [renderAllCategories]);

  // Memoized handler for search input change
  const handleSearchInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    if (val) setRenderAllCategories(true);
    setSearchQuery(val);
  }, []);

  // Scroll to a section based on index
  const handleScroll = useCallback((categoryName: string, index: number) => {
    const el = sectionRefs.current[categoryName];
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      pendingScrollCategoryRef.current = categoryName;
      setRenderAllCategories(true);
    }
    setActiveSection(index);
    setActiveSubSection("");
  }, []);

  // Scroll to a sub-section based on sub-category name
  const handleSubScroll = useCallback((subName: string) => {
    subRef.current[subName]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSubSection(subName);
  }, []);

  if (isNotFound) {
    return <PageNotFound error="404 Page Not Found" />;
  }

  if (loading) {
    return (
      <Loading className="h-screen fixed w-full z-100 bg-white top-0 flex justify-center items-center  left-0" />
    );
  }

  let priorityCardCounter = 0;
  const visibleCategories =
    renderAllCategories || deferredQuery.trim().length > 0
      ? groupedMenu
      : groupedMenu.slice(0, INITIAL_CATEGORY_COUNT);

  return (
    <Provider store={store}>
      <ToastContainer />
      <div className="w-full  px-3 py-1 fixed flex flex-col gap-2 max-w-[575px] bg-white z-10">
        <NavBar />
        <ul
          className="no-scrollbar flex flex-nowrap gap-2 overflow-x-scroll"
          style={{ paddingBottom: "5px", borderBottom: "1px solid #4d4f55ff" }}
        >
          {data.map((item, index) => (
            <li
              key={item.category}
              onClick={() => handleScroll(item.category, index)}
              className={`font-dangrek cursor-pointer text-nowrap max-[500px]:text-[14px] text-[17px] py-[5px] px-3 w-fit rounded-full border-orange-600 border-2 ${
                activeSection === index ? "text-orange-600" : "text-black"
              }`}
            >
              {item.category}
            </li>
          ))}
        </ul>
        {/* Sok Thean Subcategory */}
        {data[activeSection] && (
          <ul
            className="no-scrollbar flex flex-nowrap gap-2 overflow-x-scroll"
            style={{ margin: "0px 60px", paddingBottom: "5px" }}
          >
            {activeSubNames.map((subName) => (
              <li
                key={subName}
                onClick={() => handleSubScroll(`${data[activeSection].category}-${subName}`)}
                className={`font-battambong cursor-pointer text-nowrap max-[500px]:text-[16px] text-[16px] py-[3px] px-3 w-fit rounded-full border-gray-300 border ${
                  activeSubSection === `${data[activeSection].category}-${subName}`
                    ? "bg-orange-600 text-white border-orange-600"
                    : "text-gray-900"
                }`}
              >
                {subName}
              </li>
            ))}
          </ul>
        )}
        {/*End ST Subcategory*/}
        <SearchBar query={searchQuery} onSearch={handleSearchInput} />
      </div>

      <main className=" pb-[200px] fixed top-3 h-full w-full mt-52 max-[600px]:mt-48  max-w-[575px] overflow-scroll scroll-smooth scroll-pt-0">
        <section className="px-3 mt-5   ">
          {searchQuery.trim().length <= 0 && <ImageSlider images={images} />}

          <div className="mt-2">
            {visibleCategories.map((category) => (
              <div
                key={category.category}
                className=""
                ref={(el) => {
                  sectionRefs.current[category.category] = el;
                }}
              >
                {category.totalItems > 0 && (
                  <div className="flex gap-3 justify-center  items-center mb-5">
                    <div className="w-20 h-[2px] rounded-full bg-gray-300"></div>
                    <h1
                      id={`${category.category}`}
                      className="font-bold font-dangrek text-[26px]  text-nowrap  max-[400px]:text-[20px]"
                    >
                      {category.category}
                    </h1>
                    <div className="w-20 h-[2px] rounded-full bg-gray-300"></div>
                  </div>
                )}

                {category.isListStyle ? (
                  <div className="night-food-section">
                    {category.totalItems > 0 && (
                      <NightFoodBanner images={category.bannerImages} imgUrl={IMG_BASE_URL} />
                    )}

                    <div className="grid grid-cols-1 gap-x-4">
                      {category.subGroups.map((group) => (
                        <div
                          key={group.subName}
                          className="mb-4"
                          ref={(el) => {
                            subRef.current[`${category.category}-${group.subName}`] = el;
                          }}
                        >
                          <h2 className="font-battambong text-[24px] font-semibold mb-1 px-1 text-black">
                            {group.subName}
                          </h2>
                          <div className="flex flex-col w-full">
                            {group.items.map((item) => (
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
                    {category.subGroups.map((group) => (
                      <div
                        key={group.subName}
                        className="mb-8"
                        ref={(el) => {
                          subRef.current[`${category.category}-${group.subName}`] = el;
                        }}
                      >
                        <h2 className="font-battambong text-[20px] font-semibold mb-2 px-1 text-black">
                          {group.subName}
                        </h2>
                        <div className="flex flex-wrap flex-row justify-between gap-y-4">
                          {group.items.map((item) => {
                            const isPriority = priorityCardCounter < 4;
                            priorityCardCounter += 1;
                            return (
                              <Cart
                                key={item.id}
                                cartItem={item}
                                isOrderPage={isOrderPage}
                                cur={cur}
                                priority={isPriority}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 px-4 py-4 max-w-[575px] z-[50] items-center w-full cursor-pointer rounded-t-2xl bg-white flex justify-between shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
          <OrderItem
            cur={cur}
            historyOrder={historyOrder}
            historyLoaded={historyLoaded}
            isClickOrder={isClickOrder}
            setClickOrder={setClickOrder}
          />
          <BasketBar cur={cur} historyOrder={historyOrder} />

          <button
            onClick={() => {
              try {
                (document.getElementById("my_modal_10") as HTMLDialogElement).showModal();
              } catch (error) {
                console.error("Error opening modal:", error);
              }
            }}
            className="bg-gray-200 w-14 h-14 flex justify-center items-center rounded-full border-orange-600 border-2"
          >
            <img
              className="w-10 h-10 max-[450px]:w-8"
              src={"/icons/service-bell.svg"}
              alt=""
              width={100}
              height={100}
            />
          </button>
          <Model />
        </div>

        {/* Footer section */}
        <footer className="mt-16 pb-[120px]">
          {groupedMenu.length <= 0 && <NotFound />}
          <Footer />
        </footer>
      </main>
    </Provider>
  );
}
