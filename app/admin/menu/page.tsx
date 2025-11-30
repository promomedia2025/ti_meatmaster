"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface MenuItem {
  menu_id: number;
  menu_name: string;
  category_name: string;
  menu_status: boolean;
  menu_price: number;
  menu_description: string;
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/admin/menu-items", {
          credentials: "include",
        });

        const result = await response.json();
        console.log("Menu items API result:", result);

        if (result.success && result.menuItems) {
          setMenuItems(result.menuItems);
        } else {
          setError(result.error || "Failed to fetch menu items");
        }
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError("An error occurred while fetching menu items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Filter menu items based on search query (prefix matching for name)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return menuItems;
    }
    const query = searchQuery.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.menu_name.toLowerCase().startsWith(query) ||
        item.category_name.toLowerCase().includes(query) ||
        item.menu_description.toLowerCase().includes(query) ||
        item.menu_id.toString().includes(query)
    );
  }, [menuItems, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Main Content */}
      <main className="p-8">
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-400">Loading menu items...</p>
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
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, category, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff9328ff] focus:border-transparent"
                />
              </div>
            </div>

            {/* Menu Items List */}
            <div className="space-y-4 mb-6">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <div
                    key={item.menu_id}
                    className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700"
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
                        <label className="relative inline-flex items-center cursor-pointer">
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
                                  console.error(
                                    "Failed to toggle menu status:",
                                    result.error
                                  );
                                } else {
                                  console.log(
                                    `✅ Menu ${item.menu_id} status updated to ${newStatus}`
                                  );
                                }
                              } catch (err) {
                                // Rollback on error
                                setMenuItems(menuItems);
                                console.error(
                                  "Error toggling menu status:",
                                  err
                                );
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff9328ff]"></div>
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
                                ? "bg-[#ff9328ff] text-white"
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
    </div>
  );
}
