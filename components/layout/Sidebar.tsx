"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "仪表盘", icon: "📊" },
    { href: "/transactions", label: "交易记录", icon: "💰" },
    { href: "/categories", label: "分类管理", icon: "📁" },
    { href: "/budgets", label: "预算管理", icon: "📈" },
    { href: "/import", label: "数据导入", icon: "📥" },
    { href: "/export", label: "数据导出", icon: "📤" },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen flex-shrink-0">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">菜单</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
