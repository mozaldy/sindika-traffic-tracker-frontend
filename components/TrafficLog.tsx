import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, RefreshCw, Car, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrafficEvent {
    id: number;
    timestamp: number;
    class_name: string;
    speed_kmh: number;
    direction_deg: number;
    direction_symbol?: string;
    crossing_start?: number;
    crossing_end?: number;
    image_path?: string;
    video_source?: string;
    license_plate?: string;
    plate_image_path?: string;
}

export function TrafficLog() {
    const [events, setEvents] = useState<TrafficEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events?limit=50");
            const data = await res.json();
            // API returns array directly, not { events: [] }
            setEvents(Array.isArray(data) ? data : (data.events || []));
        } catch (e) {
            console.error("Failed to fetch events", e);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
        // Optional: Poll every 5 seconds
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, []);

    const deleteEvent = async (id: number) => {
        try {
            await fetch(`/api/events/${id}`, { method: "DELETE" });
            setEvents(prev => prev.filter(e => e.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const deleteAllEvents = async () => {
        if (!confirm("Are you sure you want to delete ALL logs? This cannot be undone.")) return;
        try {
            await fetch(`/api/events`, { method: "DELETE" });
            setEvents([]);
        } catch (e) {
            console.error(e);
        }
    };

    const formatTime = (ts: number) => {
        return new Date(ts * 1000).toLocaleString();
    };

    const formatVidTime = (seconds?: number) => {
        if (typeof seconds !== 'number') return "-";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <>
        <Card className="w-full max-w-5xl mx-auto mt-8 shadow-lg border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-blue-500" />
                    <CardTitle>Traffic Event Log</CardTitle>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="destructive" size="sm" onClick={deleteAllEvents} disabled={events.length === 0}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Log
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                            <TableRow>
                                <TableHead className="w-[100px]">Capture</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Crossing</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Speed</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead>Plate</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        No traffic events recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            {event.image_path ? (
                                                <div 
                                                    className="h-12 w-16 bg-zinc-100 rounded overflow-hidden relative group cursor-pointer"
                                                    onClick={() => event.image_path && setSelectedImage(`/captures/${event.image_path.split('/').pop()}`)}
                                                >
                                                    <img 
                                                        src={event.image_path ? `/captures/${event.image_path.split('/').pop()}` : ''} 
                                                        alt={event.class_name}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-12 w-16 bg-zinc-100 rounded flex items-center justify-center text-xs text-zinc-400">
                                                    No Img
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-xs">
                                            {formatTime(event.timestamp)}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                            {formatVidTime(event.crossing_start)} - {formatVidTime(event.crossing_end)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {event.class_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {event.speed_kmh.toFixed(1)} <span className="text-xs text-muted-foreground">km/h</span>
                                        </TableCell>
                                        <TableCell>
                                            {event.direction_symbol ? (
                                                <div className="flex items-center gap-2" title={`Angle: ${event.direction_deg?.toFixed(0)}°`}>
                                                    <span className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                                        {event.direction_symbol}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {event.plate_image_path ? (
                                                <div 
                                                    className="h-10 w-20 bg-zinc-100 rounded overflow-hidden relative group cursor-pointer"
                                                    onClick={() => event.plate_image_path && setSelectedImage(`/captures/${event.plate_image_path.split('/').pop()}`)}
                                                >
                                                    <img 
                                                        src={`/captures/${event.plate_image_path.split('/').pop()}`} 
                                                        alt="License plate"
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                    />
                                                </div>
                                            ) : event.license_plate ? (
                                                <span className="font-mono text-xs">{event.license_plate}</span>
                                            ) : (
                                                <span className="text-xs text-zinc-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-zinc-500 max-w-[150px] truncate">
                                            {event.video_source}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => deleteEvent(event.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
        {selectedImage && (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
                onClick={() => setSelectedImage(null)}
            >
                <div className="relative max-w-7xl max-h-[90vh] flex items-center justify-center p-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute -top-12 right-0 md:-top-12 md:-right-12 text-white hover:bg-white/20 hover:text-white rounded-full h-10 w-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <img 
                        src={selectedImage} 
                        alt="Traffic capture full size" 
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        )}
        </>
    );
}
