document.getElementById("recommendButton").addEventListener("click", function () {
    // Get user input
    const arraySize = parseInt(document.getElementById("arraySize").value);
    const dataType = document.getElementById("dataType").value;
    const priority = document.getElementById("priority").value;

    let recommendation = "";

    // Recommendation Logic
    if (arraySize <= 10) {
        if (dataType === "sorted" || dataType === "nearlySorted") {
            recommendation = "Insertion Sort (Efficient for small, nearly sorted data)";
        } else {
            recommendation = "Bubble Sort (Simple and effective for small datasets)";
        }
    } else {
        if (priority === "stability") {
            recommendation = "Merge Sort (Stable and efficient for large datasets)";
        } else if (priority === "time") {
            if (dataType === "random" || dataType === "reverse") {
                recommendation = "Quick Sort (Fast for general purposes)";
            } else {
                recommendation = "Heap Sort (Efficient but not stable)";
            }
        }
    }

    // Display recommendation
    const recommendationDiv = document.getElementById("recommendation");
    recommendationDiv.textContent = recommendation;
    recommendationDiv.style.display = "block";
});
