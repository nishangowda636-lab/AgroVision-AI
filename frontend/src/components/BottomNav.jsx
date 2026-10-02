import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sprout, Bot, Bell, Menu } from 'lucide-react';

export default function BottomNav() {
  const navLinks = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Farm', path: '/crop-health', icon: Sprout },
    { name: 'AI Agent', path: '/assistant', icon: Bot },
    { name: 'Alerts', path: '/notifications', icon: Bell },
    { name: 'More', path: '/profile', icon: Menu },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08120E]/95 border-t border-[#1B382D] backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-lg">
      {navLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#10B981] font-bold'
                  : 'text-[#8FA59B] hover:text-[#F3F7F5]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
