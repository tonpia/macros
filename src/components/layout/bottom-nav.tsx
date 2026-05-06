"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "◉" },
  { href: "/macros", label: "Macros", icon: "◎" },
  { href: "/workouts", label: "Workouts", icon: "◈" },
  { href: "/body", label: "Body", icon: "◇" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition ${
                active
                  ? "text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
