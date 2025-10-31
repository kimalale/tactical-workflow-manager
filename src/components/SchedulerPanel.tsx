import { Clock3 } from "lucide-react";
import { useState } from "react";

const SchedulerPanel = ({
  schedules,
  onAddSchedule,
  onRemoveSchedule,
  isSchedulerRunning,
  onToggleScheduler,
}: {
  schedules: any[];
  onAddSchedule: (interval: number) => void;
  onRemoveSchedule: (interval: number) => void;
  isSchedulerRunning: boolean;
  onToggleScheduler: () => void;
}) => {
  const [interval, setInterval] = useState<string>("5");
  const [unit, setUnit] = useState<string>("seconds");

  const handleAdd = () => {
    const seconds =
      unit === "seconds"
        ? parseInt(interval)
        : unit === "minutes"
          ? parseInt(interval) * 60
          : parseInt(interval) * 3600;
    onAddSchedule(seconds);
    setInterval("5");
  };

  return (
    <div className="bg-black/90 border-2 border-green-900/50 rounded-sm">
      <div className="bg-gradient-to-r from-green-950/80 to-black/80 px-3 py-2 border-b border-green-900/30 flex items-center gap-2">
        <Clock3 className="w-4 h-4 text-green-500" />
        <span className="text-green-400 font-mono text-xs font-bold tracking-wider">
          SCHEDULER
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`text-[10px] font-mono ${isSchedulerRunning ? "text-green-400" : "text-green-700"}`}
          >
            {isSchedulerRunning ? "● ACTIVE" : "○ INACTIVE"}
          </span>
          <button
            onClick={onToggleScheduler}
            className={`text-[10px] font-mono px-2 py-1 border ${
              isSchedulerRunning
                ? "text-red-400 border-red-500/50 hover:bg-red-900/30"
                : "text-green-400 border-green-500/50 hover:bg-green-900/30"
            }`}
          >
            {isSchedulerRunning ? "STOP" : "START"}
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min="1"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="flex-1 bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
            placeholder="Interval"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="bg-black border border-green-900/50 text-green-400 font-mono text-xs px-2 py-1 focus:border-green-500 focus:outline-none"
          >
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </select>
          <button
            onClick={handleAdd}
            className="bg-green-900/50 hover:bg-green-800/50 border border-green-500/50 text-green-400 font-mono text-xs px-3 py-1"
          >
            ADD
          </button>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {schedules.length === 0 ? (
            <div className="text-green-700">// No schedules configured...</div>
          ) : (
            schedules.map((schedule, idx) => (
              <div
                key={idx}
                className="bg-black/50 border border-green-900/30 p-2 rounded flex items-center justify-between"
              >
                <div>
                  <div className="text-green-500">
                    Every {schedule.interval}s
                  </div>
                  <div className="text-green-700 text-[10px]">
                    Next:{" "}
                    {schedule.nextRun
                      ? new Date(schedule.nextRun).toLocaleTimeString()
                      : "Pending"}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveSchedule(idx)}
                  className="text-red-600 hover:text-red-400 text-[10px]"
                >
                  REMOVE
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulerPanel;
