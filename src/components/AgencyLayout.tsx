import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Search,
  Megaphone,
  MessageSquare,
  Settings,
  Bot,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/agency', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/agency/leads', label: 'Leads', icon: Users },
  { to: '/agency/scraper', label: 'Scraper', icon: Search },
  { to: '/agency/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/agency/outreach', label: 'Outreach Logs', icon: MessageSquare },
  { to: '/agency/settings', label: 'Settings', icon: Settings },
];

export function AgencyLayout() {
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">AI Agency</p>
              <p className="text-xs text-gray-400 mt-0.5">Voice Assistant Sales</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <NavLink
            to="/"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
            Back to main app
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  );
}
