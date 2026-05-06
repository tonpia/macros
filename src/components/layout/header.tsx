"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/macros": "Macros",
  "/workouts": "Workouts",
  "/body": "Body",
};

export default function Header() {
  const pathname = usePathname();
  const title = TITLES[pathname] || "Macro Tracker";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur-sm">
      <h1 className="text-center text-lg font-semibold text-white">
        {title}
      </h1>
    </header>
  );
}
