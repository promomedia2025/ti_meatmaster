"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MenuItem {
  menu_id: number;
  menu_name: string;
  category_name: string;
  menu_status: boolean;
  menu_price: number;
  menu_description: string;
}

interface Category {
  category_id: number;
  name: string;
}

interface MenuOptionValue {
  menu_option_value_id: number;
  name: string;
  price: number;
  is_default: boolean;
  is_enabled: boolean;
}

interface MenuOption {
  menu_option_id: number;
  option_name: string;
  display_type: string;
  is_enabled: boolean;
  values: MenuOptionValue[];
}

export default function AdminMenuPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const itemsPerPage = 15;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch("/api/admin/get-menu-categories", {
          credentials: "include",
        });

        // Check if response is 500 - redirect to login
        if (response.status === 500) {
          router.push("/admin/login");
          return;
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Handle different response formats
          if (Array.isArray(result.data)) {
            setCategories(result.data);
          } else if (result.data.data && Array.isArray(result.data.data)) {
            setCategories(result.data.data);
          } else if (
            result.data.categories &&
            Array.isArray(result.data.categories)
          ) {
            setCategories(result.data.categories);
          }
        } else if (Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch (err) {
        // Error fetching categories
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [router]);

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/admin/menu-items", {
          credentials: "include",
        });

        const result = await response.json();

        if (result.success && result.menuItems) {
          setMenuItems(result.menuItems);
        } else {
          setError(result.error || "Failed to fetch menu items");
        }
      } catch (err) {
        setError("An error occurred while fetching menu items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Filter menu items based on search query and category
  const filteredItems = useMemo(() => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (item) => item.category_name === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.menu_name.toLowerCase().startsWith(query) ||
          item.category_name.toLowerCase().includes(query) ||
          item.menu_description.toLowerCase().includes(query) ||
          item.menu_id.toString().includes(query)
      );
    }

    // Sort: first by menu_status (true first, then false), then alphabetically by menu_name
    filtered.sort((a, b) => {
      // First, sort by menu_status (true comes before false)
      if (a.menu_status !== b.menu_status) {
        return b.menu_status ? 1 : -1; // true items come first
      }
      // If menu_status is the same, sort alphabetically by menu_name
      return a.menu_name.localeCompare(b.menu_name);
    });

    return filtered;
  }, [menuItems, searchQuery, selectedCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when search query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Handle menu item click
  const handleMenuItemClick = async (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsModalOpen(true);
    setOptionsLoading(true);
    setMenuOptions([]);

    try {
      const response = await fetch(
        `/api/admin/menu-item-options?menu_id=${item.menu_id}`,
        {
          credentials: "include",
        }
      );

      const result = await response.json();

      // Handle different response formats
      // Menu options are in the options array of the API response
      let options: MenuOption[] = [];

      // Check for options array in various locations
      if (result.data?.options && Array.isArray(result.data.options)) {
        options = result.data.options;
      } else if (result.options && Array.isArray(result.options)) {
        options = result.options;
      } else if (result.success && result.data) {
        if (Array.isArray(result.data)) {
          options = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          options = result.data.data;
        } else if (
          result.data.menu_options &&
          Array.isArray(result.data.menu_options)
        ) {
          options = result.data.menu_options;
        } else {
          // Single object response - wrap in array
          options = [result.data];
        }
      } else if (Array.isArray(result.data)) {
        options = result.data;
      } else if (Array.isArray(result)) {
        options = result;
      } else if (result && typeof result === "object") {
        // Single object - wrap in array
        options = [result];
      }

      setMenuOptions(options);
    } catch (err) {
      // Error fetching menu options
    } finally {
      setOptionsLoading(false);
    }
  };

  // Handle toggle menu option value status
  const handleToggleOptionValueStatus = async (
    menuOptionValueId: number,
    currentStatus: boolean
  ) => {
    const newStatus = !currentStatus;

    // Optimistic update - update the option value status in all menu options
    setMenuOptions((prev) =>
      prev.map((option) => ({
        ...option,
        values: option.values.map((value) =>
          value.menu_option_value_id === menuOptionValueId
            ? { ...value, is_enabled: newStatus }
            : value
        ),
      }))
    );

    try {
      // Convert boolean to numeric is_enabled: 1 for enabled, 0 for disabled
      const isEnabledValue = newStatus ? 1 : 0;

      const response = await fetch("/api/admin/toggle-menu-option-value", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu_option_value_id: menuOptionValueId,
          is_enabled: isEnabledValue,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Rollback on error
        setMenuOptions((prev) =>
          prev.map((option) => ({
            ...option,
            values: option.values.map((value) =>
              value.menu_option_value_id === menuOptionValueId
                ? { ...value, is_enabled: currentStatus }
                : value
            ),
          }))
        );
      }
    } catch (err) {
      // Rollback on error
      setMenuOptions((prev) =>
        prev.map((option) => ({
          ...option,
          values: option.values.map((value) =>
            value.menu_option_value_id === menuOptionValueId
              ? { ...value, is_enabled: currentStatus }
              : value
          ),
        }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Main Content */}
      <main className="p-8">
        {isLoading && (
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <Skeleton className="h-8 w-48" />
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Skeleton className="h-10 w-full sm:w-[200px]" />
                <Skeleton className="h-10 w-full sm:w-80" />
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {menuItems && menuItems.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold">
                Menu Items ({filteredItems.length})
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                {/* Category Dropdown */}
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-[200px] bg-[#2a2a2a] border-gray-700 text-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2a2a] border-gray-700">
                    <SelectItem
                      value="all"
                      className="text-white focus:bg-[#3a3a3a]"
                    >
                      All Categories
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.category_id}
                        value={category.name}
                        className="text-white focus:bg-[#3a3a3a]"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, category, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff9328] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="space-y-4 mb-6">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <div
                    key={item.menu_id}
                    className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700 cursor-pointer hover:border-[#ff9328] transition-colors"
                    onClick={() => handleMenuItemClick(item)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {item.menu_name}
                          </h3>
                          <span className="px-2 py-1 bg-[#3a3a3a] text-gray-300 text-xs rounded">
                            {item.category_name}
                          </span>
                        </div>
                        {item.menu_description && (
                          <p className="text-gray-400 text-sm mb-2">
                            {item.menu_description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-400">Price:</span>
                          <span className="text-white font-semibold">
                            €{item.menu_price.toFixed(2)}
                          </span>
                          <span className="text-gray-400">ID:</span>
                          <span className="text-gray-300">#{item.menu_id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm ${
                            item.menu_status ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {item.menu_status ? "Active" : "Inactive"}
                        </span>
                        <label
                          className="relative inline-flex items-center cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={item.menu_status}
                            onChange={async (e) => {
                              const newStatus = e.target.checked;
                              // Optimistic update
                              const updatedItems = menuItems.map((i) =>
                                i.menu_id === item.menu_id
                                  ? { ...i, menu_status: newStatus }
                                  : i
                              );
                              setMenuItems(updatedItems);

                              try {
                                const response = await fetch(
                                  "/api/admin/menu-items/toggle-status",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    credentials: "include",
                                    body: JSON.stringify({
                                      menu_id: item.menu_id,
                                      menu_status: newStatus,
                                    }),
                                  }
                                );

                                const result = await response.json();

                                if (!result.success) {
                                  // Rollback on error
                                  setMenuItems(menuItems);
                                } 
                              } catch (err) {
                                // Rollback on error
                                setMenuItems(menuItems);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9328]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">
                    No menu items found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredItems.length)} of{" "}
                  {filteredItems.length} items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-1">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="text-gray-500 px-2">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-[#ff9328] text-white"
                                : "bg-[#2a2a2a] border border-gray-700 text-white hover:bg-[#3a3a3a]"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3a3a3a] transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {menuItems && menuItems.length === 0 && !isLoading && (
          <div className="bg-[#1a1a1a] rounded-lg p-6 text-center">
            <p className="text-gray-400">No menu items found</p>
          </div>
        )}
      </main>

      {/* Menu Item Options Modal */}
      {isModalOpen && selectedMenuItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedMenuItem.menu_name}
                </h2>
                <p className="text-gray-400 text-sm mt-1">Menu Options</p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedMenuItem(null);
                  setMenuOptions([]);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {optionsLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700"
                    >
                      <Skeleton className="h-6 w-32 mb-4" />
                      <div className="space-y-3">
                        {[...Array(2)].map((_, optIndex) => (
                          <div
                            key={optIndex}
                            className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <Skeleton className="h-5 w-40 mb-1" />
                                <div className="flex items-center gap-4">
                                  <Skeleton className="h-4 w-16" />
                                  <Skeleton className="h-4 w-16" />
                                  <Skeleton className="h-4 w-12" />
                                </div>
                              </div>
                              <Skeleton className="h-8 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : menuOptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No menu options found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {menuOptions.map((menuOption) => (
                    <div
                      key={menuOption.menu_option_id}
                      className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {menuOption.option_name}
                      </h3>
                      {menuOption.values && menuOption.values.length > 0 ? (
                        <div className="space-y-3">
                          {menuOption.values.map((optionValue) => (
                            <div
                              key={optionValue.menu_option_value_id}
                              className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="text-base font-medium text-white mb-1">
                                    {optionValue.name}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-400">
                                      Price:
                                    </span>
                                    <span className="text-white font-semibold">
                                      €{optionValue.price.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400">ID:</span>
                                    <span className="text-gray-300">
                                      #{optionValue.menu_option_value_id}
                                    </span>
                                  </div>
                                  {optionValue.is_default && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-sm ${
                                      optionValue.is_enabled
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {optionValue.is_enabled
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={optionValue.is_enabled}
                                      onChange={() =>
                                        handleToggleOptionValueStatus(
                                          optionValue.menu_option_value_id,
                                          optionValue.is_enabled
                                        )
                                      }
                                      className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9328]"></div>
                                  </label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          No option values available
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
