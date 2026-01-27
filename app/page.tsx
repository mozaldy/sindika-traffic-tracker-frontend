import TrafficStream from "@/components/TrafficStream";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-zinc-900 dark:text-zinc-50">
            Sindika Traffic Analytics
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Real-time object detection and tracking via WebRTC
          </p>
        </div>

        <TrafficStream />
        
        <div className="text-center text-sm text-zinc-500">
           Powered by RF-DETR & WebSocket
        </div>
      </div>
    </main>
  );
}
