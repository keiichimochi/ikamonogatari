import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RankingEntry {
  name: string;
  score: number;
  timestamp: number;
}

// メモリ内にランキングを保存（VercelのServerless Functionsはステートレスなので、
// 実際の運用では外部データベース（Vercel KV、PostgreSQLなど）を使うことを推奨）
// この実装は簡易版として動作しますが、複数のインスタンス間でデータが共有されません
let rankings: RankingEntry[] = [];

// 最大ランキング数
const MAX_RANKINGS = 100;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // CORS設定
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method === 'GET') {
    // ランキングを取得（スコアの降順でソート）
    const sortedRankings = [...rankings]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RANKINGS);
    
    return response.status(200).json(sortedRankings);
  }

  if (request.method === 'POST') {
    const { name, score } = request.body;

    // バリデーション
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return response.status(400).json({ error: '名前が必要です' });
    }

    if (typeof score !== 'number' || score < 0) {
      return response.status(400).json({ error: '有効なスコアが必要です' });
    }

    // 名前の長さ制限
    const trimmedName = name.trim().slice(0, 20);

    // 新しいエントリを追加
    const newEntry: RankingEntry = {
      name: trimmedName,
      score: Math.floor(score),
      timestamp: Date.now(),
    };

    rankings.push(newEntry);

    // スコアの降順でソート
    rankings.sort((a, b) => b.score - a.score);

    // 最大数を超えたら古いものを削除
    if (rankings.length > MAX_RANKINGS) {
      rankings = rankings.slice(0, MAX_RANKINGS);
    }

    return response.status(200).json({ success: true, entry: newEntry });
  }

  return response.status(405).json({ error: 'Method not allowed' });
}


