import React, { useState, useEffect, useCallback } from 'react';

interface RankingEntry {
  name: string;
  score: number;
  timestamp: number;
}

interface RankingProps {
  currentScore: number;
}

// Vercel APIエンドポイント（本番環境では自動的に設定される）
const RANKING_API_URL = import.meta.env.VITE_RANKING_API_URL || '/api/rankings';
const MAX_RANKINGS = 10;

const Ranking: React.FC<RankingProps> = ({ currentScore }) => {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiAvailable] = useState(true);

  const loadRankings = useCallback(async () => {
    try {
      const response = await fetch(RANKING_API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch rankings');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setRankings(data.slice(0, MAX_RANKINGS));
      }
    } catch (error) {
      console.error('Failed to load rankings:', error);
      // Firebaseが設定されていない場合はランキングを表示しない
    }
  }, []);

  useEffect(() => {
    // Vercelでは常にAPIが利用可能
    loadRankings();
  }, [loadRankings]);

  // APIが利用できない場合はコンポーネントを非表示
  if (!apiAvailable) {
    return null;
  }

  const submitScore = async () => {
    if (!playerName.trim() || loading || submitted) return;

    setLoading(true);
    try {
      const response = await fetch(RANKING_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName.trim(),
          score: currentScore,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setShowSubmit(false);
        setTimeout(() => {
          loadRankings();
          setSubmitted(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowSubmit = currentScore > 0 && !submitted;

  return (
    <div className="mt-4 bg-black/50 rounded-lg p-3 sm:p-4 border border-yellow-600">
      <h2 className="text-sm sm:text-base md:text-lg font-bold text-yellow-300 mb-2 sm:mb-3 text-center">
        ランキング
      </h2>
      
      {shouldShowSubmit && !showSubmit && (
        <div className="mb-3 text-center">
          <button
            onClick={() => setShowSubmit(true)}
            className="px-3 py-1 text-xs sm:text-sm bg-yellow-500 hover:bg-yellow-400 text-white rounded-lg font-game transition-colors"
          >
            スコアを送信する
          </button>
        </div>
      )}

      {showSubmit && (
        <div className="mb-3 p-2 bg-yellow-900/30 rounded-lg">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="名前を入力"
            maxLength={20}
            className="w-full px-2 py-1 text-sm bg-black/50 text-white rounded border border-yellow-600 focus:outline-none focus:border-yellow-400"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                submitScore();
              }
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={submitScore}
              disabled={!playerName.trim() || loading}
              className="flex-1 px-2 py-1 text-xs sm:text-sm bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-game transition-colors"
            >
              {loading ? '送信中...' : '送信'}
            </button>
            <button
              onClick={() => {
                setShowSubmit(false);
                setPlayerName('');
              }}
              className="px-2 py-1 text-xs sm:text-sm bg-gray-600 hover:bg-gray-500 text-white rounded font-game transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div className="mb-3 text-center text-green-400 text-xs sm:text-sm font-bold">
          送信完了！
        </div>
      )}

      <div className="space-y-1 max-h-48 sm:max-h-64 overflow-y-auto">
        {rankings.length === 0 ? (
          <div className="text-center text-gray-400 text-xs sm:text-sm py-4">
            まだランキングがありません
          </div>
        ) : (
          rankings.map((entry, index) => (
            <div
              key={`${entry.timestamp}-${index}`}
              className="flex justify-between items-center px-2 py-1 bg-black/30 rounded text-xs sm:text-sm"
            >
              <span className="text-yellow-300 font-bold w-6 sm:w-8">
                {index + 1}位
              </span>
              <span className="text-white flex-1 text-center truncate mx-2">
                {entry.name}
              </span>
              <span className="text-yellow-400 font-game">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 text-center">
        <button
          onClick={loadRankings}
          className="text-xs text-yellow-300 hover:text-yellow-200 underline"
        >
          更新
        </button>
      </div>
    </div>
  );
};

export default Ranking;

