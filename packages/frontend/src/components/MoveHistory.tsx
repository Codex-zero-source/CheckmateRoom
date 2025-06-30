import React from 'react';

interface MoveData {
  move: string;
  notation: string;
  player: 'white' | 'black';
  timestamp: number;
}

interface MoveHistoryProps {
  moves: MoveData[];
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Group moves into pairs for display (White move, Black move)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: whiteMove,
      black: blackMove
    });
  }

  return (
    <div className="move-history">
      <h3>Move History</h3>
      {moves.length === 0 ? (
        <p className="no-moves">No moves yet. White to play.</p>
      ) : (
        <div className="moves-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>White</th>
                <th>Black</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {movePairs.map((pair) => (
                <tr key={pair.moveNumber}>
                  <td className="move-number">{pair.moveNumber}.</td>
                  <td className="move white-move">
                    {pair.white ? (
                      <span title={`${pair.white.move} (${formatTime(pair.white.timestamp)})`}>
                        {pair.white.notation}
                      </span>
                    ) : (
                      <span className="waiting">...</span>
                    )}
                  </td>
                  <td className="move black-move">
                    {pair.black ? (
                      <span title={`${pair.black.move} (${formatTime(pair.black.timestamp)})`}>
                        {pair.black.notation}
                      </span>
                    ) : (
                      <span className="waiting">...</span>
                    )}
                  </td>
                  <td className="move-time">
                    {pair.white ? formatTime(pair.white.timestamp) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MoveHistory; 