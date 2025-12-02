import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface DashboardLink {
  path: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  badge?: string;
}

interface DashboardNavProps {
  title: string;
  subtitle: string;
  links: DashboardLink[];
  actionSlot?: React.ReactNode;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ title, subtitle, links, actionSlot }) => {
  const location = useLocation();

  return (
    <div className="card border border-slate-700/70 shadow-lg shadow-slate-900/30">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-primary-400/80">{title}</p>
          <h1 className="text-3xl md:text-4xl font-black mt-2">{subtitle}</h1>
        </div>
        {actionSlot}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`group relative rounded-2xl border px-4 py-4 transition-all ${
                active
                  ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-900/40'
                  : 'border-slate-700/70 hover:border-primary-500/60 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                    active ? 'bg-primary-500 text-white' : 'bg-slate-800 text-primary-400 group-hover:bg-primary-500/80'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{link.label}</p>
                    {link.badge && (
                      <span className="rounded-full bg-primary-500/20 px-2 py-0.5 text-xs text-primary-200">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  {link.description && (
                    <p className="text-sm text-slate-400 mt-0.5">{link.description}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardNav;


