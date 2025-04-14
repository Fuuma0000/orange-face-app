// src/hooks/useFaceApiModels.ts
import { useState, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";

export const useFaceApiModels = () => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const loadModels = async () => {
      try {
        setDebugInfo("モデルをロード中...");
        const MODEL_URL = "https://vladmandic.github.io/face-api/model/";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setIsModelLoaded(true);
        setDebugInfo("モデルのロードに成功しました");
      } catch (err) {
        console.error("Failed to load models:", err);
        setError("顔認識モデルの読み込みに失敗しました。");
        setDebugInfo(`モデルロードエラー: ${err}`);
      }
    };

    loadModels();
  }, []);

  return { isModelLoaded, error, debugInfo, setDebugInfo };
};
