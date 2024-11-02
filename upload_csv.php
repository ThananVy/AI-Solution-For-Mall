<!-- kom plex save this file in the xampp folder. Example:C:\xampp\htdocs\AI_project.  -->
<?php
$conn = new mysqli("localhost", "root", "", "facial_detection_db");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$directory = "C:/Users/Thanan/Desktop/AI project/Gender,Age,Emotion_JS/Detection_result";
$files = glob($directory . "/*.csv");

foreach ($files as $file) {
    $handle = fopen($file, "r");
    if ($handle !== FALSE) {
        fgetcsv($handle); // Skip header row if present
        while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            $age = $data[0];
            $gender = $data[1];
            $emotion = $data[2];

            $sql = "INSERT INTO facial_data (age, gender, emotion) VALUES ('$age', '$gender', '$emotion')";
            if (!$conn->query($sql)) {
                echo "Error: " . $conn->error;
            }
        }
        fclose($handle);
        // Move processed files to a "processed" folder, if desired
        rename($file, $directory . "/processed/" . basename($file));
    }
}

if ($conn->query($sql)) {
    echo "Data inserted successfully for age: $age, gender: $gender, emotion: $emotion<br>";
} else {
    echo "Error: " . $conn->error . "<br>";
}

$conn->close();
?>
