const generateButton = document.getElementById("generateArray");
const arrayContainer = document.getElementById("arrayContainer");
const arraySizeSlider = document.getElementById("arraySize");
const arraySizeLabel = document.getElementById("arraySizeLabel");
const darkModeToggle = document.getElementById("darkModeToggle");
const algorithmSelect = document.getElementById("algorithmSelect");
const generateNearlySortedArrayButton = document.getElementById("generateNearlySortedArray");
const bestCaseButton = document.getElementById("bestCaseButton");
const worstCaseButton = document.getElementById("worstCaseButton");
const algorithmDetailsBox = document.getElementById("algorithmDetailsBox");
const algorithmDetails = document.getElementById("algorithmDetails");
const algorithmStepDisplay = document.getElementById("algorithmStepDisplay");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const speedSlider = document.getElementById("speedSlider");
const speedLabel = document.getElementById("speedLabel");
const showInfoButton = document.getElementById("showInfoButton");
const additionalInfo = document.getElementById("additionalInfo");
const swapsInfo = document.getElementById("swapsInfo");
const loopRunsInfo = document.getElementById("loopRunsInfo");
const complexityInfo = document.getElementById("complexityInfo");
const executionTimeInfo = document.getElementById("executionTimeInfo");

// Timeline control buttons
const prevStepButton = document.getElementById("prevStepButton");
const nextStepButton = document.getElementById("nextStepButton");
const prevIterationButton = document.getElementById("prevIterationButton");
const nextIterationButton = document.getElementById("nextIterationButton");

let currentArray = []; // Store the current array to avoid generating a new one after each click
let steps = [];
let currentStep = 0;
let isStarted = false; // Track if sorting has started
let isPaused = false;
let sortingSpeed = parseInt(speedSlider.value);
let totalSwaps = 0;
let totalLoopRuns = 0;
let outerLoopRuns = 0;
let interval;

// Tooltip element
const tooltip = document.createElement("div");
tooltip.classList.add("tooltip");
document.body.appendChild(tooltip);

// Array size slider
arraySizeSlider.addEventListener("input", () => {
    arraySizeLabel.textContent = `Array Size: ${arraySizeSlider.value}`;
});

// Speed Slider
speedSlider.addEventListener("input", () => {
    sortingSpeed = 1000 - parseInt(speedSlider.value);
    speedLabel.textContent = `${sortingSpeed}ms`;
});

// Event listener for the generate button
generateButton.addEventListener("click", () => {
    const arraySize = parseInt(arraySizeSlider.value);
    currentArray = generateRandomArray(arraySize);
    // document.documentElement.style.setProperty('--array-size', arraySize);
    renderArray(currentArray); // Render the array as bars
    currentStep = 0; // Reset the current step
    isStarted = false; // Mark sorting as not started yet
    isPaused = false; // Mark sorting as not paused yet
    pauseButton.disabled = true; // Disable pause button initially
    startButton.disabled = false; // Enable the start button
    clearInterval(interval); // Ensure any previous interval is cleared
    pauseButton.textContent = "Pause"; // Reset pause button text
});

// Event listener for the dark mode toggle button
// darkModeToggle.addEventListener("click", () => {
//     document.body.classList.toggle("dark-mode");
// });

// Display algorithm details when a selection changes
algorithmSelect.addEventListener("change", () => {
    const selectedAlgorithm = algorithmSelect.value;
    displayAlgorithmDetails(selectedAlgorithm);
});

// Toggle additional info visibility
showInfoButton.addEventListener("click", () => {
    if (additionalInfo.style.display === "none") {
        additionalInfo.style.display = "block";
        showInfoButton.textContent = "Hide Additional Info";
    } else {
        additionalInfo.style.display = "none";
        showInfoButton.textContent = "Show Additional Info";
    }
});

startButton.addEventListener("click", () => {
    if (!isStarted) {
        startVisualization();
    }
});

pauseButton.addEventListener("click", () => {
    if (isPaused) {
        isPaused = false;
        pauseButton.textContent = "Pause"; 
        startVisualization(); // Resume visualization by reinitializing interval
    } else {
        isPaused = true;
        pauseButton.textContent = "Resume";
        clearInterval(interval); // Stop the interval temporarily
    }
});

        
// Navigate to previous/next step
prevStepButton.addEventListener("click", () => {
    if (!isStarted || steps.length === 0) return; // Prevent action if sorting hasn't started
    if (currentStep > 0) currentStep--;
    updateVisualization(currentStep);
});

