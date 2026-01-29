"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Navigation, CreditCard } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Zone {
    id: string;
    name: string;
    type: 'direction';
    polygon: number[]; // [x1,y1,x2,y2,x3,y3,x4,y4] in pixels
}

interface ZoneConfigPanelProps {
    zones: Zone[];
    onZonesChange: (zones: Zone[]) => void;
    onSave: () => void;
    onCancel: () => void;
    width: number;
    height: number;
}

// Colors for direction zone
const zoneColors = {
    direction: { fill: 'rgba(0, 255, 0, 0.15)', stroke: '#00ff00' }
};

export function ZoneConfigPanel({ zones, onZonesChange, onSave, onCancel, width, height }: ZoneConfigPanelProps) {
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const addZone = () => {
        const newZone: Zone = {
            id: generateId(),
            name: `Direction Zone ${zones.length + 1}`,
            type: 'direction',
            polygon: [
                width * 0.2, height * 0.3,
                width * 0.8, height * 0.3,
                width * 0.8, height * 0.7,
                width * 0.2, height * 0.7
            ]
        };
        onZonesChange([...zones, newZone]);
    };

    const removeZone = (id: string) => {
        onZonesChange(zones.filter(z => z.id !== id));
    };

    const updateZone = (id: string, field: keyof Zone, value: any) => {
        onZonesChange(zones.map(z => z.id === id ? { ...z, [field]: value } : z));
    };

    return (
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Direction Zone Configuration</h3>
                    <Button onClick={addZone} size="sm" variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-50">
                        <Navigation className="h-4 w-4" />
                        + Add Zone
                    </Button>
                </div>

                <p className="text-xs text-zinc-500">
                    Direction zones detect turn behavior (left/right/straight) for vehicles passing through.
                </p>

                {zones.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        No zones configured. Click a button above to add one.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {zones.map((zone) => (
                            <div 
                                key={zone.id} 
                                className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            >
                                <GripVertical className="h-4 w-4 text-zinc-400" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <div className="flex-1">
                                    <Input
                                        value={zone.name}
                                        onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                                        placeholder="Zone name"
                                        className="w-48"
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeZone(zone.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" onClick={onCancel} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Cancel
                    </Button>
                    <Button onClick={onSave} className="bg-green-600 hover:bg-green-700 text-white">
                        Save Configuration
                    </Button>
                </div>
            </div>
        </Card>
    );
}

export { zoneColors };
