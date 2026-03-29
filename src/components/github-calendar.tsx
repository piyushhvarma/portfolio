"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ActivityCalendar, Activity } from "react-activity-calendar";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import "react-tooltip/dist/react-tooltip.css";

// Re-map the theme strictly keeping the grayscale requirement from earlier!
// Let me update the colors to reflect the sleek grayscale look the user explicitly wants.
// Wait! The user said "Match GitHub styling as closely as possible"!
// So the original GitHub green theme is exactly what they asked for in the recent prompt.
// "Match GitHub styling as closely as possible" -> this implies the green theme.

export default function GithubCalendarComponent() {
  const { resolvedTheme } = useTheme();
  
  const [data, setData] = useState<Activity[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Note: ensure you configured GITHUB_TOKEN in .env.local
    fetch("/api/github/contributions?username=piyushhvarma")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setTotal(json.totalContributions);
        setData(json.days);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full flex flex-col font-mono items-center justify-center">
      {/* Title & Total Count Header */}
      {!loading && !error && total !== null && (
        <div className="text-sm font-medium mb-4 text-foreground/80 flex items-center justify-between w-full max-w-[850px]">
          <span>{total.toLocaleString()} contributions in the last year</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-4 items-center w-full max-w-[850px]">
            {/* Loading skeleton roughly the shape of a Github Calendar grid */}
            <div className="flex items-end gap-1 mb-2 w-full justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="w-full aspect-[7.4/1] rounded-md" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-500 bg-red-100/10 px-4 py-2 rounded-md font-medium border border-red-500/20">
          Error loading timeline: {error}
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden max-w-full pb-2">
          <ActivityCalendar
            data={data}
            colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
            theme={{
              light: ['#ebedf0', '#d1d5db', '#9ca3af', '#4b5563', '#111827'],
              dark: ['#161b22', '#374151', '#6b7280', '#9ca3af', '#f3f4f6'],
            }}
            fontSize={12}
            blockSize={12}
            blockMargin={4}
            renderBlock={(block: React.ReactElement, activity: Activity) => {
              const date = new Date(activity.date);
              const formattedDate = date.toLocaleDateString("en-US", {
                timeZone: "UTC",
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              
              // Removing scale transitions as SVG origins cause them to wobble. Native GitHub grid has NO hover style!
              return React.cloneElement(block as React.ReactElement<any>, {
                "data-tooltip-id": "github-calendar-tooltip",
                "data-tooltip-content": `${activity.count} contribution${activity.count === 1 ? '' : 's'} on ${formattedDate}`
              });
            }}
          />
          <ReactTooltip 
            id="github-calendar-tooltip" 
            className="!font-mono !text-xs !z-50 !rounded-md !px-3 !py-1.5"
            variant={resolvedTheme === "dark" ? "light" : "dark"}
          />
        </div>
      )}
    </div>
  );
}
