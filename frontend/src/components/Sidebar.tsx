import React from 'react';

export type SidebarItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

type SidebarProps = {
  items: SidebarItem[];
  activeId: string;
  onNavigate: (id: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ items, activeId, onNavigate }) => {
  return (
    <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-indigo-600 to-purple-600 text-white shadow-xl">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <i className="fas fa-plane"></i>
        </div>
        <span className="font-semibold tracking-wide">Vinpearl Airlines</span>
      </div>
      <nav className="py-3">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              className={`w-full text-left px-6 py-3 flex items-center gap-3 transition-colors border-l-4 ${active ? 'bg-white/15 border-white' : 'border-transparent hover:bg-white/10'}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="w-5 text-center">
                {item.icon || <i className="fas fa-circle text-xs"></i>}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;


