import React, { useState } from 'react';

interface StampProps {
  stampUrl: string;
  onClose: () => void;
}

const STAMPS = [
  '/images/stamp/noテキーラ.png',
  '/images/stamp/イカはおやつ.png',
  '/images/stamp/とりあえずイカ.png',
  '/images/stamp/問題ねぇ.png',
  '/images/stamp/おでん屋で.png',
  '/images/stamp/お好み.png',
  '/images/stamp/くっきんぐ.png',
  '/images/stamp/チャイヨー.png',
  '/images/stamp/晩酌やで.png',
];

const StampModal: React.FC<StampProps> = ({ stampUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  // 画像をダウンロード
  const handleDownload = async () => {
    try {
      const response = await fetch(stampUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = stampUrl.split('/').pop() || 'stamp.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download stamp:', error);
    }
  };

  // 画像をクリップボードにコピー
  const handleCopy = async () => {
    try {
      const response = await fetch(stampUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy stamp:', error);
      // フォールバック: 画像URLをテキストとしてコピー
      try {
        await navigator.clipboard.writeText(window.location.origin + stampUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 border-4 border-yellow-400 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-game text-yellow-300 mb-2">
            スタンプ獲得！
          </h2>
          <p className="text-sm sm:text-base text-white">
            最高得点を更新しました！
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <img
            src={stampUrl}
            alt="スタンプ"
            className="max-w-full h-auto max-h-64 rounded-lg border-2 border-yellow-400 shadow-lg"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-400 text-white rounded-lg font-game transition-colors text-sm sm:text-base"
          >
            📥 保存
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-game transition-colors text-sm sm:text-base"
          >
            {copied ? '✅ コピー済み' : '📋 コピー'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-game transition-colors text-sm sm:text-base"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default StampModal;
export { STAMPS };

