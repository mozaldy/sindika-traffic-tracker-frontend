import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, RefreshCw, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrafficEvent {
    id: number;
    timestamp: number;
    class_name: string;
    speed_kmh: number;
    direction_deg: number;
    image_path: string;
    video_source: string;
}

export function TrafficLog() {
    const [events, setEvents] = useState<TrafficEvent[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events?limit=50");
            const data = await res.json();
            setEvents(data.events);
        } catch (e) {
            console.error("Failed to fetch events", e);
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

    return (
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
                                <TableHead>Class</TableHead>
                                <TableHead>Speed</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No traffic events recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            {event.image_path ? (
                                                <div className="h-12 w-16 bg-zinc-100 rounded overflow-hidden relative group cursor-pointer">
                                                    <img 
                                                        src={`/captures/${event.image_path.split('/').pop()}`} 
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
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {event.class_name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={event.speed_kmh > 50 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                                                {event.speed_kmh.toFixed(1)} km/h
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {typeof event.direction_deg === 'number' ? event.direction_deg.toFixed(0) : '0'}°
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
    );
}
