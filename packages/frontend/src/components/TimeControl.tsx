import React from 'react';

interface TimeControlPreset {
  label: string; // e.g. '1+0'
  minutes: number;
  increment: number;
  type: string; // e.g. 'Bullet', 'Blitz', etc.
}

interface TimeControlProps {
  onTimeControlChange: (minutes: number, increment?: number) => void;
  selectedTime: number;
  selectedIncrement?: number;
}

const presets: TimeControlPreset[] = [
  { label: '1+0', minutes: 1, increment: 0, type: 'Bullet' },
  { label: '3+0', minutes: 3, increment: 0, type: 'Blitz' },
  { label: '3+2', minutes: 3, increment: 2, type: 'Blitz' },
  { label: '10+0', minutes: 10, increment: 0, type: 'Rapid' },
  { label: '10+5', minutes: 10, increment: 5, type: 'Rapid' },
  { label: '25+0', minutes: 25, increment: 0, type: 'Classical' },
];

const TimeControl: React.FC<TimeControlProps> = ({ onTimeControlChange, selectedTime, selectedIncrement }) => {
  return (
    <div className="time-control-fixed-grid">
      {presets.map((preset) => (
        <button
          key={preset.label}
          className={`time-control-tile${selectedTime === preset.minutes && (selectedIncrement ?? 0) === preset.increment ? ' selected' : ''}`}
          onClick={() => onTimeControlChange(preset.minutes, preset.increment)}
        >
          <div className="time-label">{preset.label}</div>
          <div className="time-type">{preset.type}</div>
        </button>
      ))}
    </div>
  );
};

export default TimeControl; 