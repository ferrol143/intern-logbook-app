"use client"

import { Home, Activity, BarChart3, Calendar, Settings, FileText, Users, Clock, X } from "lucide-react"
import { cn } from "../dashboard/lib/utils"
import { Button } from "./navbar/button-navbar"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/",
    active: true,
  },
  {
    title: "Aktivitas",
    icon: Activity,
    href: "/activities",
  },
  {
    title: "Laporan",
    icon: BarChart3,
    href: "/reports",
  },
  {
    title: "Kalender",
    icon: Calendar,
    href: "/calendar",
  },
  {
    title: "Timesheet",
    icon: Clock,
    href: "/timesheet",
  },
  {
    title: "Tim",
    icon: Users,
    href: "/team",
  },
]

const bottomMenuItems = [
  {
    title: "Dokumentasi",
    icon: FileText,
    href: "/docs",
  },
  {
    title: "Pengaturan",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">LB</span>
            </div>
            <span className="font-semibold">Logbook</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-full">
          {/* Main menu */}
          <div className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.href}
                  variant={item.active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    item.active && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Bottom menu */}
          <div className="border-t px-3 py-4">
            <div className="space-y-1">
              {bottomMenuItems.map((item) => (
                <Button key={item.href} variant="ghost" className="w-full justify-start gap-3 h-10">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}
