// App.tsx
import React, { useState } from "react";
import Controls from "./components/Controls";
import FaceDetector from "./components/FaceDetector";
import { useFaceApiModels } from "./hooks/useFaceApiModels";

const App: React.FC = () => {
  const { isModelLoaded, error, debugInfo, setDebugInfo } = useFaceApiModels();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoInfo, setVideoInfo] = useState<string>("");
  const [detectorType, setDetectorType] = useState<"tiny" | "ssd">("ssd");
  const [showDebug, setShowDebug] = useState(false);

  const orangeImgPath = "/orange.jpg";

  const startCamera = async () => {
    if (!isModelLoaded) {
      setDebugInfo("顔認識モデルがまだ読み込まれていません。");
      return;
    }
    try {
      setDebugInfo("カメラを起動中...");
      const constraints = {
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);
      setIsCameraActive(true);

      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const settings = videoTracks[0].getSettings();
        setVideoInfo(
          `カメラ: ${videoTracks[0].label || "不明"}\n解像度: ${
            settings.width
          }x${settings.height}\nフレームレート: ${
            settings.frameRate || "不明"
          }fps`
        );
      }
      setDebugInfo("カメラの起動に成功しました");
    } catch (err) {
      console.error("Failed to access camera:", err);
      setDebugInfo(`カメラエラー: ${err}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
      setVideoInfo("");
      setDebugInfo("カメラを停止しました");
    }
  };

  const saveImage = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.download = "orange-face.png";
      link.href = (canvas as HTMLCanvasElement).toDataURL("image/png");
      link.click();
    }
  };

  const handleDetectorChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDetectorType(event.target.value as "tiny" | "ssd");
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 py-8 px-4">
      <h1 className="text-3xl font-bold text-orange-500 mb-6">Orange Face</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}

      {showDebug && (
        <div className="w-full max-w-xl mb-4 bg-gray-800 border-l-4 border-gray-600 text-gray-200 p-4 rounded font-mono text-sm">
          <h2 className="font-bold mb-2">デバッグ情報:</h2>
          <pre>{debugInfo}</pre>
        </div>
      )}

      <Controls
        isCameraActive={isCameraActive}
        isModelLoaded={isModelLoaded}
        availableCamerasLength={1}
        videoInfo={videoInfo}
        detectorType={detectorType}
        showDebug={showDebug}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onSaveImage={saveImage}
        onToggleDebug={toggleDebug}
        onDetectorChange={handleDetectorChange}
      />
      {isCameraActive && (
        <FaceDetector
          isCameraActive={isCameraActive}
          stream={stream}
          detectorType={detectorType}
          showDebug={showDebug}
          setDebugInfo={setDebugInfo}
          orangeImgPath={orangeImgPath}
          videoInfoCallback={setVideoInfo}
        />
      )}

      <div className="text-sm text-gray-600 max-w-md text-center">
        <p>※ このアプリはあなたの顔データをサーバーに送信しません。</p>
        <p>すべての処理はあなたのデバイス上で行われます。</p>
      </div>
    </div>
  );
};

export default App;
