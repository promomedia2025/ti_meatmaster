"use client";

import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface WoltSearchBarProps {
  onToggle: (isExpanded: boolean) => void;
  isExpanded?: boolean;
  onSearchQueryChange?: (query: string) => void;
  placeholder?: string;
}

export default function WoltSearchBar({
  onToggle,
  isExpanded: externalIsExpanded,
  onSearchQueryChange,
  placeholder = "Search for restaurants...",
}: WoltSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const actualIsExpanded =
    externalIsExpanded !== undefined ? externalIsExpanded : isExpanded;

  useEffect(() => {
    if (actualIsExpanded && inputRef.current) {
      inputRef.current.focus();
    } else if (!actualIsExpanded) {
      // Focus the search icon when closing
      setTimeout(() => {
        if (searchBarRef.current) {
          searchBarRef.current.focus();
        }
      }, 50);
    }
  }, [actualIsExpanded]);

  // Notify parent of search query changes
  useEffect(() => {
    if (onSearchQueryChange) {
      onSearchQueryChange(searchQuery);
    }
  }, [searchQuery, onSearchQueryChange]);

  const handleExpand = () => {
    if (externalIsExpanded === undefined) {
      setIsExpanded(true);
    }
    onToggle(true);
  };

  const handleClose = () => {
    if (externalIsExpanded === undefined) {
      setIsExpanded(false);
    }
    setSearchQuery("");
    onToggle(false);
  };

  return (
    <div
      ref={searchBarRef}
      className={`flex items-center h-10 border-2 transition-all duration-300 ease-in-out overflow-hidden ${
        actualIsExpanded
          ? "sm:w-[40vw] px-2 shadow-lg border-[#FF9800] rounded-full"
          : "w-10 sm:w-auto sm:px-2 cursor-pointer hover:bg-muted bg-background border-border focus-visible:ring-2 focus-visible:ring-[#FF9800] focus-visible:border-[#FF9800] focus-visible:outline-none rounded-full sm:cursor-default"
      }`}
      style={actualIsExpanded ? { backgroundColor: "rgb(74, 74, 74)" } : {}}
      onClick={!actualIsExpanded ? handleExpand : undefined}
      tabIndex={actualIsExpanded ? -1 : 0}
      aria-label="Search"
      onKeyDown={
        !actualIsExpanded
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleExpand();
              }
            }
          : undefined
      }
    >
      <Search
        className={`flex-shrink-0 text-muted-foreground transition-all duration-300 ${
          actualIsExpanded ? "w-5 h-5" : "w-5 h-5 mx-auto sm:mx-0"
        }`}
        strokeWidth={2.5}
      />

      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder}
        className={`bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all duration-300 ${
          actualIsExpanded
            ? "w-full ml-2 opacity-100"
            : "w-0 opacity-0 sm:w-full sm:opacity-100 sm:ml-2"
        }`}
        disabled={false}
      />
    </div>
  );
}
