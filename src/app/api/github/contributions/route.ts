import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN is missing in the environment variables" },
      { status: 500 }
    );
  }

  // Define the exact 365-day rolling window
  const now = new Date();
  const to = now.toISOString();

  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 1);
  const from = fromDate.toISOString();

  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { username, from, to },
      }),
      // Cache the result for 1 hour to prevent rate-limiting but keep it fresh
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json({ error: data.errors[0].message }, { status: 400 });
    }

    const calendar = data.data.user.contributionsCollection.contributionCalendar;

    // Map GitHub's contributionLevel to react-activity-calendar's numeric levels (0-4)
    const levelMap: Record<string, number> = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    };

    // Flatten the weeks array into a continuous array of days
    let days = calendar.weeks.flatMap((week: any) =>
      week.contributionDays.map((day: any) => ({
        date: day.date,
        count: day.contributionCount,
        level: levelMap[day.contributionLevel] ?? 0,
      }))
    );

    // Strip future padded dates that GitHub implicitly attaches to the current week
    const todayStr = now.toISOString().split("T")[0];
    days = days.filter((d: any) => d.date <= todayStr);

    // Slice exactly 365 days to guarantee the perfect 1-year timeline leading into today
    if (days.length > 365) {
      days = days.slice(-365);
    }

    return NextResponse.json({
      totalContributions: calendar.totalContributions,
      days,
    });
  } catch (error: any) {
    console.error("Error fetching GitHub contributions:", error);
    return NextResponse.json({ error: "Failed to fetch contributions data." }, { status: 500 });
  }
}
