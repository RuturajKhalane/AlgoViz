document.getElementById("analyzeButton").addEventListener("click", function () {
    // Get user input
    const userInput = document.getElementById("userArray").value.trim();
    const array = userInput.split(",").map(Number);

    // Validate input
    if (array.length === 0) {
        alert("Please enter a non-empty array!");
        return;
    }
    if (array.some(isNaN)) {
        alert("Please enter a valid array of numbers!");
        return;
    }

    // Initialize variables
    let recommendation = "";
    let analysis = "";

    // Helper Functions
    const isSorted = array.every((val, i, arr) => i === 0 || arr[i - 1] <= val);
    const isReverseSorted = array.every((val, i, arr) => i === 0 || arr[i - 1] >= val);

    const isNearlySorted = () => {
        const sortedArray = [...array].sort((a, b) => a - b);
        let k = 0;
        for (let i = 0; i < array.length; i++) {
            if (Math.abs(sortedArray.indexOf(array[i]) - i) > k) {
                k = Math.abs(sortedArray.indexOf(array[i]) - i);
            }
        }
        return k <= Math.ceil(array.length * 0.1); // Define "nearly sorted" as max 10% displacement
    };

    // Analysis Logic
    if (array.length === 1) {
        analysis = "The array contains only one element.";
        recommendation = "No sorting required.";
    } else if (isSorted) {
        analysis = "The array is already sorted.";
        recommendation = "No sorting required.";
    } else if (isReverseSorted) {
        analysis = "The array is reverse sorted.";
        recommendation = "Reverse the array and use Merge Sort for efficiency.";
    } else if (isNearlySorted()) {
        analysis = "The array is nearly sorted.";
        recommendation = "Use Insertion Sort or a Heap-based sorting algorithm for efficiency.";
    } else {
        analysis = "The array appears to be random.";
        recommendation = "Use Quick Sort for large arrays or Merge Sort for stable sorting.";
    }

    // Display Results
    const resultDiv = document.getElementById("analysisResult");
    resultDiv.innerHTML = `
        <p><strong>Analysis:</strong> ${analysis}</p>
        <p><strong>Recommended Algorithm:</strong> ${recommendation}</p>
    `;
    resultDiv.style.display = "block";
});
