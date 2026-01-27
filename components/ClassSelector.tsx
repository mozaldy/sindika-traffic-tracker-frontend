"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const AVAILABLE_CLASSES = ["person", "car", "motorcycle", "truck", "bus"];

interface ClassSelectorProps {
  selectedClasses: string[];
  onChange: (classes: string[]) => void;
}

export function ClassSelector({ selectedClasses, onChange }: ClassSelectorProps) {
  const handleToggle = (cls: string) => {
    if (selectedClasses.includes(cls)) {
      onChange(selectedClasses.filter((c) => c !== cls));
    } else {
      onChange([...selectedClasses, cls]);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mt-4 p-4 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <Label className="mb-2">Filter Detected Objects</Label>
      <div className="flex flex-wrap gap-4">
        {AVAILABLE_CLASSES.map((cls) => (
          <div key={cls} className="flex items-center space-x-2">
            <Checkbox
              id={`cls-${cls}`}
              checked={selectedClasses.includes(cls)}
              onCheckedChange={() => handleToggle(cls)}
            />
            <Label
              htmlFor={`cls-${cls}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
            >
              {cls}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