nextStepButton.addEventListener("click", () => {
    if (!isStarted || steps.length === 0) return; // Prevent action if sorting hasn't started
    if (currentStep < steps.length - 1) currentStep++;
    updateVisualization(currentStep);
});

// Navigate to previous/next iteration
prevIterationButton.addEventListener("click", () => {
    if (!isStarted || steps.length === 0) return; // Prevent action if sorting hasn't started
    const currentIteration = steps[currentStep].iteration || 0;
    const prevIterationIndex = steps.findIndex(s => s.iteration === currentIteration - 1);
    if (prevIterationIndex !== -1) {
        currentStep = prevIterationIndex;
        updateVisualization(currentStep);
    }
});

nextIterationButton.addEventListener("click", () => {
    if (!isStarted || steps.length === 0) return; // Prevent action if sorting hasn't started
    const currentIteration = steps[currentStep].iteration || 0;
    const nextIterationIndex = steps.findIndex(s => s.iteration === currentIteration + 1);
    if (nextIterationIndex !== -1) {
        currentStep = nextIterationIndex;
        updateVisualization(currentStep);
    }
});

function getSelectedAlgorithm() {
    console.log(algorithmSelect.value); // Debugging
    return algorithmSelect.value;
}


// export export export function to generate a random array with specified size
function generateRandomArray(size) {
    const array = [];
    for (let i = 0; i < size; i++) {
        array.push(Math.floor(Math.random() * 290) + 10);
    }
    return array;
}

// function to render the array
function renderArray(array, highlightIndexes = [], swapIndexes = [], currentBubbleIndex = -1) {
    arrayContainer.innerHTML = ""; // Clear existing bars

    array.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.classList.add("bar");
        bar.style.height = `${value}px`;
        bar.style.width = `${calcBarWidth(array.length)}px`;
        bar.style.left = `${index * (calcBarWidth(array.length) + 5)}px`; // Space between bars

        // Apply color schemes based on the current algorithm step
        if (highlightIndexes.includes(index)) {
            bar.classList.add("compared"); // Orange for compared bars
        }

        if (swapIndexes.includes(index)) {
            bar.classList.add("swapped"); // Green for swapped bars
        }

        if (index === currentBubbleIndex) {
            const symbol = document.createElement("div");
            symbol.classList.add("bar-symbol");
            symbol.textContent = "→"; // Arrow symbol for the current bubble
            bar.appendChild(symbol);
        }

        // Show tooltip on hover
        bar.addEventListener("mouseenter", () => {
            tooltip.style.visibility = "visible";
            tooltip.textContent = `Value: ${value}`;
        });

        bar.addEventListener("mousemove", (e) => {
            tooltip.style.top = `${e.clientY - 40}px`;
            tooltip.style.left = `${e.clientX + 10}px`;
        });

        bar.addEventListener("mouseleave", () => {
            tooltip.style.visibility = "hidden";
        });

        arrayContainer.appendChild(bar);
    });
}

// function to calculate the width of the bars based on the array size
function calcBarWidth(size) {
    return Math.max(30, (80 / size) * 100); // Ensures bar is never too small
}

// function to generate a worst-case array (reverse sorted)
function generateWorstCaseArray(size) {
    return generateRandomArray(size).sort((a, b) => b - a); 
}// Sort in descending o
// function to generate a best-case array (already sorted)
function generateBestCaseArray(size) {
    return generateRandomArray(size).sort((a, b) => a - b); // Sort in ascending order
}

// Event listener for the Nearly Sorted button
generateNearlySortedArrayButton.addEventListener("click", () => {
    const arraySize = parseInt(arraySizeSlider.value);
    currentArray = generateNearlySortedArray(arraySize);
    renderArray(currentArray); // Render the nearly sorted array
    resetVisualizationState();
});

// Event listener for the Worst Case button
worstCaseButton.addEventListener("click", () => {
    const arraySize = parseInt(arraySizeSlider.value);
    currentArray = generateWorstCaseArray(arraySize);
    renderArray(currentArray); // Render the worst-case array
    resetVisualizationState();
});

