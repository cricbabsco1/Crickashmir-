import { useStore } from '../store/useStore';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function Header({ title, showBack, onBack, rightAction }: HeaderProps) {
  const { goBack } = useStore();
  
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-600 shrink-0">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack || goBack} className="btn-press w-8 h-8 flex items-center justify-center rounded-lg bg-dark-700 text-white">
            ←
          </button>
        )}
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </div>
      {rightAction}
    </header>
  );
}
