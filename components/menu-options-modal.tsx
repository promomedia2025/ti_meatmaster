"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface LinkedOptionValue {
  menu_option_value_id: number;
  name: string;
  price: number;
}

interface MenuOptionValue {
  menu_option_value_id: number;
  option_value_id: number;
  name: string;
  price: number;
  quantity: number | null;
  is_default: boolean | null;
  is_enabled?: boolean;
  available?: boolean;
  priority: number;
  linked_option_values?: LinkedOptionValue[];
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
  is_enabled?: boolean;
  available?: boolean;
  free_count: number;
  free_order_by:
    | "selection_order"
    | "lowest_price"
    | "price_lowest"
    | "priority";
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

  const getSelectedCount = (option: MenuOption) => {
    const selected = selectedOptions.find(
      (o) => o.menu_option_id === option.menu_option_id
    );
    return selected ? selected.selected_values.length : 0;
  };

  const isSingleSelect = (option: MenuOption) => {
    const t = (option.display_type || "").toLowerCase();
    if (["radio", "single", "single_choice", "buttons"].includes(t)) return true;
    if ((option.max_selected || 0) === 1) return true;
    return false;
  };

  const isAtMax = (option: MenuOption) => {
    const max = option.max_selected || 0;
    if (max <= 0) return false;
    return getSelectedCount(option) >= max;
  };

  const isAtMin = (option: MenuOption) => {
    const min = option.min_selected || 0;
    return getSelectedCount(option) <= min;
  };

