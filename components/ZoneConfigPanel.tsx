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
    type: 'direction' | 'plate';
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

// Colors for different zone types
const zoneColors = {
    direction: { fill: 'rgba(0, 255, 0, 0.15)', stroke: '#00ff00' },
    plate: { fill: 'rgba(0, 100, 255, 0.15)', stroke: '#0064ff' }
};

export function ZoneConfigPanel({ zones, onZonesChange, onSave, onCancel, width, height }: ZoneConfigPanelProps) {
    const generateId = () => Math.random().toString(36).substr(2, 9);

    const addZone = (type: 'direction' | 'plate') => {
        const newZone: Zone = {
            id: generateId(),
            name: `${type === 'direction' ? 'Direction' : 'Plate'} Zone ${zones.filter(z => z.type === type).length + 1}`,
            type,
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
                    <h3 className="font-semibold text-lg">Zone Configuration</h3>
                    <div className="flex gap-2">
                        <Button onClick={() => addZone('direction')} size="sm" variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-50">
                            <Navigation className="h-4 w-4" />
                            + Direction
                        </Button>
                        <Button onClick={() => addZone('plate')} size="sm" variant="outline" className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50">
                            <CreditCard className="h-4 w-4" />
                            + Plate
                        </Button>
                    </div>
                </div>

                <p className="text-xs text-zinc-500">
                    <span className="text-green-500 font-bold">Direction Zone</span>: Detect turn direction (left/right/straight). 
                    <span className="text-blue-500 font-bold ml-2">Plate Zone</span>: Capture license plates.
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
                                className={`flex items-center gap-3 p-3 rounded-lg border ${
                                    zone.type === 'direction' 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}
                            >
                                <GripVertical className="h-4 w-4 text-zinc-400" />
                                <div className={`w-3 h-3 rounded-full ${zone.type === 'direction' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                <div className="flex-1 flex items-center gap-3">
                                    <Input
                                        value={zone.name}
                                        onChange={(e) => updateZone(zone.id, 'name', e.target.value)}
                                        placeholder="Zone name"
                                        className="w-40"
                                    />
                                    <Select
                                        value={zone.type}
                                        onValueChange={(value: 'direction' | 'plate') => updateZone(zone.id, 'type', value)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="direction">
                                                <span className="flex items-center gap-2">
                                                    <Navigation className="h-3 w-3 text-green-500" />
                                                    Direction
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="plate">
                                                <span className="flex items-center gap-2">
                                                    <CreditCard className="h-3 w-3 text-blue-500" />
                                                    Plate
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
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
