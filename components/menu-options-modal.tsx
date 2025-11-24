"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import Image from "next/image";

interface MenuOptionValue {
  menu_option_value_id: number;
  option_value_id: number;
  name: string;
  price: number;
  quantity: number | null;
  is_default: boolean | null;
  available?: boolean | null;
  priority: number;
}

interface MenuOption {
  menu_option_id: number;
  option_id: number;
  option_name: string;
  display_type: string;
  priority: number;
  required: boolean;
  min_selected: number;
  max_selected: number;
  option_values: MenuOptionValue[];
}

interface MenuItem {
  menu_id: number;
  menu_name: string;
  menu_description: string;
  menu_price: number;
  minimum_qty: number;
  menu_priority: number;
  order_restriction: string | null;
  currency: string;
  categories: Array<{
    category_id: number;
    name: string;
    description: string;
    priority: number;
    permalink_slug: string;
  }>;
  image?: {
    url: string;
    path: string;
    name: string;
    size: number | null;
    type: string;
    width: number | null;
    height: number | null;
  };
  menu_options?: MenuOption[];
}

interface MenuOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onAddToCart: (
    item: MenuItem,
    selectedOptions: any[],
    quantity: number,
    comment: string
  ) => void;
  initialSelectedOptions?: SelectedOption[];
  initialQuantity?: number;
  initialComment?: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
}

export interface SelectedOption {
  menu_option_id: number;
  option_name: string;
  selected_values: Array<{
    menu_option_value_id: number;
    name: string;
    price: number;
  }>;
}

