"use client";

import { Tag } from "lucide-react";
import { useSearchTags } from "@/lib/use-search-tags";

interface SearchTagsProps {
  selectedTags: number[];
  onTagsChange: (tags: number[]) => void;
}

export function SearchTags({ selectedTags, onTagsChange }: SearchTagsProps) {
  const { tags: availableTags, isLoading, error } = useSearchTags();

  const handleTagClick = (tagId: number) => {
    const isSelected = selectedTags.includes(tagId);

    if (isSelected) {
      // Remove tag
      onTagsChange(selectedTags.filter((id) => id !== tagId));
    } else {
      // Add tag
      onTagsChange([...selectedTags, tagId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="animate-pulse flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-muted rounded-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="text-sm text-muted-foreground">Failed to load tags</div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-2 overflow-x-auto"
      data-search-tags
    >
      <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
        <Tag className="w-4 h-4" />
        <span>Tags:</span>
      </div>

      <div className="flex gap-2 min-w-0">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);

          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isSelected
                  ? "bg-[#FF9800] text-white border-2 border-[#FF9800]"
                  : "bg-muted text-muted-foreground border-2 border-border hover:bg-muted/80"
              }`}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
