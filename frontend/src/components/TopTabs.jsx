import React from 'react';

const TopTabs = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'follow', label: 'Follow' },
    { id: 'live', label: 'Live' },
    { id: 'party', label: 'Party' },
  ];

  return (
    <div className="flex items-center justify-center gap-6 py-2 border-b border-white/5 bg-vibe-bg/60 backdrop-blur-md">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`relative py-1 text-sm font-bold transition-all ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-gradient-to-r from-vibe-accent to-vibe-cyan rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TopTabs;
