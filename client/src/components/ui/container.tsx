import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("w-full max-w-lg p-6 rounded-xl shadow-lg gradient-card", className)}>
      {children}
    </div>
  );
}

export function PageContainer({ children, className }: ContainerProps) {
  return (
    <div className={cn("flex justify-center items-center min-h-[80vh]", className)}>
      {children}
    </div>
  );
}

export function HeaderIcon({ icon, className }: { icon: ReactNode; className?: string }) {
  return (
    <div className="flex justify-center mb-6">
      <div className={cn("w-12 h-12 rounded-full bg-secondary flex items-center justify-center", className)}>
        {icon}
      </div>
    </div>
  );
}