  const isValueDisabled = (option: MenuOption, value: MenuOptionValue) => {
    const currentlySelected = isValueSelected(option, value);
    if (value.available === false) return true;
    if (isSingleSelect(option)) return false;
    if (!currentlySelected && isAtMax(option)) return true;
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

  useEffect(() => {
    if (isOpen && menuItem) {
      const defaultSelections: SelectedOption[] = [];
      menuItem.menu_options?.forEach((option) => {
        const rawDefaults =
          option.option_values?.filter(
            (value) => !!value.is_default && value.available !== false
          ) || [];

        if (!rawDefaults.length) return;

        const limitedDefaults = (() => {
          if (isSingleSelect(option)) return rawDefaults.slice(0, 1);
          const max = option.max_selected || 0;
          if (max > 0) return rawDefaults.slice(0, max);
          return rawDefaults;
        })();

        if (!limitedDefaults.length) return;

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

      const normalizedInitialSelections = initialSelectedOptions
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

          if (!availableValues.length) return null;

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

      const initialSelections = Array.from(selectionMap.values());
      const adjustedSelections = ensureLinkedOptionsChecked(initialSelections);
      setSelectedOptions(adjustedSelections);
      setQuantity(initialQuantity && initialQuantity > 0 ? initialQuantity : 1);
      setComment(initialComment ? initialComment.trim() : "");
    }
  }, [
    isOpen,
    menuItem,
    initialSelectedOptions,
    initialQuantity,
    initialComment,
  ]);

  const findOptionForValueId = (
    menuOptionValueId: number
  ): { option: MenuOption; value: MenuOptionValue } | null => {
    if (!menuItem?.menu_options) return null;
    for (const opt of menuItem.menu_options) {
      const foundValue = opt.option_values?.find(
        (val) => val.menu_option_value_id === menuOptionValueId
      );
      if (foundValue) return { option: opt, value: foundValue };
    }
    return null;
  };

  const ensureLinkedOptionsChecked = (
    currentSelections: SelectedOption[]
  ): SelectedOption[] => {
    if (!menuItem?.menu_options) return currentSelections;

    const optionsReceivingLinks = new Set<number>();
    for (const selection of currentSelections) {
      const menuOption = menuItem.menu_options?.find(
        (opt) => opt.menu_option_id === selection.menu_option_id
      );
      if (!menuOption) continue;

      for (const selectedValue of selection.selected_values) {
        const optionValue = menuOption.option_values?.find(
          (val) =>
            val.menu_option_value_id === selectedValue.menu_option_value_id
        );
        optionValue?.linked_option_values?.forEach((linkedValue) => {
          const linkedData = findOptionForValueId(
            linkedValue.menu_option_value_id
          );
          if (linkedData) {
            optionsReceivingLinks.add(linkedData.option.menu_option_id);
          }
        });
      }
    }

    const result = new Map<number, SelectedOption>();
    for (const selection of currentSelections) {
      if (!optionsReceivingLinks.has(selection.menu_option_id)) {
        result.set(selection.menu_option_id, { ...selection });
      }
    }

    for (const selection of currentSelections) {
      const menuOption = menuItem.menu_options?.find(
        (opt) => opt.menu_option_id === selection.menu_option_id
      );
      if (!menuOption) continue;

      for (const selectedValue of selection.selected_values) {
        const optionValue = menuOption.option_values?.find(
          (val) =>
            val.menu_option_value_id === selectedValue.menu_option_value_id
        );

        optionValue?.linked_option_values?.forEach((linkedValue) => {
          const linkedOptionData = findOptionForValueId(
            linkedValue.menu_option_value_id
          );
          if (!linkedOptionData) return;

          const linkedOption = linkedOptionData.option;
          const existing = result.get(linkedOption.menu_option_id);
          const linkedValueObj = {
            menu_option_value_id: linkedValue.menu_option_value_id,
            name: linkedValue.name,
            price: linkedValue.price,
          };

          if (existing) {
            if (
              !existing.selected_values.some(
                (v) =>
                  v.menu_option_value_id === linkedValue.menu_option_value_id
              )
            ) {
              result.set(linkedOption.menu_option_id, {
                ...existing,
                selected_values: [...existing.selected_values, linkedValueObj],
              });
            }
          } else {
            result.set(linkedOption.menu_option_id, {
              menu_option_id: linkedOption.menu_option_id,
              option_name: linkedOption.option_name,
              selected_values: [linkedValueObj],
            });
          }
        });
      }
    }

    return Array.from(result.values());
  };

  const handleOptionChange = (
    option: MenuOption,
    value: MenuOptionValue,
    isSelected: boolean
  ) => {
    setSelectedOptions((prev) => {
      const existingOptionIndex = prev.findIndex(
        (opt) => opt.menu_option_id === option.menu_option_id
      );

      const currentCount =
        existingOptionIndex >= 0
          ? prev[existingOptionIndex].selected_values.length
          : 0;
      const minSel = option.min_selected || 0;
      const maxSel = option.max_selected || 0;
      const single = isSingleSelect(option);

      if (!single) {
        if (isSelected) {
          if (maxSel > 0 && currentCount >= maxSel) return prev;
        } else {
          if (option.required && minSel > 0 && currentCount <= minSel) return prev;
        }
      }

      if (existingOptionIndex >= 0) {
        const existingOption = prev[existingOptionIndex];
        let updatedValues = [...existingOption.selected_values];

        if (isSelected) {
          if (single) {
            updatedValues = [
              {
                menu_option_value_id: value.menu_option_value_id,
                name: value.name,
                price: value.price,
              },
            ];
          } else {
            if (
              !updatedValues.find(
                (v) => v.menu_option_value_id === value.menu_option_value_id
              )
            ) {
              updatedValues.push({
                menu_option_value_id: value.menu_option_value_id,
                name: value.name,
                price: value.price,
              });
            }
          }
        } else {
          updatedValues = updatedValues.filter(
            (v) => v.menu_option_value_id !== value.menu_option_value_id
          );
        }

        if (updatedValues.length === 0) {
          const filteredOptions = prev.filter(
            (opt) => opt.menu_option_id !== option.menu_option_id
          );
          return ensureLinkedOptionsChecked(filteredOptions);
        }

        const updatedOptions = [...prev];
        updatedOptions[existingOptionIndex] = {
          ...existingOption,
          selected_values: updatedValues,
        };
        return ensureLinkedOptionsChecked(updatedOptions);
      } else if (isSelected) {
        const updatedOptions = [
          ...prev,
          {
            menu_option_id: option.menu_option_id,
            option_name: option.option_name,
            selected_values: [
              {
                menu_option_value_id: value.menu_option_value_id,
                name: value.name,
                price: value.price,
              },
            ],
          },
        ];
        return ensureLinkedOptionsChecked(updatedOptions);
      }

      return ensureLinkedOptionsChecked(prev);
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

  const getFreeValueIdsForOption = (option: MenuOption): number[] => {
    if (option.free_count <= 0) return [];

    const selectedOption = selectedOptions.find(
      (opt) => opt.menu_option_id === option.menu_option_id
    );

    if (!selectedOption || selectedOption.selected_values.length === 0) return [];

    const valuesWithPrice = selectedOption.selected_values.filter(
      (val) => val.price > 0
    );

    if (valuesWithPrice.length === 0) return [];

    let valuesToMakeFree: Array<{ menu_option_value_id: number }> = [];

    if (option.free_order_by === "selection_order") {
      valuesToMakeFree = valuesWithPrice
        .slice(0, option.free_count)
        .map((val) => ({ menu_option_value_id: val.menu_option_value_id }));
    } else if (
      option.free_order_by === "lowest_price" ||
      option.free_order_by === "price_lowest"
    ) {
      const sorted = [...valuesWithPrice].sort((a, b) => a.price - b.price);
      valuesToMakeFree = sorted.slice(0, option.free_count).map((val) => ({
        menu_option_value_id: val.menu_option_value_id,
      }));
    }

    return valuesToMakeFree.map((v) => v.menu_option_value_id);
  };

  const calculateFreeOptionValues = (): Set<number> => {
    const freeValueIds = new Set<number>();
    if (!menuItem || !menuItem.menu_options) return freeValueIds;

    menuItem.menu_options.forEach((menuOption) => {
      if (menuOption.free_count <= 0) return;

      const selectedOption = selectedOptions.find(
        (opt) => opt.menu_option_id === menuOption.menu_option_id
      );

      if (!selectedOption || selectedOption.selected_values.length === 0) return;

      const valuesWithPrice = selectedOption.selected_values.filter(
        (val) => val.price > 0
      );

      if (valuesWithPrice.length === 0) return;

      let valuesToMakeFree: Array<{ menu_option_value_id: number }> = [];

      if (menuOption.free_order_by === "selection_order") {
        valuesToMakeFree = valuesWithPrice
          .slice(0, menuOption.free_count)
          .map((val) => ({ menu_option_value_id: val.menu_option_value_id }));
      } else if (
        menuOption.free_order_by === "lowest_price" ||
        menuOption.free_order_by === "price_lowest"
      ) {
        const sorted = [...valuesWithPrice].sort((a, b) => a.price - b.price);
        valuesToMakeFree = sorted
          .slice(0, menuOption.free_count)
          .map((val) => ({ menu_option_value_id: val.menu_option_value_id }));
      }

      valuesToMakeFree.forEach((val) => {
        freeValueIds.add(val.menu_option_value_id);
      });
    });

    return freeValueIds;
  };

  const calculateTotalPrice = () => {
    if (!menuItem) return 0;
    let total = menuItem.menu_price * quantity;
    const freeValueIds = calculateFreeOptionValues();

    let optionsTotal = 0;
    selectedOptions.forEach((option) => {
      option.selected_values.forEach((value) => {
        if (!freeValueIds.has(value.menu_option_value_id)) {
          optionsTotal += value.price * quantity;
        }
      });
    });

    total += optionsTotal;
    return total;
  };

  const handleAddToCart = () => {
    if (!menuItem) return;
    const freeValueIds = calculateFreeOptionValues();

    const optionValues = selectedOptions.flatMap((option) =>
      option.selected_values.map((value) => ({
        menu_option_id: option.menu_option_id,
        menu_option_value_id: value.menu_option_value_id,
        option_name: option.option_name,
        option_value_name: value.name,
        price: freeValueIds.has(value.menu_option_value_id) ? 0 : value.price,
      }))
    );

    onAddToCart(menuItem, optionValues, quantity, comment.trim());
    onClose();
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
      className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 transition-all duration-300 ease-out ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-zinc-900 border-t border-x border-zinc-800 rounded-t-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-300 ease-out transform shadow-2xl ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {menuItem?.menu_name}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors bg-zinc-800 p-1.5 rounded-full hover:bg-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {!menuItem && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg bg-zinc-800" />
              <Skeleton className="h-4 w-full bg-zinc-800" />
              <div className="space-y-4">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="border-b border-zinc-800 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-5 w-32 bg-zinc-800" />
                    </div>
                    <div className="space-y-2">
                      {[...Array(3)].map((_, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded bg-zinc-800" />
                          <Skeleton className="h-4 flex-1 bg-zinc-800" />
                          <Skeleton className="h-4 w-12 bg-zinc-800" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menuItem?.image?.url && (
            <div className="relative h-48 mb-4 rounded-xl overflow-hidden border border-zinc-800">
              <Image
                src={menuItem.image.url}
                alt={menuItem?.menu_name || ""}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          {menuItem?.menu_description && (
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">{menuItem.menu_description}</p>
          )}

          {menuItem?.menu_options && menuItem.menu_options.length > 0 && (
            <div className="space-y-6">
              {menuItem.menu_options.map((option) => (
                <div key={option.menu_option_id} className="border-b border-zinc-800 pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-white font-bold text-lg">
                        {option.option_name}
                      </h3>
                      {option.free_count > 0 && (
                        <span className="text-green-400 text-xs font-medium bg-green-400/10 px-2 py-0.5 rounded w-fit">
                          {option.free_count} δωρεάν
                        </span>
                      )}
                    </div>
                    {option.required && (
                      <span className="text-[#ff9328] text-xs font-bold tracking-wider bg-[#ff9328]/10 px-2 py-1 rounded">
                        ΑΠΑΙΤΕΙΤΑΙ
                      </span>
                    )}
                  </div>

                  {option.min_selected > 0 && (
                    <p className="text-zinc-500 text-xs mb-3">
                      Επιλέξτε τουλάχιστον {option.min_selected}
                      {option.max_selected > 0 && ` (μέγιστο ${option.max_selected})`}
                    </p>
                  )}

                  <div className="space-y-2">
                    {option.option_values.map((value) => {
                      const freeValueIds = getFreeValueIdsForOption(option);
                      const isFree = freeValueIds.includes(value.menu_option_value_id);

                      return (
                        <label
                          key={value.menu_option_value_id}
                          className={`flex items-center justify-between p-3 rounded-lg transition-all border ${
                            value.available === false
                              ? "opacity-50 cursor-not-allowed bg-black border-zinc-800"
                              : "cursor-pointer bg-black border-zinc-800 hover:border-zinc-600"
                          } ${isValueSelected(option, value) ? "border-[#ff9328] bg-[#ff9328]/5" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type={isSingleSelect(option) ? "radio" : "checkbox"}
                              name={`option-${option.menu_option_id}`}
                              checked={isValueSelected(option, value)}
                              disabled={isValueDisabled(option, value)}
                              onChange={(e) => handleOptionChange(option, value, e.target.checked)}
                              className="w-5 h-5 accent-[#ff9328] bg-zinc-800 border-zinc-600 rounded focus:ring-[#ff9328]"
                            />
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-medium ${value.available === false ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                                {value.name}
                              </span>
                              {isFree && value.available !== false && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-bold uppercase">
                                  ΔΩΡΕΑΝ
                                </span>
                              )}
                              {value.available === false && (
                                <span className="text-[10px] text-red-400 font-medium uppercase">
                                  Μη διαθεσιμο
                                </span>
                              )}
                            </div>
                          </div>
                          {value.price > 0 && value.available !== false && (
                            <span className={`font-bold text-sm ${isFree ? "text-zinc-600 line-through decoration-zinc-600" : "text-white"}`}>
                              +{value.price.toFixed(2)} {menuItem?.currency}
                            </span>
                          )}
                          {isFree && value.available !== false && (
                            <span className="text-green-400 font-bold text-sm ml-2">
                              0.00 {menuItem?.currency}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="menu-item-comment" className="block text-white font-bold mb-2 text-sm">
              Σχόλια
            </label>
            <textarea
              id="menu-item-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Προσθέστε σχόλια για το αντικείμενο..."
              className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff9328] focus:ring-1 focus:ring-[#ff9328] min-h-[96px] resize-none text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex-shrink-0 p-4 pb-6 border-t border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-zinc-400 font-medium text-sm">Συνολικό Ποσό</span>
            <span className="text-white font-bold text-xl">
              {calculateTotalPrice().toFixed(2)} {menuItem?.currency}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-black rounded-lg p-1 border border-zinc-800">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white font-bold w-8 text-center text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!hasRequiredOptions() || isSubmitting}
              className="flex-1 bg-[#ff9328] text-white py-3.5 px-6 rounded-xl font-bold hover:bg-[#915316] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
            >
              {isSubmitting ? "Αποθήκευση..." : confirmLabel || "Προσθήκη στο καλάθι"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}