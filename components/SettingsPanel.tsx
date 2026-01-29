"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Gauge, Camera, Settings2, Loader2, Split, Plus, Trash2 } from "lucide-react";
import { Lane } from "./SpeedZoneConfig";
import { Zone } from "./ZoneConfigPanel";

interface ModuleConfig {
    modules: {
        speed: boolean;
        turn: boolean;
        plate: boolean;
    };
    plate_trigger: string;
    speed_threshold: number;
}

interface SettingsPanelProps {
    lanes: Lane[];
    onLanesChange: (lanes: Lane[]) => void;
    onSaveLanes: () => Promise<void> | void;
    zones: Zone[];
    onZonesChange: (zones: Zone[]) => void;
    onSaveZones: () => Promise<void> | void;
    plateLine: number[] | null;
    onPlateLineChange: (line: number[] | null) => void;
    onSavePlateLine: () => Promise<void> | void;
    width: number;
    height: number;
}

export function SettingsPanel({ 
    lanes,
    onLanesChange,
    onSaveLanes,
    zones,
    onZonesChange,
    onSaveZones,
    plateLine,
    onPlateLineChange,
    onSavePlateLine,
    width,
    height
}: SettingsPanelProps) {
    const [config, setConfig] = useState<ModuleConfig>({
        modules: { speed: true, turn: false, plate: false },
        plate_trigger: "on_line",
        speed_threshold: 80.0,
    });
    const [loading, setLoading] = useState(true);
    const [savingScope, setSavingScope] = useState<string | null>(null);

    const handleSave = async (scope: string, saveFn: () => Promise<void> | void) => {
        setSavingScope(scope);
        try {
            await saveFn();
        } finally {
            // Small delay to show 'Saved' or just revert
            setTimeout(() => setSavingScope(null), 500);
        }
    };

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/config/modules");
                if (res.ok) {
                    const data = await res.json();
                    setConfig({
                        modules: data.modules || { speed: true, turn: false, plate: false },
                        plate_trigger: data.plate_trigger || "on_line",
                        speed_threshold: data.speed_threshold || 80.0,
                    });
                }
            } catch (err) {
                console.error("Failed to fetch module config:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleModuleToggle = async (module: keyof ModuleConfig["modules"]) => {
        const newConfig = {
            ...config,
            modules: {
                ...config.modules,
                [module]: !config.modules[module],
            },
        };
        setConfig(newConfig);
        
        try {
            await fetch("/api/config/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newConfig),
            });
        } catch (err) {
            console.error("Error saving config:", err);
        }
    };

    const handleTriggerChange = async (value: string) => {
        const newConfig = { ...config, plate_trigger: value };
        setConfig(newConfig);
        try {
            await fetch("/api/config/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newConfig),
            });
        } catch (err) {
            console.error("Error saving config:", err);
        }
    };

    const handleThresholdChange = (value: number) => {
        setConfig({ ...config, speed_threshold: value });
    };

    const handleThresholdBlur = async () => {
        try {
            await fetch("/api/config/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
        } catch (err) {
            console.error("Error saving config:", err);
        }
    };

    // Lane helpers (index-based)
    const addLane = () => {
        const newLane: Lane = {
            name: `Lane ${lanes.length + 1}`,
            distance: 10,
            line_a: [width * 0.2, height * 0.3, width * 0.8, height * 0.3],
            line_b: [width * 0.2, height * 0.6, width * 0.8, height * 0.6],
        };
        onLanesChange([...lanes, newLane]);
    };

    const removeLane = (idx: number) => {
        onLanesChange(lanes.filter((_, i) => i !== idx));
    };

    const updateLane = (idx: number, field: keyof Lane, value: any) => {
        const newLanes = [...lanes];
        (newLanes[idx] as any)[field] = value;
        onLanesChange(newLanes);
    };

    // Zone helpers (index-based)
    const addZone = () => {
        const id = `zone-${Date.now()}`;
        const newZone: Zone = {
            id,
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

    const removeZone = (idx: number) => {
        onZonesChange(zones.filter((_, i) => i !== idx));
    };

    const updateZoneName = (idx: number, name: string) => {
        const newZones = [...zones];
        newZones[idx].name = name;
        onZonesChange(newZones);
    };

    // Plate line helpers
    const addPlateLine = () => {
        onPlateLineChange([width * 0.2, height * 0.6, width * 0.8, height * 0.6]);
    };

    const removePlateLine = () => {
        onPlateLineChange(null);
    };

    if (loading) {
        return (
            <div className="w-80 flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto">
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-zinc-600" />
                    <h3 className="font-semibold text-lg">Settings</h3>
                </div>

                <p className="text-xs text-zinc-500">
                    Configure analysis modules. Drag points on video to edit.
                </p>

                {/* Speed Module */}
                <div className={`rounded-lg border transition-all ${config.modules.speed ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${config.modules.speed ? 'bg-blue-100 dark:bg-blue-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                <Gauge className={`h-4 w-4 ${config.modules.speed ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                            </div>
                            <div>
                                <Label className="font-medium">Speed Detection</Label>
                                <p className="text-xs text-zinc-500">Lane calibration</p>
                            </div>
                        </div>
                        <Switch
                            checked={config.modules.speed}
                            onCheckedChange={() => handleModuleToggle("speed")}
                        />
                    </div>
                    
                    {config.modules.speed && (
                        <div className="px-3 pb-3 border-t border-blue-200 dark:border-blue-800 space-y-2">
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-medium text-blue-600">Lanes</span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={addLane}>
                                        <Plus className="h-3 w-3 mr-1" />Add
                                    </Button>
                                    <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${savingScope === 'lanes' ? 'text-zinc-500' : 'text-green-600'}`} onClick={() => handleSave('lanes', onSaveLanes)} disabled={savingScope === 'lanes'}>
                                        {savingScope === 'lanes' ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                            {lanes.map((lane, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded p-2">
                                    <Input
                                        value={lane.name}
                                        onChange={(e) => updateLane(idx, 'name', e.target.value)}
                                        className="h-7 text-xs flex-1"
                                    />
                                    <Input
                                        type="number"
                                        value={lane.distance}
                                        onChange={(e) => updateLane(idx, 'distance', parseFloat(e.target.value) || 0)}
                                        className="h-7 text-xs w-14"
                                        title="Distance (m)"
                                    />
                                    <span className="text-xs text-zinc-500">m</span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => removeLane(idx)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {lanes.length === 0 && (
                                <p className="text-xs text-zinc-400 italic py-2">No lanes. Click Add to create one.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Turn Module */}
                <div className={`rounded-lg border transition-all ${config.modules.turn ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${config.modules.turn ? 'bg-purple-100 dark:bg-purple-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                <Split className={`h-4 w-4 ${config.modules.turn ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}`} />
                            </div>
                            <div>
                                <Label className="font-medium">Turn Detection</Label>
                                <p className="text-xs text-zinc-500">Direction zones</p>
                            </div>
                        </div>
                        <Switch
                            checked={config.modules.turn}
                            onCheckedChange={() => handleModuleToggle("turn")}
                        />
                    </div>
                    
                    {config.modules.turn && (
                        <div className="px-3 pb-3 border-t border-purple-200 dark:border-purple-800 space-y-2">
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-medium text-purple-600">Zones</span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={addZone}>
                                        <Plus className="h-3 w-3 mr-1" />Add
                                    </Button>
                                    <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${savingScope === 'zones' ? 'text-zinc-500' : 'text-green-600'}`} onClick={() => handleSave('zones', onSaveZones)} disabled={savingScope === 'zones'}>
                                        {savingScope === 'zones' ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                            {zones.map((zone, idx) => (
                                <div key={zone.id} className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded p-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <Input
                                        value={zone.name}
                                        onChange={(e) => updateZoneName(idx, e.target.value)}
                                        className="h-7 text-xs flex-1"
                                    />
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => removeZone(idx)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            {zones.length === 0 && (
                                <p className="text-xs text-zinc-400 italic py-2">No zones. Click Add to create one.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Plate Module */}
                <div className={`rounded-lg border transition-all ${config.modules.plate ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${config.modules.plate ? 'bg-amber-100 dark:bg-amber-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                <Camera className={`h-4 w-4 ${config.modules.plate ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`} />
                            </div>
                            <div>
                                <Label className="font-medium">Plate Capture</Label>
                                <p className="text-xs text-zinc-500">License plates</p>
                            </div>
                        </div>
                        <Switch
                            checked={config.modules.plate}
                            onCheckedChange={() => handleModuleToggle("plate")}
                        />
                    </div>

                    {config.modules.plate && (
                        <div className="px-3 pb-3 border-t border-amber-200 dark:border-amber-800 space-y-3">
                            <div className="flex items-center gap-2 pt-2">
                                <Label className="text-xs w-16 shrink-0">Trigger:</Label>
                                <Select value={config.plate_trigger} onValueChange={handleTriggerChange}>
                                    <SelectTrigger className="h-7 text-xs bg-white dark:bg-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="on_line">Plate Line</SelectItem>
                                        <SelectItem value="on_speed_exceed">Speed Exceed</SelectItem>
                                        <SelectItem value="always">Always</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {config.plate_trigger === "on_speed_exceed" && (
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs w-16 shrink-0">Threshold:</Label>
                                    <Input
                                        type="number"
                                        value={config.speed_threshold}
                                        onChange={(e) => handleThresholdChange(parseFloat(e.target.value) || 0)}
                                        onBlur={handleThresholdBlur}
                                        className="h-7 text-xs w-16 bg-white dark:bg-zinc-800"
                                        min={0}
                                        step={5}
                                    />
                                    <span className="text-xs text-zinc-500">km/h</span>
                                </div>
                            )}

                            {(config.plate_trigger === "on_line" || plateLine !== null) && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-amber-600">Plate Line</span>
                                        <div className="flex gap-1">
                                            {!plateLine ? (
                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={addPlateLine}>
                                                    <Plus className="h-3 w-3 mr-1" />Add
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-red-500" onClick={removePlateLine}>
                                                        Remove
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs ${savingScope === 'plate' ? 'text-zinc-500' : 'text-green-600'}`} onClick={() => handleSave('plate', onSavePlateLine)} disabled={savingScope === 'plate'}>
                                                        {savingScope === 'plate' ? "Saving..." : "Save"}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {plateLine ? (
                                        <p className="text-xs text-zinc-500 bg-white dark:bg-zinc-800 rounded p-2">
                                            Drag endpoints on video to adjust
                                        </p>
                                    ) : (
                                        <p className="text-xs text-zinc-400 italic">No line. Click Add to create one.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