// Event listener for the Best Case button
bestCaseButton.addEventListener("click", () => {
    const arraySize = parseInt(arraySizeSlider.value);
    currentArray = generateBestCaseArray(arraySize);
    renderArray(currentArray); // Render the best-case array
    resetVisualizationState();
});


function resetVisualizationState() {
    currentStep = 0;
    isStarted = false;
    isPaused = false;
    pauseButton.disabled = true; // Disable pause button initially
    startButton.disabled = false; // Enable start button
    clearInterval(interval); // Stop any ongoing interval
    pauseButton.textContent = "Pause"; // Reset pause button text
    prevStepButton.disabled = true;
    nextStepButton.disabled = true;
    prevIterationButton.disabled = true;
    nextIterationButton.disabled = true;
}

function startVisualization() {

    const selectedAlgorithm = getSelectedAlgorithm(); 

    switch (selectedAlgorithm) {
        case "Bubble Sort":
            steps = bubbleSortWithSteps([...currentArray]);
            break;
        case "Insertion Sort":
            steps = insertionSortWithSteps([...currentArray]);
            break;
        case "Selection Sort":
           steps = selectionSortWithSteps([...currentArray]);
           break;
        case "Merge Sort":
           steps = mergeSortWithSteps([...currentArray]);
           break;
        case "Quick Sort":
            steps = quickSortWithSteps([...currentArray]);
            break;
        case "Count Sort":
            steps = countSortWithSteps([...currentArray]);
            break;
        default:
            console.error("Unknown algorithm selected!");
            return; // Exit if no valid algorithm is selected
    }

    currentStep = 0;
    renderArray(currentArray); // Initial rendering of the random array
    displayAlgorithmStep(steps[currentStep].description); // Display the first algorithm step

    // Enable control buttons and disable the Start button
    pauseButton.disabled = false;
    startButton.disabled = true;
    prevStepButton.disabled = false;
    nextStepButton.disabled = false;
    prevIterationButton.disabled = false;
    nextIterationButton.disabled = false;

    // Start visualization
    interval = setInterval(() => {
        if (currentStep < steps.length && !isPaused) {
            const { arrayState, highlightIndexes, swapIndexes, description } = steps[currentStep];
            renderArray(arrayState, highlightIndexes, swapIndexes, highlightIndexes[0]);
            displayAlgorithmStep(description);
            currentStep++;
        } else {
            clearInterval(interval); // Stop the interval once all steps are completed
            pauseButton.disabled = true; // Disable Pause button after completion
            startButton.disabled = false; // Enable Start button again
            isStarted = false; // Mark sorting as completed
        }
    }, sortingSpeed); // Adjust time for step delay

    isStarted = true; // Mark sorting as started
}



function updateVisualization(stepIndex) {
    const step = steps[stepIndex];
    renderArray(step.arrayState, step.highlightIndexes, step.swapIndexes, step.highlightIndexes[0]);
    displayAlgorithmStep(step.description);
    updateTimelineButtons(stepIndex);
}

function updateTimelineButtons(stepIndex) {
    prevStepButton.disabled = stepIndex === 0;
    nextStepButton.disabled = stepIndex === steps.length - 1;
    const currentIteration = steps[stepIndex]?.iteration || 0;
    prevIterationButton.disabled = steps.findIndex(s => s.iteration === currentIteration - 1) === -1;
    nextIterationButton.disabled = steps.findIndex(s => s.iteration === currentIteration + 1) === -1;
}


