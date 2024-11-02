const video = document.getElementById('video');
const overlay = document.querySelector('.overlay');
const overlayContext = overlay.getContext('2d');

// Load face-api models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
    video.addEventListener('play', () => {
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(overlay, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            // Clear the overlay canvas before drawing new detections
            overlayContext.clearRect(0, 0, overlay.width, overlay.height);

            // Resize the detections to fit the video dimensions
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Draw the face detections and landmarks on the overlay
            faceapi.draw.drawDetections(overlay, resizedDetections);
            faceapi.draw.drawFaceLandmarks(overlay, resizedDetections);
            faceapi.draw.drawFaceExpressions(overlay, resizedDetections);
        }, 100);
    });
}
