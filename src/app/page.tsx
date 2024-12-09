"use client";
import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs"; // Load TensorFlow.js

const Home = () => {
  const [model, setModel] = useState<any>(null);
  const webcamRef = useRef<Webcam | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    // Load the COCO-SSD model when the component mounts
    const loadModel = async () => {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };

    loadModel();
  }, []);

  const captureAndDetectObjects = async () => {
    if (model && webcamRef.current) {
      const video = webcamRef.current.video;
      const predictions = await model.detect(video);
      setPredictions(predictions);
      drawBoundingBoxes(predictions);
    }
  };

  // Use requestAnimationFrame for smoother detection and better performance
  useEffect(() => {
    if (model) {
      const detectObjects = () => {
        captureAndDetectObjects();
        requestAnimationFrame(detectObjects); // Keep calling detectObjects recursively
      };
      detectObjects(); // Start detecting objects

      // Clean up on component unmount
      return () => cancelAnimationFrame(detectObjects as unknown as number);
    }
  }, [model]);

  const drawBoundingBoxes = (predictions: any[]) => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvas?.getContext("2d");
    const video = webcamRef.current?.video;

    if (!context || !video) return;

    // Log predictions to debug
    console.log("Predictions: ", predictions);

    // Ensure canvas is the correct size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      context.beginPath();
      context.rect(x, y, width, height);
      context.lineWidth = 4;
      context.strokeStyle = "red";
      context.fillStyle = "red";
      context.stroke();
      context.fillText(
        `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );
    });
  };

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <h1>Object Detection with TensorFlow.js & React Webcam</h1>
      <div>
        {/* Webcam Feed */}
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width="100%"
          videoConstraints={{
            facingMode: "environment",
          }}
        />
        {/* Draw bounding boxes on canvas */}
        {predictions.length > 0 && (
          <canvas
            id="canvas"
            className="absolute top-6 left-0 pointer-events-none w-full"
          />
        )}
      </div>
      {/* Display Predictions */}
      {predictions.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Detected Objects:</h3>
          <ul>
            {predictions.map((prediction, index) => (
              <li key={index}>
                {prediction.class} - Confidence:{" "}
                {Math.round(prediction.score * 100)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Home;
