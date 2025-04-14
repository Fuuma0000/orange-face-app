// src/components/Controls.tsx
import React from "react";

interface ControlsProps {
  isCameraActive: boolean;
  isModelLoaded: boolean;
  availableCamerasLength: number;
  videoInfo: string;
  detectorType: "tiny" | "ssd";
  showDebug: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSaveImage: () => void;
  onToggleDebug: () => void;
  onDetectorChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Controls: React.FC<ControlsProps> = ({
  isCameraActive,
  isModelLoaded,
  availableCamerasLength,
  videoInfo,
  detectorType,
  showDebug,
  onStartCamera,
  onStopCamera,
  onSaveImage,
  onToggleDebug,
  onDetectorChange,
}) => {
  return (
    <div className="flex flex-col items-center bg-gray-100 py-8 px-4">
      {/* 設定パネル */}
      <div className="w-full max-w-xl mb-4 bg-white rounded-lg shadow-md p-4">
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            検出方法を選択:
          </label>
          <select
            value={detectorType}
            onChange={onDetectorChange}
            className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="tiny">TinyFaceDetector（軽量・高速）</option>
            <option value="ssd">SSD MobileNet（精度重視）</option>
          </select>
        </div>
      </div>

      {/* カメラ情報表示 */}
      {videoInfo && showDebug && (
        <div className="w-full max-w-xl mb-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
          <h2 className="font-bold mb-2">カメラ情報:</h2>
          <pre className="whitespace-pre-wrap">{videoInfo}</pre>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {!isCameraActive ? (
          <button
            onClick={onStartCamera}
            disabled={!isModelLoaded || availableCamerasLength === 0}
            className={`px-6 py-2 rounded-lg font-semibold text-white ${
              isModelLoaded && availableCamerasLength > 0
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-gray-400"
            }`}
          >
            {isModelLoaded ? "カメラを起動" : "モデル読み込み中..."}
          </button>
        ) : (
          <button
            onClick={onStopCamera}
            className="px-6 py-2 rounded-lg bg-red-500 hover:bg-red-600 font-semibold text-white"
          >
            停止
          </button>
        )}

        {isCameraActive && (
          <>
            <button
              onClick={onSaveImage}
              className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 font-semibold text-white"
            >
              画像を保存
            </button>

            <button
              onClick={onToggleDebug}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${
                showDebug
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              {showDebug ? "通常モード" : "デバッグモード"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Controls;
