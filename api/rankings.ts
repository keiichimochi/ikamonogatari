import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

interface RankingEntry {
  name: string;
  score: number;
  timestamp: number;
}

// Vercel KVのキー
const RANKINGS_KEY = 'ikamonogatari:rankings';

// 最大ランキング数
const MAX_RANKINGS = 100;

// ランキングを取得
async function getRankings(): Promise<RankingEntry[]> {
  try {
    const rankings = await kv.get<RankingEntry[]>(RANKINGS_KEY);
    return rankings || [];
  } catch (error) {
    console.error('Error fetching rankings from KV:', error);
    return [];
  }
}

// ランキングを保存
async function saveRankings(rankings: RankingEntry[]): Promise<boolean> {
  try {
    await kv.set(RANKINGS_KEY, rankings);
    return true;
  } catch (error) {
    console.error('Error saving rankings to KV:', error);
    return false;
  }
}

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
    const rankings = await getRankings();
    const sortedRankings = rankings
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

    // 既存のランキングを取得
    const rankings = await getRankings();

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
      rankings.splice(MAX_RANKINGS);
    }

    // ランキングをVercel KVに保存
    const saved = await saveRankings(rankings);

    if (saved) {
      return response.status(200).json({ success: true, entry: newEntry });
    } else {
      return response.status(500).json({ error: 'ランキングの保存に失敗しました' });
    }
  }

  return response.status(405).json({ error: 'Method not allowed' });
}