function bubbleSortWithSteps(array) {
    const steps = [];
    totalSwaps = 0; // Reset swap count
    totalLoopRuns = 0; // Reset total loop count
    outerLoopRuns = 0; // Reset outer loop count

    const startTime = performance.now(); // Start timing
    let swapped;
    for (let i = 0; i < array.length - 1; i++) {
        swapped = false;
        outerLoopRuns++;
        // let stepDescription = `Iteration ${i + 1}:`;
        for (let j = 0; j < array.length - 1 - i; j++) {
            // stepDescription += ` Compare element ${array[j]} with element ${array[j + 1]}.`;
            totalLoopRuns++;
            steps.push({
                arrayState: [...array],
                description: `Compare element ${array[j]} with element ${array[j + 1]}`,
                iteration: i,
                highlightIndexes: [j, j + 1],
                swapIndexes: []
            });
            

            if (array[j] > array[j + 1]) {
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
                totalSwaps++;
                swapped = true;
                steps.push({
                    arrayState: [...array],
                    description: `Swap element ${array[j]} with element ${array[j + 1]}`,
                    highlightIndexes: [],
                    swapIndexes: [j, j + 1]
                });
            }
             
        }
        // Store the current state of the array and the description
        if (!swapped) break;
    }
    const endTime = performance.now();
      // Display the additional info
      swapsInfo.textContent = `             Total Swaps: ${totalSwaps}`;
      loopRunsInfo.textContent = `          Inner Loop Runs: ${totalLoopRuns}, Outer Loop Runs: ${outerLoopRuns}`;
      complexityInfo.innerHTML = `
          Time Complexity: 
          <ol style="list-style-type: none;
    padding-left: 0;">
              <li>Best Case: O(n)</li>
              <li>Worst Case: O(n^2)</li>
              <li>Average Case: O(n^2)</li>
          </ol>
          Space Complexity: O(1)
      `;
      executionTimeInfo.textContent = `Execution Time: ${(endTime - startTime).toFixed(2)} ms`;
  
      return steps;
}

// Insertion Sort with steps
function insertionSortWithSteps(array) {
    const steps = [];
    totalSwaps = 0;
    totalLoopRuns = 0;
    outerLoopRuns = 0;

    const startTime = performance.now();

    for (let i = 1; i < array.length; i++) {
        outerLoopRuns++;
        let key = array[i];
        let j = i - 1;

        steps.push({
            arrayState: [...array],
            description: `Start insertion of ${key} at position ${i}`,
            iteration: i,
            highlightIndexes: [i],
            swapIndexes: []
        });

        while (j >= 0 && array[j] > key) {
            totalLoopRuns++;
            totalSwaps++;
            array[j + 1] = array[j];

            steps.push({
                arrayState: [...array],
                description: `Move ${array[j]} to position ${j + 1}`,
                iteration: i,
                highlightIndexes: [j, j + 1],
                swapIndexes: [j + 1]
            });

            j--;
        }
        array[j + 1] = key;

        steps.push({
            arrayState: [...array],
            description: `Place ${key} at position ${j + 1}`,
            iteration: i,
            highlightIndexes: [j + 1],
            swapIndexes: []
        });
    }

    const endTime = performance.now();

    swapsInfo.textContent = `Total Swaps: ${totalSwaps}`;
    loopRunsInfo.textContent = `Inner Loop Runs: ${totalLoopRuns}, Outer Loop Runs: ${outerLoopRuns}`;
    complexityInfo.innerHTML = `
        Time Complexity: 
        <ul>
            <li>Best Case: O(n)</li>
            <li>Worst Case: O(n²)</li>
            <li>Average Case: O(n²)</li>
        </ul>
        Space Complexity: O(1)
    `;
    executionTimeInfo.textContent = `Execution Time: ${(endTime - startTime).toFixed(2)} ms`;

    return steps;
}


