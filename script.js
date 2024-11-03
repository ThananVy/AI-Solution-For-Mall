const video = document.getElementById("video");
const terminal = document.getElementById("terminal");
const saveCsvButton = document.getElementById("saveCsv");
let detectionData = []; // Array to hold data for CSV
let lastDetectionTime = 0;

const THREE_SECONDS = 3000;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
]).then(webCam);

function webCam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.log(error);
    });
}

function aggregateData() {
  const emotionCounts = {};
  const ageCounts = {};

  detectionData.forEach((entry) => {
    // Count emotions
    const expression = entry.expression;
    if (emotionCounts[expression]) {
      emotionCounts[expression]++;
    } else {
      emotionCounts[expression] = 1;
    }

    // Count age groups
    const ageGroup = Math.floor(entry.age / 10) * 10; // Group ages into decades
    if (ageCounts[ageGroup]) {
      ageCounts[ageGroup]++;
    } else {
      ageCounts[ageGroup] = 1;
    }
  });

  return { emotionCounts, ageCounts };
}

// function createEmotionChart(emotionCounts) {
//   const ctx = document.getElementById("emotionChart").getContext("2d");
//   const labels = Object.keys(emotionCounts);
//   const data = Object.values(emotionCounts);

//   new Chart(ctx, {
//     type: "bar",
//     data: {
//       labels: labels,
//       datasets: [
//         {
//           label: "Emotion Counts",
//           data: data,
//           backgroundColor: "rgba(75, 192, 192, 0.2)",
//           borderColor: "rgba(75, 192, 192, 1)",
//           borderWidth: 1,
//         },
//       ],
//     },
//     options: {
//       scales: {
//         y: {
//           beginAtZero: true,
//         },
//       },
//     },
//   });
// }

video.addEventListener("play", () => {
  const canvas = document.getElementById("canvas"); // Access the canvas from HTML
  faceapi.matchDimensions(canvas, { height: video.height, width: video.width });

  setInterval(async () => {
    const detection = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas for next draw

    const resizedWindow = faceapi.resizeResults(detection, {
      height: video.height,
      width: video.width,
    });

    faceapi.draw.drawDetections(canvas, resizedWindow);
    faceapi.draw.drawFaceLandmarks(canvas, resizedWindow);
    faceapi.draw.drawFaceExpressions(canvas, resizedWindow);

    let terminalOutput = "";
    const currentTime = Date.now();

    resizedWindow.forEach((detection, index) => {
      const { age, gender, expressions } = detection;
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: Math.round(age) + " year old " + gender,
      });
      drawBox.draw(canvas);

      // Display data in terminal form
      terminalOutput += `Face ${index + 1}: ${Math.round(age)} years old, ${gender}, ` +
        `Expression: ${getDominantExpression(expressions)}\n`;

      // Store detection data every 3 seconds
      if (currentTime - lastDetectionTime >= THREE_SECONDS) {
        detectionData.push({
          age: Math.round(age),
          gender: gender,
          expression: getDominantExpression(expressions),
        });
        lastDetectionTime = currentTime;
      }
    });

    terminal.textContent = terminalOutput;
  }, 100);
});

saveCsvButton.addEventListener("click", () => {
  saveCSV();
  const { emotionCounts } = aggregateData();
  createEmotionChart(emotionCounts);
});

function getDominantExpression(expressions) {
  return Object.keys(expressions).reduce((a, b) =>
    expressions[a] > expressions[b] ? a : b
  );
}

function saveCSV() {
  let csvContent = "";
  detectionData.forEach((row) => {
    csvContent += `${row.age},${row.gender},${row.expression}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "detection_data.csv");
}
