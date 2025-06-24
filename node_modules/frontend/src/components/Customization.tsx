import { useContext } from 'react';
import type { FC } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import './Customization.css';

interface CustomizationProps {
    setPieceSet: (set: string) => void;
}

const Customization: FC<CustomizationProps> = ({ setPieceSet }) => {
    const { setTheme } = useContext(ThemeContext);

    return (
        <div className="customization-panel">
            <h4>Theme</h4>
            <div className="theme-options">
                <button onClick={() => setTheme('cyberpunk')}>Cyberpunk</button>
                <button onClick={() => setTheme('classic')}>Classic</button>
            </div>
            <h4>Piece Set</h4>
            <div className="piece-set-options">
                <button onClick={() => setPieceSet('default')}>Default</button>
                <button onClick={() => setPieceSet('merida')}>Merida</button>
                <button onClick={() => setPieceSet('pirouette')}>Pirouette</button>
            </div>
        </div>
    );
};

export default Customization; 