function selectionSortWithSteps(array) {
    const steps = [];
    totalSwaps = 0;
    totalLoopRuns = 0;
    outerLoopRuns = 0;

    const startTime = performance.now();

    for (let i = 0; i < array.length - 1; i++) {
        let minIndex = i;
        outerLoopRuns++;

        steps.push({
            arrayState: [...array],
            description: `Start iteration ${i + 1}: Assume ${array[i]} at index ${i} is the minimum.`,
            iteration: i,
            highlightIndexes: [minIndex],
            swapIndexes: []
        });

        for (let j = i + 1; j < array.length; j++) {
            totalLoopRuns++;
            steps.push({
                arrayState: [...array],
                description: `Compare ${array[j]} at index ${j} with current minimum ${array[minIndex]} at index ${minIndex}.`,
                iteration: i,
                highlightIndexes: [j, minIndex],
                swapIndexes: []
            });

            if (array[j] < array[minIndex]) {
                minIndex = j;
                steps.push({
                    arrayState: [...array],
                    description: `New minimum found: ${array[minIndex]} at index ${minIndex}.`,
                    iteration: i,
                    highlightIndexes: [minIndex],
                    swapIndexes: []
                });
            }
        }

        if (minIndex !== i) {
            [array[i], array[minIndex]] = [array[minIndex], array[i]];
            totalSwaps++;
            steps.push({
                arrayState: [...array],
                description: `Swap ${array[minIndex]} at index ${minIndex} with ${array[i]} at index ${i}.`,
                iteration: i,
                highlightIndexes: [],
                swapIndexes: [i, minIndex]
            });
        } else {
            steps.push({
                arrayState: [...array],
                description: `No swap needed for this iteration.`,
                iteration: i,
                highlightIndexes: [],
                swapIndexes: []
            });
        }
    }

    const endTime = performance.now();

    // Update additional info
    swapsInfo.textContent = `Total Swaps: ${totalSwaps}`;
    loopRunsInfo.textContent = `Inner Loop Runs: ${totalLoopRuns}, Outer Loop Runs: ${outerLoopRuns}`;
    complexityInfo.innerHTML = `
        Time Complexity: 
        <ul>
            <li>Best Case: O(n^2)</li>
            <li>Worst Case: O(n^2)</li>
            <li>Average Case: O(n^2)</li>
        </ul>
        Space Complexity: O(1)
    `;
    executionTimeInfo.textContent = `Execution Time: ${(endTime - startTime).toFixed(2)} ms`;

    return steps;
}

function mergeSortWithSteps(array) {
    const steps = [];
    let totalMerges = 0;
    let totalComparisons = 0;
    let totalLoopRuns = 0;
    let outerLoopRuns = 0;

    const startTime = performance.now();

    // Helper function to perform merge sort recursively
    function mergeSortRecursive(arr, left, right) {
        if (left >= right) {
            return;
        }

        const mid = Math.floor((left + right) / 2);
        mergeSortRecursive(arr, left, mid);
        mergeSortRecursive(arr, mid + 1, right);

        merge(arr, left, mid, right);
    }

    // Merge function to combine two sorted halves
    function merge(arr, left, mid, right) {
        let leftArray = arr.slice(left, mid + 1);
        let rightArray = arr.slice(mid + 1, right + 1);
        let i = 0, j = 0, k = left;

        totalMerges++;

        // Description for merging the two sorted halves
        steps.push({
            arrayState: [...array],
            description: `Merge two sorted subarrays: ${leftArray} and ${rightArray}`,
            iteration: outerLoopRuns,
            highlightIndexes: [],
            swapIndexes: []
        });

        while (i < leftArray.length && j < rightArray.length) {
            totalLoopRuns++;
            totalComparisons++;

            steps.push({
                arrayState: [...array],
                description: `Compare ${leftArray[i]} (left) and ${rightArray[j]} (right).`,
                iteration: outerLoopRuns,
                highlightIndexes: [left + i, mid + 1 + j],
                swapIndexes: []
            });

            if (leftArray[i] <= rightArray[j]) {
                arr[k++] = leftArray[i++];
            } else {
                arr[k++] = rightArray[j++];
            }
        }

        // Copy any remaining elements from leftArray
        while (i < leftArray.length) {
            arr[k++] = leftArray[i++];
        }

        // Copy any remaining elements from rightArray
        while (j < rightArray.length) {
            arr[k++] = rightArray[j++];
        }

        // Update array and track the merged state
        steps.push({
            arrayState: [...array],
            description: `Merged subarrays into: [${array.slice(left, right + 1)}]`,
            iteration: outerLoopRuns,
            highlightIndexes: [left, right],
            swapIndexes: []
        });
    }

    // Initial call to mergeSortRecursive
    mergeSortRecursive(array, 0, array.length - 1);

    const endTime = performance.now();

    swapsInfo.textContent = `Total Merges: ${totalMerges}`;
    loopRunsInfo.textContent = `Inner Loop Runs: ${totalLoopRuns}, Outer Loop Runs: ${outerLoopRuns}`;
    complexityInfo.innerHTML = `
        Time Complexity: 
        <ul>
            <li>Best Case: O(n log n)</li>
            <li>Worst Case: O(n log n)</li>
            <li>Average Case: O(n log n)</li>
        </ul>
        Space Complexity: O(n)
    `;
    executionTimeInfo.textContent = `Execution Time: ${(endTime - startTime).toFixed(2)} ms`;

    return steps;
}

