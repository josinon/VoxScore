import { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    photo: string;
  };
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full pr-3 transition-colors"
      >
        <img
          src={user.photo}
          alt={user.name}
          className="w-8 h-8 rounded-full border-2 border-white/30"
        />
        <span className="text-sm font-medium text-white hidden sm:inline">
          {user.name.split(' ')[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <img
                src={user.photo}
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 rounded-lg transition-colors text-red-600 font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
