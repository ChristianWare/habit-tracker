"use client";

// Mood against how much got done, and weight over time.

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type MoodPoint = {
  label: string;
  done: number | null;
  mood: number | null;
};
export type WeightPoint = { label: string; weight: number };

const axis = {
  fontSize: 12,
  fill: "#3a4560",
  fontFamily: "var(--SofiaSansRegular)",
};
const tip = {
  contentStyle: {
    borderRadius: 4,
    border: "1px solid #dedbd2",
    fontFamily: "var(--SofiaSansRegular)",
    fontSize: 14,
  },
};

export function MoodChart({ data }: { data: MoodPoint[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 4, bottom: 0, left: -18 }}
        >
          <CartesianGrid stroke='#ecebe6' vertical={false} />
          <XAxis
            dataKey='label'
            tick={axis}
            tickLine={false}
            axisLine={{ stroke: "#dedbd2" }}
            minTickGap={16}
          />
          <YAxis
            yAxisId='pct'
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={axis}
            tickLine={false}
            axisLine={false}
            unit='%'
          />
          <YAxis
            yAxisId='mood'
            orientation='right'
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={axis}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            {...tip}
            formatter={(v, name) =>
              name === "Habits done" ? [`${v}%`, name] : [`${v} / 10`, name]
            }
          />
          <Bar
            yAxisId='pct'
            dataKey='done'
            name='Habits done'
            fill='#e8d9b0'
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Line
            yAxisId='mood'
            dataKey='mood'
            name='Mood'
            stroke='#0b0f1a'
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#ff9f00", stroke: "#0b0f1a", strokeWidth: 1.5 }}
            connectNulls
            type='monotone'
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  const vals = data.map((d) => d.weight);
  const min = Math.floor(Math.min(...vals) - 2);
  const max = Math.ceil(Math.max(...vals) + 2);
  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
        >
          <CartesianGrid stroke='#ecebe6' vertical={false} />
          <XAxis
            dataKey='label'
            tick={axis}
            tickLine={false}
            axisLine={{ stroke: "#dedbd2" }}
            minTickGap={16}
          />
          <YAxis
            domain={[min, max]}
            tick={axis}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip {...tip} formatter={(v) => [`${v} lbs`, "Weight"]} />
          <Line
            dataKey='weight'
            stroke='#0b0f1a'
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#ff9f00", stroke: "#0b0f1a" }}
            type='monotone'
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
