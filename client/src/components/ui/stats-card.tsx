import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  iconColor?: string;
  className?: string;
}

export function StatsCard({ title, value, icon, iconColor, className }: StatsCardProps) {
  return (
    <div className={cn("p-6 rounded-xl shadow-lg gradient-card", className)}>
      <div className="flex justify-center mb-3">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          iconColor === "blue" && "bg-blue-900 bg-opacity-30",
          iconColor === "yellow" && "bg-yellow-900 bg-opacity-30",
          iconColor === "purple" && "bg-purple-900 bg-opacity-30",
          !iconColor && "bg-secondary bg-opacity-30"
        )}>
          {icon}
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center mb-2">{title}</h2>
      <p className="text-4xl font-bold text-center">{value}</p>
    </div>
  );
}
