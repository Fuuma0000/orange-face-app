// src/components/FaceDetector.tsx
import React, { useEffect, useRef } from "react";
import * as faceapi from "@vladmandic/face-api";

interface FaceDetectorProps {
  isCameraActive: boolean;
  stream: MediaStream | null;
  detectorType: "tiny" | "ssd";
  showDebug: boolean;
  setDebugInfo: (info: string) => void;
  orangeImgPath: string;
  videoInfoCallback?: (info: string) => void;
}

const FaceDetector: React.FC<FaceDetectorProps> = ({
  isCameraActive,
  stream,
  detectorType,
  showDebug,
  setDebugInfo,
  orangeImgPath,
  videoInfoCallback,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let animationId: number;

    const orange = new Image();
    orange.src = orangeImgPath;
    orange.onload = () => {
      setDebugInfo("オレンジ画像の読み込みに成功しました");
    };
    orange.onerror = (e) => {
      setDebugInfo(`オレンジ画像の読み込みに失敗しました: ${e}`);
    };

    // 目の輪郭に余白を追加するための関数
    const addPaddingToPoints = (
      points: { x: number; y: number }[],
      paddingFactor: number
    ) => {
      // 各点の重心を算出
      const center = points.reduce(
        (acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }),
        { x: 0, y: 0 }
      );
      center.x /= points.length;
      center.y /= points.length;
      // 重心から各点を指定倍率で外側に移動
      return points.map((pt) => ({
        x: center.x + (pt.x - center.x) * paddingFactor,
        y: center.y + (pt.y - center.y) * paddingFactor,
      }));
    };

    const detectFace = async () => {
      if (video.readyState === 4) {
        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          setDebugInfo(
            `キャンバスサイズを設定: ${canvas.width}x${canvas.height}`
          );
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (showDebug) {
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        } else {
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        try {
          let detections;
          if (detectorType === "tiny") {
            const options = new faceapi.TinyFaceDetectorOptions({
              scoreThreshold: 0.2,
              inputSize: 320,
            });
            const faceDetectionOnly = await faceapi.detectAllFaces(
              video,
              options
            );
            if (faceDetectionOnly.length > 0) {
              console.log("顔検出のみ成功:", faceDetectionOnly[0].score);
              setDebugInfo(
                `顔のみ検出: 信頼度=${faceDetectionOnly[0].score.toFixed(2)}`
              );
            } else {
              console.log("顔検出のみ: 検出なし");
              setDebugInfo("顔検出のみ: 検出なし");
            }
            detections = await faceapi
              .detectAllFaces(video, options)
              .withFaceLandmarks();
          } else {
            const options = new faceapi.SsdMobilenetv1Options({
              minConfidence: 0.1,
              maxResults: 1,
            });
            const faceDetectionOnly = await faceapi.detectAllFaces(
              video,
              options
            );
            if (faceDetectionOnly.length > 0) {
              console.log("顔検出のみ成功:", faceDetectionOnly[0].score);
              setDebugInfo(
                `顔のみ検出: 信頼度=${faceDetectionOnly[0].score.toFixed(2)}`
              );
            } else {
              console.log("顔検出のみ: 検出なし");
              setDebugInfo("顔検出のみ: 検出なし");
            }
            detections = await faceapi
              .detectAllFaces(video, options)
              .withFaceLandmarks();
          }

          console.log(
            "顔検出結果:",
            detections.length > 0 ? `${detections.length}人検出` : "検出なし"
          );

          if (detections.length > 0) {
            setDebugInfo(`顔検出成功: ${detections.length}人`);
            const detection = detections[0];
            const box = detection.detection.box;
            if (showDebug) {
              ctx.strokeStyle = "lime";
              ctx.lineWidth = 2;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
            }
            if (orange.complete) {
              const orangeSize = box.width * 1.5;
              const orangeX = box.x - (orangeSize - box.width) / 2;
              const orangeY = box.y - (orangeSize - box.height) / 2;
              ctx.drawImage(orange, orangeX, orangeY, orangeSize, orangeSize);
            }

            // ランドマーク描画
            if (detection.landmarks) {
              const landmarks = detection.landmarks;
              const leftEye = landmarks.getLeftEye();
              const rightEye = landmarks.getRightEye();
              const mouth = landmarks.getMouth();

              // デバッグモードなら目と口の各点を簡単な丸で描画
              if (showDebug) {
                ctx.fillStyle = "yellow";
                [...leftEye, ...rightEye].forEach((point) => {
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                  ctx.fill();
                });
                ctx.fillStyle = "cyan";
                mouth.forEach((point) => {
                  ctx.beginPath();
                  ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }

              // 左目の輪郭を描画（余白追加）
              {
                // 輪郭点の再配置（時計回りに）
                let startPointIndexLeft = 0;
                let lowestYLeft = leftEye[0].y;
                for (let i = 1; i < leftEye.length; i++) {
                  if (leftEye[i].y > lowestYLeft) {
                    lowestYLeft = leftEye[i].y;
                    startPointIndexLeft = i;
                  }
                }
                const reorderedLeftEye = [
                  ...leftEye.slice(startPointIndexLeft),
                  ...leftEye.slice(0, startPointIndexLeft),
                ];
                // 余白を追加（重心から外側に 1.2 倍）
                const paddedLeftEye = addPaddingToPoints(reorderedLeftEye, 1.8);

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(paddedLeftEye[0].x, paddedLeftEye[0].y);
                for (let i = 1; i < paddedLeftEye.length; i++) {
                  const p0 = paddedLeftEye[i - 1];
                  const p1 = paddedLeftEye[i];
                  const cp1x = p0.x + (p1.x - p0.x) / 3;
                  const cp1y = p0.y + (p1.y - p0.y) / 3;
                  const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
                  const cp2y = p0.y + (2 * (p1.y - p0.y)) / 3;
                  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
                }
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                ctx.restore();
              }

              // 右目の輪郭を描画（余白追加）
              {
                let startPointIndexRight = 0;
                let lowestYRight = rightEye[0].y;
                for (let i = 1; i < rightEye.length; i++) {
                  if (rightEye[i].y > lowestYRight) {
                    lowestYRight = rightEye[i].y;
                    startPointIndexRight = i;
                  }
                }
                const reorderedRightEye = [
                  ...rightEye.slice(startPointIndexRight),
                  ...rightEye.slice(0, startPointIndexRight),
                ];
                const paddedRightEye = addPaddingToPoints(
                  reorderedRightEye,
                  1.8
                );

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(paddedRightEye[0].x, paddedRightEye[0].y);
                for (let i = 1; i < paddedRightEye.length; i++) {
                  const p0 = paddedRightEye[i - 1];
                  const p1 = paddedRightEye[i];
                  const cp1x = p0.x + (p1.x - p0.x) / 3;
                  const cp1y = p0.y + (p1.y - p0.y) / 3;
                  const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
                  const cp2y = p0.y + (2 * (p1.y - p0.y)) / 3;
                  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
                }
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                ctx.restore();
              }

              // 口の輪郭描画（省略または元の処理をそのまま）
              {
                ctx.save();
                ctx.beginPath();
                const centerIndex = Math.floor(mouth.length / 2);
                const sortedMouth = [
                  ...mouth.slice(centerIndex),
                  ...mouth.slice(0, centerIndex),
                ];
                ctx.moveTo(sortedMouth[0].x, sortedMouth[0].y);
                for (let i = 1; i < sortedMouth.length; i++) {
                  const p1 = sortedMouth[i];
                  ctx.lineTo(p1.x, p1.y);
                }
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                ctx.restore();
              }
            } else {
              setDebugInfo("ランドマーク検出失敗");
            }

            if (showDebug) {
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
              ctx.fillRect(0, 0, 300, 80);
              ctx.fillStyle = "white";
              ctx.font = "12px Arial";
              ctx.fillText(
                `検出方法: ${
                  detectorType === "tiny" ? "TinyFaceDetector" : "SSD MobileNet"
                }`,
                10,
                20
              );
              ctx.fillText(
                `信頼度: ${detection.detection.score.toFixed(2)}`,
                10,
                40
              );
              ctx.fillText(
                `解像度: ${video.videoWidth}x${video.videoHeight}`,
                10,
                60
              );
            }
          } else {
            setDebugInfo("顔が検出されませんでした");
            if (showDebug) {
              ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
              ctx.fillRect(10, 10, 280, 30);
              ctx.font = "16px Arial";
              ctx.fillStyle = "white";
              ctx.fillText("顔が検出されていません", 20, 30);
            }
          }
        } catch (err) {
          console.error("顔検出エラー:", err);
          setDebugInfo(`顔検出エラー: ${err}`);
        }
      } else {
        console.log(`ビデオ準備状態: ${video.readyState}`);
        setDebugInfo(`ビデオ準備状態: ${video.readyState}`);
      }
      animationId = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [
    isCameraActive,
    detectorType,
    showDebug,
    setDebugInfo,
    orangeImgPath,
    videoInfoCallback,
  ]);

  return (
    <div className="relative w-full max-w-xl mb-4">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-1 h-1 opacity-0"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg shadow-lg"
          style={{ backgroundColor: "black" }}
        />
      </div>
    </div>
  );
};

export default FaceDetector;