function quickSortWithSteps(array) {
    const steps = [];
    let totalComparisons = 0;
    let totalSwaps = 0;
    let totalLoopRuns = 0;
    let outerLoopRuns = 0;

    const startTime = performance.now();

    // Helper export export function for quicksort recursion
    function quickSortRecursive(arr, low, high) {
        if (low < high) {
            const pivotIndex = partition(arr, low, high);
            quickSortRecursive(arr, low, pivotIndex - 1); // Left subarray
            quickSortRecursive(arr, pivotIndex + 1, high); // Right subarray
        }
    }

    // Partition function to rearrange elements around pivot
    function partition(arr, low, high) {
        let pivot = arr[high];
        let i = low - 1;

        steps.push({
            arrayState: [...array],
            description: `Choose pivot: ${pivot} at index ${high}`,
            iteration: outerLoopRuns,
            highlightIndexes: [high],
            swapIndexes: []
        });

        for (let j = low; j < high; j++) {
            totalLoopRuns++;
            totalComparisons++;

            steps.push({
                arrayState: [...array],
                description: `Compare ${arr[j]} with pivot ${pivot}`,
                iteration: outerLoopRuns,
                highlightIndexes: [j, high],
                swapIndexes: []
            });

            if (arr[j] <= pivot) {
                i++;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                totalSwaps++;

                steps.push({
                    arrayState: [...array],
                    description: `Swap ${arr[i]} at index ${i} with ${arr[j]} at index ${j}`,
                    iteration: outerLoopRuns,
                    highlightIndexes: [i, j],
                    swapIndexes: [i, j]
                });
            }
        }

        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]; // Swap pivot with element at i + 1
        totalSwaps++;

        steps.push({
            arrayState: [...array],
            description: `Move pivot ${arr[i + 1]} to correct position at index ${i + 1}`,
            iteration: outerLoopRuns,
            highlightIndexes: [i + 1, high],
            swapIndexes: [i + 1, high]
        });

        return i + 1;
    }

    // Initial quick sort call
    quickSortRecursive(array, 0, array.length - 1);

    const endTime = performance.now();

    swapsInfo.textContent = `Total Swaps: ${totalSwaps}`;
    loopRunsInfo.textContent = `Inner Loop Runs: ${totalLoopRuns}`;
    complexityInfo.innerHTML = `
        Time Complexity: 
        <ul>
            <li>Best Case: O(n log n)</li>
            <li>Worst Case: O(n²)</li>
            <li>Average Case: O(n log n)</li>
        </ul>
        Space Complexity: O(log n)
    `;
    executionTimeInfo.textContent = `Execution Time: ${(endTime - startTime).toFixed(2)} ms`;

    return steps;
}

function countSortWithSteps(array) {
    const steps = [];
    let totalSwaps = 0;
    let totalLoopRuns = 0;
    let outerLoopRuns = 0;

    const startTime = performance.now();

    // Find the maximum element in the array
    const max = Math.max(...array);

    // Initialize count array with all 0s
    const count = new Array(max + 1).fill(0);
    const output = new Array(array.length);

    // Count the occurrences of each element
    for (let i = 0; i < array.length; i++) {
        totalLoopRuns++;
        count[array[i]]++;
    }

    steps.push({
        arrayState: [...array],
        description: `Count the occurrences of each element.`,
        iteration: outerLoopRuns,
        highlightIndexes: [],
        swapIndexes: []
    });

    // Update count array by accumulating counts
    for (let i = 1; i <= max; i++) {
        count[i] += count[i - 1];
    }

    steps.push({
        arrayState: [...array],
        description: `Accumulate counts in the count array.`,
        iteration: outerLoopRuns,
        highlightIndexes: [],
        swapIndexes: []
    });

    // Build the output array by placing elements in correct sorted positions
    for (let i = array.length - 1; i >= 0; i--) {
        const num = array[i];
        output[count[num] - 1] = num;
        count[num]--;
        totalSwaps++;

        steps.push({
            arrayState: [...array],
            description: `Place ${num} in the sorted position ${count[num]}`,
            iteration: outerLoopRuns,
            highlightIndexes: [i, count[num] - 1],
            swapIndexes: [i, count[num] - 1]
        });
    }

    // Copy the output array back to the original array
    for (let i = 0; i < array.length; i++) {
        array[i] = output[i];
    }

    steps.push({
        arrayState: [...array],
        description: `Final sorted array: ${array}`,
        iteration: outerLoopRuns,
        highlightIndexes: [],
        swapIndexes: []
    });

    const endTime = performance.now();

    swapsInfo.textContent = `Total Swaps: ${totalSwaps}`;
    loopRunsInfo.textContent = `Inner Loop Runs: ${totalLoopRuns}`;
    complexityInfo.innerHTML = `
        Time Complexity: 
        <ul>
            <li>Best Case: O(n + k)</li>
            <li>Worst Case: O(n + k)</li>
            <li>Average Case: O(n + k)</li>
        </ul>
        Space Complexity: O(n + k)
    `;
    executionTimeInfo.textContent = `Execution Time: ${(endTime - startTime).toFixed(2)} ms`;

    return steps;
}


