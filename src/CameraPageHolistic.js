import React, {useRef, useEffect, useState, Fragment} from "react";
import Webcam from "react-webcam";
import {Holistic, POSE_LANDMARKS} from "@mediapipe/holistic/holistic";
import {Camera} from "@mediapipe/camera_utils/camera_utils";
import {Link} from "react-router-dom";

function CameraPageHolistic() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [elbowAngleLeft, setElbowAngleLeft] = useState(0);
    const [elbowAngleRight, setElbowAngleRight] = useState(0);

    useEffect(() => {
        const holistic = new Holistic({
            locateFile: (file) => {
                console.log(`${file}`);
                return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
            },
        });
        holistic.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
        holistic.onResults(onResults);
        if (
            typeof webcamRef.current !== "undefined" && webcamRef.current !== null
        ) {
            const camera = new Camera(webcamRef.current.video, {
                onFrame: async () => {
                    await holistic.send({image: webcamRef.current.video});
                },
                width: window.innerWidth,
                height: window.innerHeight,
            });
            camera.start();
        }
    }, []);

    const removeElements = (landmarks, elements) => {
        for (const element of elements) {
            delete landmarks[element];
        }
    };

    const removeLandmarks = (results) => {
        if (results.poseLandmarks) {
            removeElements(
                results.poseLandmarks,
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22]
            );
        }
    };

    function calculateAngle(x1, y1, x2, y2, x3, y3) {
        const vector1 = {x: x1 - x2, y: y1 - y2};
        const vector2 = {x: x3 - x2, y: y3 - y2};

        const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
        const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
        const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

        const cosineTheta = dotProduct / (magnitude1 * magnitude2);
        const angleRadians = Math.acos(cosineTheta);
        const angleDegrees = (angleRadians * 180) / Math.PI;

        return angleDegrees;
    }

    const connect = (ctx, connectors) => {
        const canvas = ctx.canvas;
        for (const connector of connectors) {
            const from = connector[0];
            const to = connector[1];
            if (from && to) {
                if (
                    from.visibility &&
                    to.visibility &&
                    (from.visibility < 0.1 || to.visibility < 0.1)
                ) {
                    continue;
                }
                ctx.beginPath();
                ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
                ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
                ctx.stroke();
            }
        }
    };

    const drawHandLandmark = (ctx, videoWidth, videoHeight, poseLandmarks, handLandmarks, elbowIndex, wristIndex) => {
        if (handLandmarks) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            connect(ctx, [[poseLandmarks[elbowIndex], handLandmarks[0]]]);
            const wristX = handLandmarks[0].x * videoWidth;
            const wristY = handLandmarks[0].y * videoHeight;
            ctx.beginPath();
            ctx.arc(wristX, wristY, 3, 0, 2 * Math.PI);
            ctx.fillStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.fill();
        }
    };

    const drawElbowAndShoulder = (ctx, videoWidth, videoHeight, poseLandmarks, elbowIndex, shoulderIndex) => {
        if (poseLandmarks) {
            const elbowX = poseLandmarks[elbowIndex].x * videoWidth;
            const elbowY = poseLandmarks[elbowIndex].y * videoHeight;
            const shoulderX = poseLandmarks[shoulderIndex].x * videoWidth;
            const shoulderY = poseLandmarks[shoulderIndex].y * videoHeight;

            ctx.beginPath();
            ctx.arc(elbowX, elbowY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'blue';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(shoulderX, shoulderY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = 'yellow';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(elbowX, elbowY);
            ctx.lineTo(shoulderX, shoulderY);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    };

    const onResults = (results) => {
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext("2d");
        removeLandmarks(results);
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, videoWidth, videoHeight);

        canvasCtx.translate(videoWidth, 0);
        canvasCtx.scale(-1, 1);
        canvasCtx.drawImage(
            results.image,
            0,
            0,
            canvasElement.width,
            canvasElement.height
        );
        canvasCtx.lineWidth = 5;

        drawHandLandmark(canvasCtx, videoWidth, videoHeight, results.poseLandmarks, results.leftHandLandmarks, POSE_LANDMARKS.LEFT_ELBOW, 0);
        drawHandLandmark(canvasCtx, videoWidth, videoHeight, results.poseLandmarks, results.rightHandLandmarks, POSE_LANDMARKS.RIGHT_ELBOW, 0);

        drawElbowAndShoulder(canvasCtx, videoWidth, videoHeight, results.poseLandmarks, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_SHOULDER);
        drawElbowAndShoulder(canvasCtx, videoWidth, videoHeight, results.poseLandmarks, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_SHOULDER);

        if (results.poseLandmarks && results.leftHandLandmarks) {
            const leftElbowX = results.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW].x * videoWidth;
            const leftElbowY = results.poseLandmarks[POSE_LANDMARKS.LEFT_ELBOW].y * videoHeight;
            const leftWristX = results.leftHandLandmarks[0].x * videoWidth;
            const leftWristY = results.leftHandLandmarks[0].y * videoHeight;
            const leftShoulderX = results.poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER].x * videoWidth;
            const leftShoulderY = results.poseLandmarks[POSE_LANDMARKS.LEFT_SHOULDER].y * videoHeight;

            const angle = calculateAngle(leftWristX, leftWristY, leftElbowX, leftElbowY, leftShoulderX, leftShoulderY);
            setElbowAngleLeft(angle);
        }
        if (results.poseLandmarks && results.rightHandLandmarks) {
            const rightElbowX = results.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW].x * videoWidth;
            const rightElbowY = results.poseLandmarks[POSE_LANDMARKS.RIGHT_ELBOW].y * videoHeight;
            const rightWristX = results.rightHandLandmarks[0].x * videoWidth;
            const rightWristY = results.rightHandLandmarks[0].y * videoHeight;
            const rightShoulderX = results.poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER].x * videoWidth;
            const rightShoulderY = results.poseLandmarks[POSE_LANDMARKS.RIGHT_SHOULDER].y * videoHeight;

            const rightElbowAngle = calculateAngle(rightWristX, rightWristY, rightElbowX, rightElbowY, rightShoulderX, rightShoulderY);
            setElbowAngleRight(rightElbowAngle);
        }
    };

    const handleBackButtonClick = () => {
        if (webcamRef.current && webcamRef.current.video) {
            const videoElement = webcamRef.current.video;
            if (videoElement.srcObject) {
                const stream = videoElement.srcObject;
                const tracks = stream.getTracks();

                tracks.forEach((track) => {
                    track.stop();
                });

                videoElement.srcObject = null;
            }
        }
    };

    const videoStyles = {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 1,
        width: '100%',
        height: '100%',
    };

    const canvasStyles = {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 2,
        width: '100%',
        height: '100%',
    };
    return (
        <div className='containerCamera'>
            <div className='cameraWrapper'>
                <Webcam
                    audio={false}
                    mirrored={true}
                    ref={webcamRef}
                    style={videoStyles}
                />
                <canvas
                    ref={canvasRef}
                    style={canvasStyles}
                ></canvas>
                <div className='infoCamera'>
                    <div>
                        Радиус левого локтя: {elbowAngleLeft.toFixed(2)}
                    </div>
                    <div>
                        Радиус правого локтя: {elbowAngleRight.toFixed(2)}
                    </div>
                </div>
                <div className='buttonCamera'>
                    <Link to="/" onClick={handleBackButtonClick}>Назад</Link>
                </div>
            </div>
        </div>
    );
};

export default CameraPageHolistic;
