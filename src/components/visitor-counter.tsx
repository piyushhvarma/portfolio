"use client";

import { useEffect, useState } from "react";

function getOrdinalSuffix(i: number) {
  const j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
}

export default function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    // We use counterapi.dev for a free, no-auth simple hit counter
    fetch("https://api.counterapi.dev/v1/piyushportfolio/visits/up")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.count) {
          setVisitorCount(data.count);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch visitor count", err);
      });
  }, []);

  if (visitorCount === null) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Counting visitors...
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground text-center py-8 flex items-center justify-center gap-1">
      You are the <span className="font-semibold text-foreground mx-1">{getOrdinalSuffix(visitorCount)}</span> visitor
    </div>
  );
}