// export export export function to display the algorithm details in pseudocode format
function displayAlgorithmDetails(algorithm) {
    switch (algorithm) {
        case "Bubble Sort":
            algorithmDetails.textContent = `Bubble Sort:
swapped = false
for i = 1 to indexOfLastUnsortedElement - 1
    if leftElement > rightElement
        swap(leftElement, rightElement)
        swapped = true
while swapped`;
            break;

        case "Insertion Sort":
            algorithmDetails.textContent = `Insertion Sort:
for i = 1 to array.length
    key = array[i]
    j = i - 1
    while j >= 0 and array[j] > key
        array[j + 1] = array[j]
        j = j - 1
    array[j + 1] = key`;
            break;

        case "Selection Sort":  // Add this case
            algorithmDetails.textContent = `Selection Sort:
for i = 0 to array.length - 1
    minIndex = i
    for j = i + 1 to array.length
        if array[j] < array[minIndex]
            minIndex = j
    if minIndex != i
        swap(array[i], array[minIndex])`;
            break;

            case "Merge Sort":
                algorithmDetails.textContent = `Merge Sort:
    function mergeSort(array):
        if array.length <= 1
            return array
        
        mid = array.length / 2
        left = mergeSort(array.slice(0, mid))
        right = mergeSort(array.slice(mid))
    
        return merge(left, right)
    
     function merge(left, right):
        result = []
        while left and right
            if left[0] <= right[0]
                result.push(left.shift())
            else
                result.push(right.shift())
    
        return result.concat(left).concat(right)`;
                break;
        case "Quick Sort":
                    algorithmDetails.textContent = `Quick Sort:
        export export export function quickSort(array)
            if array.length <= 1
                return array
            pivot = array[0]  // Or choose another element
            left = []
            right = []
            for each element in array[1:]
                if element < pivot
                    left.push(element)
                else
                    right.push(element)
            return concatenate(quickSort(left), pivot, quickSort(right))`;
                    break;
        
        case "Count Sort":
                    algorithmDetails.textContent = `Count Sort:
        function countSort(array)
            max = findMax(array)
            count = array of size max + 1, initialized to 0
            for each element in array
                count[element]++
            for i = 1 to count.length - 1
                count[i] += count[i - 1]  // Accumulate counts
            output = array of size equal to input array
            for i = array.length - 1 down to 0
                output[count[array[i]] - 1] = array[i]
                count[array[i]]--
            return output`;
                    break;
        
        default:
            algorithmDetails.textContent = "";
    }
}

// export export export function to display the algorithm step description
function displayAlgorithmStep(stepDescription) {
    document.getElementById("algorithmStepDisplay").textContent = stepDescription;
}

// export export export function to generate a nearly sorted array
function generateNearlySortedArray(size) {
    const array = generateRandomArray(size).sort((a, b) => a - b); // Start with a sorted array
    const swaps = Math.max(1, Math.floor(size * 0.1)); // Determine how many elements to swap (10% of the array size)

    for (let i = 0; i < swaps; i++) {
        const index1 = Math.floor(Math.random() * size);
        const index2 = Math.floor(Math.random() * size);
        [array[index1], array[index2]] = [array[index2], array[index1]]; // Swap two random elements
    }
    return array;
}