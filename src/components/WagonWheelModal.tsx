import Modal from './Modal';

const ZONES = [
  { id: 0, name: 'Third Man', angle: 30, x: 78, y: 20 },
  { id: 1, name: 'Point', angle: 60, x: 88, y: 40 },
  { id: 2, name: 'Cover', angle: 80, x: 85, y: 58 },
  { id: 3, name: 'Extra Cover', angle: 100, x: 78, y: 72 },
  { id: 4, name: 'Long Off', angle: 150, x: 60, y: 88 },
  { id: 5, name: 'Long On', angle: 210, x: 40, y: 88 },
  { id: 6, name: 'Mid Wicket', angle: 250, x: 22, y: 72 },
  { id: 7, name: 'Square Leg', angle: 280, x: 15, y: 58 },
  { id: 8, name: 'Mid-wicket Deep', angle: 300, x: 12, y: 40 },
  { id: 9, name: 'Fine Leg', angle: 330, x: 22, y: 20 },
  { id: 10, name: 'Straight', angle: 0, x: 50, y: 10 },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectZone: (zone: number) => void;
}

export default function WagonWheelModal({ isOpen, onClose, onSelectZone }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shot Direction (Optional)">
      <div className="p-4">
        <p className="text-dark-300 text-xs text-center mb-3">Tap where the ball went, or skip</p>
        
        {/* Cricket field visualization */}
        <div className="relative w-full aspect-square max-w-xs mx-auto">
          {/* Field circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-b from-green-900/40 to-green-800/30 border-2 border-green-600/30">
            {/* Pitch */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-16 bg-yellow-900/40 rounded" />
          </div>
          
          {/* Zone buttons */}
          {ZONES.map(zone => (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className="btn-press absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-dark-700/80 border border-dark-500 flex items-center justify-center text-white text-[8px] font-medium hover:bg-accent/30 hover:border-accent transition-all"
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
              title={zone.name}
            >
              {zone.name.split(' ').map(w => w[0]).join('')}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn-press w-full mt-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-dark-300 font-semibold text-sm"
        >
          Skip →
        </button>
      </div>
    </Modal>
  );
}

// Wagon wheel display component
export function WagonWheelDisplay({ balls }: { balls: { shotZone?: number; runs: number }[] }) {
  const shotsByZone = ZONES.map(zone => ({
    ...zone,
    shots: balls.filter(b => b.shotZone === zone.id),
    totalRuns: balls.filter(b => b.shotZone === zone.id).reduce((s, b) => s + b.runs, 0),
  }));

  return (
    <div className="relative w-full aspect-square max-w-xs mx-auto">
      <div className="absolute inset-4 rounded-full bg-gradient-to-b from-green-900/30 to-green-800/20 border border-green-600/20">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-12 bg-yellow-900/30 rounded" />
      </div>

      {shotsByZone.filter(z => z.shots.length > 0).map(zone => (
        <div
          key={zone.id}
          className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center"
          style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
        >
          <span className="text-accent text-xs font-bold">{zone.totalRuns}</span>
        </div>
      ))}
    </div>
  );
}
