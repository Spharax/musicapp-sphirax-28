import React from 'react';
import { Home, Music, Download, Settings, Library, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'library', icon: Library, label: 'Library' },
  { id: 'player', icon: Music, label: 'Player' },
  { id: 'analytics', icon: BarChart3, label: 'Stats' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50">
      <div className="glass-card mx-2 mb-2 rounded-2xl">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 min-w-0 flex-1 group",
                activeTab === id
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon 
                size={20} 
                className={cn(
                  "transition-all duration-300",
                  activeTab === id ? "mb-1" : "mb-1 group-hover:scale-110"
                )}
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-300",
                activeTab === id 
                  ? "opacity-100" 
                  : "opacity-70 group-hover:opacity-100"
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};