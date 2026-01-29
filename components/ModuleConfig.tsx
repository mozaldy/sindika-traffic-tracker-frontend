"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Gauge, Camera, Settings2, Loader2, Split } from "lucide-react";

interface ModuleConfig {
    modules: {
        speed: boolean;
        turn: boolean;
        plate: boolean;
    };
    plate_trigger: string;
    speed_threshold: number;
}

interface ModuleConfigPanelProps {
    onClose: () => void;
}

export function ModuleConfigPanel({ onClose }: ModuleConfigPanelProps) {
    const [config, setConfig] = useState<ModuleConfig>({
        modules: { speed: true, turn: true, plate: false },
        plate_trigger: "on_exit",
        speed_threshold: 80.0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Fetch current config on mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/config/modules");
                if (res.ok) {
                    const data = await res.json();
                    setConfig({
                        modules: data.modules || { speed: true, turn: true, plate: false },
                        plate_trigger: data.plate_trigger || "on_exit",
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

    const handleModuleToggle = (module: keyof ModuleConfig["modules"]) => {
        setConfig((prev) => ({
            ...prev,
            modules: {
                ...prev.modules,
                [module]: !prev.modules[module],
            },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/config/modules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            if (res.ok) {
                onClose();
            } else {
                console.error("Failed to save config");
            }
        } catch (err) {
            console.error("Error saving config:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card className="p-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </Card>
        );
    }

    return (
        <Card className="p-4 border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-zinc-600" />
                    <h3 className="font-semibold text-lg">Analysis Modules</h3>
                </div>

                <p className="text-xs text-zinc-500">
                    Enable or disable analysis modules. Disabling unused modules improves performance.
                </p>

                <div className="space-y-4">
                    {/* Speed Module */}
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                                <Gauge className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <Label className="font-medium">Speed Detection</Label>
                                <p className="text-xs text-zinc-500">Calculate vehicle speeds using lane calibration</p>
                            </div>
                        </div>
                        <Switch
                            checked={config.modules.speed}
                            onCheckedChange={() => handleModuleToggle("speed")}
                        />
                    </div>

                    {/* Turn Module */}
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
                                <Split className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <Label className="font-medium">Turn Detection</Label>
                                <p className="text-xs text-zinc-500">Detect turning behavior (Left/Right/Straight) at intersections</p>
                            </div>
                        </div>
                        <Switch
                            checked={config.modules.turn}
                            onCheckedChange={() => handleModuleToggle("turn")}
                        />
                    </div>

                    {/* Plate Module */}
                    <div className={`p-3 rounded-lg border ${config.modules.plate ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${config.modules.plate ? 'bg-amber-100 dark:bg-amber-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                                    <Camera className={`h-4 w-4 ${config.modules.plate ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`} />
                                </div>
                                <div>
                                    <Label className="font-medium">License Plate Capture</Label>
                                    <p className="text-xs text-zinc-500">Capture plate images (resource intensive)</p>
                                </div>
                            </div>
                            <Switch
                                checked={config.modules.plate}
                                onCheckedChange={() => handleModuleToggle("plate")}
                            />
                        </div>

                        {/* Plate trigger options (only visible when enabled) */}
                        {config.modules.plate && (
                            <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Label className="text-sm w-24">Trigger:</Label>
                                    <Select
                                        value={config.plate_trigger}
                                        onValueChange={(value) =>
                                            setConfig((prev) => ({ ...prev, plate_trigger: value }))
                                        }
                                    >
                                        <SelectTrigger className="flex-1 h-8 bg-white dark:bg-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="on_exit">On Zone Exit</SelectItem>
                                            <SelectItem value="on_speed_exceed">On Speed Exceed</SelectItem>
                                            <SelectItem value="always">Always (Every Vehicle)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {config.plate_trigger === "on_speed_exceed" && (
                                    <div className="flex items-center gap-3">
                                        <Label className="text-sm w-24">Threshold:</Label>
                                        <div className="flex-1 flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={config.speed_threshold}
                                                onChange={(e) =>
                                                    setConfig((prev) => ({
                                                        ...prev,
                                                        speed_threshold: parseFloat(e.target.value) || 0,
                                                    }))
                                                }
                                                className="h-8 w-24 bg-white dark:bg-zinc-800"
                                                min={0}
                                                step={5}
                                            />
                                            <span className="text-sm text-zinc-500">km/h</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Configuration"
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