export function MenuOptionsModal({
  isOpen,
  onClose,
  menuItem,
  onAddToCart,
  initialSelectedOptions,
  initialQuantity,
  initialComment,
  confirmLabel,
  isSubmitting,
}: MenuOptionsModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [comment, setComment] = useState("");

  // Helpers: get selected count and constraints per option
  const getSelectedCount = (option: MenuOption) => {
    const selected = selectedOptions.find((o) => o.menu_option_id === option.menu_option_id);
    return selected ? selected.selected_values.length : 0;
  };

  const isSingleSelect = (option: MenuOption) => {
    const t = (option.display_type || "").toLowerCase();
    // Single-select if UI type is inherently single OR business rule says max 1
    if (["radio", "single", "single_choice", "buttons"].includes(t)) {
      return true;
    }
    if ((option.max_selected || 0) === 1) {
      return true;
    }
    return false;
  };

  const isAtMax = (option: MenuOption) => {
    const max = option.max_selected || 0;
    if (max <= 0) return false; // 0 or less means unlimited
    return getSelectedCount(option) >= max;
  };

  const isAtMin = (option: MenuOption) => {
    const min = option.min_selected || 0;
    return getSelectedCount(option) <= min;
  };

  const isValueDisabled = (option: MenuOption, value: MenuOptionValue) => {
    const currentlySelected = isValueSelected(option, value);
    if (value.available === false) return true;
    // Single-select: we don't disable options; switching is always allowed
    if (isSingleSelect(option)) return false;

    // For multi-select: if not selected and at max, disable selecting new values
    if (!currentlySelected && isAtMax(option)) return true;

    // If selected and unchecking would violate min for required options, disable uncheck
    if (
      currentlySelected &&
      option.required &&
      (option.min_selected || 0) > 0 &&
      isAtMin(option)
    ) {
      return true;
    }

    return false;
  };

  // Reset state when a new menuItem is opened (for instant UI update)
  useEffect(() => {
    if (isOpen && menuItem) {
      console.log("🍽️ [MENU OPTIONS MODAL] Opened with menuItemData:", {
        menu_id: menuItem.menu_id,
        menu_name: menuItem.menu_name,
        menu_price: menuItem.menu_price,
        currency: menuItem.currency,
        has_options: !!menuItem.menu_options?.length,
        options: menuItem.menu_options,
      });

      const defaultSelections: SelectedOption[] = [];
      menuItem.menu_options?.forEach((option) => {
        const rawDefaults =
          option.option_values?.filter(
            (value) => !!value.is_default && value.available !== false
          ) || [];

        if (!rawDefaults.length) {
          return;
        }

        const limitedDefaults = (() => {
          if (isSingleSelect(option)) {
            return rawDefaults.slice(0, 1);
          }
          const max = option.max_selected || 0;
          if (max > 0) {
            return rawDefaults.slice(0, max);
          }
          return rawDefaults;
        })();

        if (!limitedDefaults.length) {
          return;
        }

        defaultSelections.push({
          menu_option_id: option.menu_option_id,
          option_name: option.option_name,
          selected_values: limitedDefaults.map((value) => ({
            menu_option_value_id: value.menu_option_value_id,
            name: value.name,
            price: value.price,
          })),
        });
      });

      const selectionMap = new Map<number, SelectedOption>();
      defaultSelections.forEach((selection) =>
        selectionMap.set(selection.menu_option_id, selection)
      );

      const normalizedInitialSelections =
        initialSelectedOptions
          ?.map((initialOption) => {
            const option = menuItem.menu_options?.find(
              (opt) => opt.menu_option_id === initialOption.menu_option_id
            );
            if (!option) return null;

            const matchingValues =
              option.option_values?.filter((value) =>
                initialOption.selected_values.some(
                  (val) => val.menu_option_value_id === value.menu_option_value_id
                )
              ) || [];

            const availableValues = matchingValues.filter(
              (value) => value.available !== false
            );

            if (!availableValues.length) {
              return null;
            }

            let limitedValues = availableValues;
            if (isSingleSelect(option)) {
              limitedValues = availableValues.slice(0, 1);
            } else if (option.max_selected > 0) {
              limitedValues = availableValues.slice(0, option.max_selected);
            }

            return {
              menu_option_id: option.menu_option_id,
              option_name: option.option_name,
              selected_values: limitedValues.map((value) => ({
                menu_option_value_id: value.menu_option_value_id,
                name: value.name,
                price: value.price,
              })),
            };
          })
          .filter(Boolean) as SelectedOption[] | undefined;

      normalizedInitialSelections?.forEach((selection) =>
        selectionMap.set(selection.menu_option_id, selection)
      );

      setSelectedOptions(Array.from(selectionMap.values()));
      setQuantity(
        initialQuantity && initialQuantity > 0 ? initialQuantity : 1
      );
      setComment(initialComment ? initialComment.trim() : "");
    }
  }, [
    isOpen,
    menuItem,
    initialSelectedOptions,
    initialQuantity,
    initialComment,
  ]);

  const handleOptionChange = (
    option: MenuOption,
    value: MenuOptionValue,
    isSelected: boolean
  ) => {
    setSelectedOptions((prev) => {
      const existingOptionIndex = prev.findIndex(
        (opt) => opt.menu_option_id === option.menu_option_id
      );

      const currentCount = existingOptionIndex >= 0 ? prev[existingOptionIndex].selected_values.length : 0;
      const minSel = option.min_selected || 0;
      const maxSel = option.max_selected || 0; // 0 => unlimited
      const single = isSingleSelect(option);

      // Enforce constraints for multi-select types before mutating state
      if (!single) {
        if (isSelected) {
          // Trying to select an additional value
          if (maxSel > 0 && currentCount >= maxSel) {
            return prev; // ignore selection beyond max
          }
        } else {
          // Trying to unselect a value
          if (option.required && minSel > 0 && currentCount <= minSel) {
            return prev; // ignore unselect that violates min
          }
        }
      }

      if (existingOptionIndex >= 0) {
        const existingOption = prev[existingOptionIndex];
        let updatedValues = [...existingOption.selected_values];

        if (isSelected) {
          if (single) {
            // For single-select, always replace with only this value
            updatedValues = [{
              menu_option_value_id: value.menu_option_value_id,
              name: value.name,
              price: value.price,
            }];
          } else {
            // For multi-select, add this value if not already selected
            if (!updatedValues.find((v) => v.menu_option_value_id === value.menu_option_value_id)) {
              updatedValues.push({
                menu_option_value_id: value.menu_option_value_id,
                name: value.name,
                price: value.price,
              });
            }
          }
        } else {
          // Remove the value (applies to multi-select or unselect single)
          updatedValues = updatedValues.filter((v) => v.menu_option_value_id !== value.menu_option_value_id);
        }

        if (updatedValues.length === 0) {
          return prev.filter(
            (opt) => opt.menu_option_id !== option.menu_option_id
          );
        }

        const updatedOptions = [...prev];
        updatedOptions[existingOptionIndex] = {
          ...existingOption,
          selected_values: updatedValues,
        };
        return updatedOptions;
      } else if (isSelected) {
        // Add new option
        return [
          ...prev,
          {
            menu_option_id: option.menu_option_id,
            option_name: option.option_name,
            selected_values: [{
              menu_option_value_id: value.menu_option_value_id,
              name: value.name,
              price: value.price,
            }],
          },
        ];
      }

      return prev;
    });
  };

  const isValueSelected = (option: MenuOption, value: MenuOptionValue) => {
    const selectedOption = selectedOptions.find(
      (opt) => opt.menu_option_id === option.menu_option_id
    );
    return (
      selectedOption?.selected_values.some(
        (v) => v.menu_option_value_id === value.menu_option_value_id
      ) || false
    );
  };

  const calculateTotalPrice = () => {
    if (!menuItem) return 0;
    let total = menuItem.menu_price * quantity;

    selectedOptions.forEach((option) => {
      option.selected_values.forEach((value) => {
        total += value.price * quantity;
      });
    });

    return total;
  };

  const handleAddToCart = () => {
    if (!menuItem) return;

    // Transform selectedOptions to the format expected by cart
    const optionValues = selectedOptions.flatMap((option) =>
      option.selected_values.map((value) => ({
        menu_option_id: option.menu_option_id,
        menu_option_value_id: value.menu_option_value_id,
        option_name: option.option_name,
        option_value_name: value.name,
        price: value.price,
      }))
    );

    onAddToCart(menuItem, optionValues, quantity, comment.trim());
    onClose();
    // Reset state
    setQuantity(1);
    setSelectedOptions([]);
    setComment("");
  };

  const hasRequiredOptions = () => {
    if (!menuItem || !menuItem.menu_options) return true;

    return menuItem.menu_options.every((option) => {
      if (!option.required) return true;

      const selectedOption = selectedOptions.find(
        (opt) => opt.menu_option_id === option.menu_option_id
      );

      return (
        selectedOption &&
        selectedOption.selected_values.length >= option.min_selected
      );
    });
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-end justify-center z-50 transition-all duration-300 ease-out ${
        isOpen && menuItem ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-gray-900 rounded-t-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 ease-out transform ${
          isOpen && menuItem ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {menuItem?.menu_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Item Image */}
          {menuItem?.image?.url && (
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
              <Image
                src={menuItem.image.url}
                alt={menuItem?.menu_name || ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          {/* Description */}
          {menuItem?.menu_description && (
            <p className="text-gray-400 mb-4">{menuItem.menu_description}</p>
          )}

          {/* Menu Options */}
          {menuItem?.menu_options && menuItem.menu_options.length > 0 && (
            <div className="space-y-4">
              {menuItem.menu_options.map((option) => (
                <div
                  key={option.menu_option_id}
                  className="border-b border-gray-800 pb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">
                      {option.option_name}
                    </h3>
                    {option.required && (
                      <span className="text-red-400 text-sm">Required</span>
                    )}
                  </div>

                  {option.min_selected > 0 && (
                    <p className="text-gray-400 text-sm mb-2">
                      Select at least {option.min_selected}
                      {option.max_selected > 0 &&
                        ` (max ${option.max_selected})`}
                    </p>
                  )}

                  <div className="space-y-2">
                    {option.option_values.map((value) => (
                      <label
                        key={value.menu_option_value_id}
                        className={`flex items-center justify-between p-3 bg-gray-800 rounded-lg transition-colors ${
                          value.available === false
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-700 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={
                              isSingleSelect(option) ? "radio" : "checkbox"
                            }
                            name={`option-${option.menu_option_id}`}
                            checked={isValueSelected(option, value)}
                            disabled={isValueDisabled(option, value)}
                            onChange={(e) =>
                              handleOptionChange(
                                option,
                                value,
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-[#ff9328ff] bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span
                            className={`text-white ${
                              value.available === false
                                ? "text-gray-400 line-through"
                                : ""
                            }`}
                          >
                            {value.name}
                          </span>
                          {value.available === false && (
                            <span className="text-sm text-red-400">
                              Μη διαθεσιμο
                            </span>
                          )}
                        </div>
                        {value.price > 0 && value.available !== false && (
                          <span className="text-blue-400 font-medium">
                            +{value.price.toFixed(2)} {menuItem?.currency}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Item Comment */}
          <div className="mt-6">
            <label
              htmlFor="menu-item-comment"
              className="block text-white font-medium mb-2"
            >
              Σχόλια
            </label>
            <textarea
              id="menu-item-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Προσθέστε σχόλια για το αντικείμενο..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[96px] resize-none"
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-4 pb-6 border-t border-gray-800 bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-medium">Συνολικό Ποσό</span>
            <span className="text-[#ff9328ff] font-bold text-lg">
              {calculateTotalPrice().toFixed(2)} {menuItem?.currency}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quantity Controls - Left */}
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">Qty:</span>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              <span className="text-white font-medium w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Add to Cart Button - Right */}
            <button
              onClick={handleAddToCart}
            disabled={!hasRequiredOptions() || isSubmitting}
            className="flex-1 bg-[#ff9328ff] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#915316] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
            {isSubmitting
              ? "Αποθήκευση..."
              : confirmLabel || "Προσθήκη στο καλάθι"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
