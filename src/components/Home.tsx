import React from 'react';
import { Settings } from 'lucide-react';

const Home: React.FC = () => {
  const tools = [
    {
      id: 'dnsw',
      name: 'Do Not Stop Writing',
      description: 'The dangerous writing app.',
      icon: 'original-icon.png',
      href: 'dnsw'
    },
    {
      id: 'dropdata',
      name: 'DropData',
      description: 'Secure peer file sharing.',
      icon: 'dropdata-icon.png',
      href: 'dropdata'
    }
  ];

  const navigateTo = (href: string) => {
    // Force a simple relative path which is most reliable for Android filesystem
    const target = href + "/index.html";
    console.log("Navigating to:", target);
    window.location.assign(target);
  };

  return (
    <div className="relative z-30 min-h-screen flex flex-col px-6 pb-12">
      <div className="absolute inset-0 hero-gradient pointer-events-none" />

      <div className="relative z-50 flex items-center justify-between w-full h-16 mt-2">
        <h1 className="text-xl font-serif font-bold tracking-tight text-primary dark:text-neutral-100">
          Ktooth
        </h1>

        <button
          onClick={() => navigateTo('settings')}
          className="p-2 text-neutral-500 hover:text-primary dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0 focus:outline-none"
          aria-label="Settings"
        >
          <Settings size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full py-12">
        <div className="mb-8 text-left">
          <h2 className="text-3xl font-serif font-medium text-primary dark:text-neutral-100 mb-2">
            Workspace
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-serif">
            Select a tool to get started.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => navigateTo(tool.href)}
              className="group relative flex flex-col items-center text-center p-5 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer focus:outline-none"
            >
              <div className="w-16 h-16 rounded-2xl mb-4 overflow-hidden shadow-md group-hover:scale-110 transition-transform duration-300">
                <img src={tool.icon} alt={tool.name} className="w-full h-full object-cover" />
              </div>

              <h3 className="text-sm font-bold text-primary dark:text-neutral-100 mb-1 font-sans tracking-tight">
                {tool.id === 'dnsw' ? 'DNSW' : tool.name}
              </h3>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight font-sans px-2">
                {tool.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
