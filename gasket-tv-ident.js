/*-----------------------------------------------------------------------------------*/
// Variable Declaration
/*-----------------------------------------------------------------------------------*/

// Common variables
var canvas, gl, program;
var posBuffer, colBuffer, texBuffer, vPosition, vColor, vTexCoord;
var modelViewMatrixLoc, projectionMatrixLoc, texCoordLoc;
var modelViewMatrix, projectionMatrix, texture;

// Variables referencing HTML elements
var canvas, subdivSlider, subdivValue, sizeSlider, sizeValue, scaleSlider, scaleValue;
var bgColor, toggleWallColor, toggleWallRandomMovement, toggleWallVibrate;
var startAnimationBtn, resetGasketBtn, resetSettingsBtn;
var theta = [0, 0, 0], move = [0, 0, 0];

var axis = 2; // Default axis for rotation (0: X-axis, 1: Y-axis, 2: Z-axis)

// Add boundary hit count variable
var boundaryHitCount = 0;

// Checkbox references for random colour, random axis and random vibration
var toggleWallColor, toggleWallRandomMovement, toggleWallVibrate;

var subdivNum = 3, scaleNum = 1.0, enlargeScale = 1.5;

var firstTime = true; // Initialize as true, assuming "first time" rendering

var wallHitCountDisplay; // Declare a variable for the wall hit count display

let soundEnabled = false; // Sound disabled by default

var toggleRandomColor;

// Border boundaries for the gasket to bounce off
var hBoundary = 1.87; // Horizontal boundary
var topBoundary = 0.73125; // Top vertical boundary
var bottomBoundary = -0.89; // Bottom vertical boundary

var speed = 1; // Default speed of the animation
var animSeq = 0
var moveDir = [1, 1]; // Default direction: X-positive, Y-positive

// var iterTemp = 0, animSeq = 0, animFrame = 0, animFlag = false;
var animFlag = false, animFrame;

// Variables for the 3D Sierpinski gasket
var points = [], colors = [], textures = [];

var transformLoc; // Location of the transform uniform in the shader

// Vertices for the 3D Sierpinski gasket (X-axis, Y-axis, Z-axis, W)
// For 3D, you need to set the z-axis to create the perception of depth
var vertices = [
    vec4( 0.0000,  0.0000, -1.0000, 1.0000),
    vec4( 0.0000,  0.9428,  0.3333, 1.0000),
    vec4(-0.8165, -0.4714,  0.3333, 1.0000),
    vec4( 0.8165, -0.4714,  0.3333, 1.0000)
];

// Different colors for a tetrahedron (RGBA)
var faceColors = [
    vec4(1.0, 0.2, 0.4, 1.0), // Default Face 1 color
    vec4(0.0, 0.9, 1.0, 1.0), // Default Face 2 color
    vec4(0.2, 0.2, 0.5, 1.0), // Default Face 3 color
    vec4(1.0, 1.0, 1.0, 1.0)  // Default Face 4 color
];

// Define texture coordinates for texture mapping onto a shape or surface
var texCoord = 
[
    vec2(0, 0), // Bottom-left corner of the texture
    vec2(0, 1), // Top-left corner of the texture
    vec2(1, 1), // Top-right corner of the texture
    vec2(1, 0)  // Bottom-right corner of the texture
];

/*-----------------------------------------------------------------------------------*/
// WebGL Utilities
/*-----------------------------------------------------------------------------------*/

// Execute the init() function when the web page has fully loaded
window.onload = function init()
{
    // Primitive (geometric shape) initialization
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);
    
    // WebGL setups
    getUIElement();
    configWebGL();
    configureTexture(tex1);
    console.log("Canvas Dimensions:", canvas.width, "x", canvas.height);
    render();
}

// Retrieve all elements from HTML and store in the corresponding variables
function getUIElement()
{
    // Canvas
    canvas = document.getElementById("gl-canvas");
    checkTex1 = document.getElementById("check-texture-1");
    checkTex2 = document.getElementById("check-texture-2");
    checkTex3 = document.getElementById("check-texture-3");
    tex1 = document.getElementById("texture-1");
	tex2 = document.getElementById("texture-2");
    tex3 = document.getElementById("texture-3");

    // Rotation Axis Inputs
    rotationAxisInputs = document.querySelectorAll('input[name="rotation-axis"]');
    console.log(rotationAxisInputs);

    rotationAxisInputs.forEach((input) => {
        input.addEventListener("change", (event) => {
            const value = event.target.value;
            if (value === "x") {
                axis = 0; // X-axis
                console.log("Rotation Axis set to X");
            } else if (value === "y") {
                axis = 1; // Y-axis
                console.log("Rotation Axis set to Y");
            } else if (value === "z") {
                axis = 2; // Z-axis
                console.log("Rotation Axis set to Z");
            }
        });
    });

    // Display for the number of times the gasket hits the wall
    wallHitCountDisplay = document.getElementById("wall-hit-count");

    const audioElement = document.getElementById("hit-sound");
    const soundRadios = document.querySelectorAll('input[name="sound-choice"]');
    console.log(document.querySelectorAll('input[name="sound-choice"]'));

    toggleRandomColor = document.getElementById("toggle-wall-color");

    soundRadios.forEach((radio) => {
        console.log(`Attaching listener to radio: ${radio.id}`);
        radio.addEventListener("change", (event) => {
            console.log("Event listener triggered");
            const selectedSound = event.target.value; // Get the selected sound file from the radio button's value
            audioElement.src = selectedSound; // Update the <audio> element's source
            console.log(`Sound updated to: ${selectedSound}`); // Debug log
        });
    });

    const soundToggleInput = document.getElementById("sound-toggle-input");

    // Event Listener for Toggle
    soundToggleInput.addEventListener("change", () => {
        soundEnabled = !soundEnabled; // Toggle the sound state
    });


    // Sliders and their text values
    subdivSlider = document.getElementById("subdiv-slider");
    subdivValue = document.getElementById("subdiv-value");

    sizeSlider = document.getElementById("size-slider");
    sizeValue = document.getElementById("size-value");

    speedSlider = document.getElementById("speed-slider");
    speedValue = document.getElementById("speed-value");

    // Background color
    bgColor = document.getElementById("bg-color");

    bgColor.addEventListener("input", function() {
        // canvas.style.backgroundColor = bgColor.value;
        const rgb = hexToRgb(bgColor.value);
        gl.clearColor(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1.0);

        // Clear the color buffer only (not depth), without resetting the state of the animation
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Use the current modelViewMatrix and other parameters to render the current state of the animation
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
        
        // Draw the primitive / geometric shape using the current state
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
    }
    );

    // Face Colors and Opacity
    face1Color = document.getElementById("face1-color");
    face1Opacity = document.getElementById("face1-opacity");
    face2Color = document.getElementById("face2-color");
    face2Opacity = document.getElementById("face2-opacity");
    face3Color = document.getElementById("face3-color");
    face3Opacity = document.getElementById("face3-opacity");
    face4Color = document.getElementById("face4-color");
    face4Opacity = document.getElementById("face4-opacity");

    face1OpacityValue = document.getElementById("face1-opacity-value");
    face2OpacityValue = document.getElementById("face2-opacity-value");
    face3OpacityValue = document.getElementById("face3-opacity-value");
    face4OpacityValue = document.getElementById("face4-opacity-value");
    
    face1Color.addEventListener("input", () => updateFaceColor(0, face1Color.value, face1Opacity.value));
    face1Opacity.addEventListener("input", () => {
        updateFaceColor(0, face1Color.value, face1Opacity.value);
        face1OpacityValue.innerHTML = face1Opacity.value;
    });

    face2Color.addEventListener("input", () => updateFaceColor(1, face2Color.value, face2Opacity.value));
    face2Opacity.addEventListener("input", () => {
        updateFaceColor(1, face2Color.value, face2Opacity.value);
        face2OpacityValue.innerHTML = face2Opacity.value;
    });

    face3Color.addEventListener("input", () => updateFaceColor(2, face3Color.value, face3Opacity.value));
    face3Opacity.addEventListener("input", () => {
        updateFaceColor(2, face3Color.value, face3Opacity.value);
        face3OpacityValue.innerHTML = face3Opacity.value;
    });

    face4Color.addEventListener("input", () => updateFaceColor(3, face4Color.value, face4Opacity.value));
    face4Opacity.addEventListener("input", () => {
        updateFaceColor(3, face4Color.value, face4Opacity.value);
        face4OpacityValue.innerHTML = face4Opacity.value;
    });

    // Toggles
    toggleWallColor = document.getElementById("toggle-wall-color");
    toggleWallRandomMovement = document.getElementById("toggle-wall-random-movement");
    toggleWallVibrate = document.getElementById("toggle-wall-vibrate");

    toggleWallVibrate.addEventListener("change", function () {
        if (toggleWallVibrate.checked) {
            console.log("Wall Vibration enabled");
        } else {
            console.log("Wall Vibration disabled");
        }
    });
    
    saveBtn = document.getElementById("save-settings-btn")
    loadBtn = document.getElementById("load-settings-btn")

    // Buttons
    startAnimationBtn = document.getElementById("start-animation-btn");
    resetGasketBtn = document.getElementById("reset-gasket-btn");
    resetSettingsBtn = document.getElementById("reset-settings-btn");

    const powerToggle = document.getElementById("power-toggle");
    const overlay = document.getElementById("canvas-overlay");
    const buttons = document.querySelectorAll(".bottom-buttons-section button");
    
    // Initialize the default state
    let isPoweredOn = false;
    
    powerToggle.addEventListener("change", () => {
        isPoweredOn = powerToggle.checked; // Get the current state of the checkbox
    
        buttons.forEach((button) => {
            button.disabled = !isPoweredOn; // Enable or disable buttons based on TV state
        });
    
        if (powerToggle.checked) {
            overlay.style.animation = "turned-on 0.5s forwards";
        } else {
            overlay.style.animation = "turned-off 0.5s forwards";

            // Call the resetGasket function when powering off
            resetGasket();
        }
    });

    // Subdivision Slider
    // subdivSlider.onchange = function(event) 
	// {
	// 	subdivNum = event.target.value;
	// 	subdivValue.innerHTML = subdivNum;
    //     // firstTime = false;
    //     recompute();
    // };

    subdivSlider.addEventListener("input", function () {
        resetGasketPosition(); // Reset the gasket position on slider input
        subdivNum = parseInt(subdivSlider.value); // Update subdivision number
        subdivValue.innerHTML = subdivSlider.value; // Display the updated value
        recompute(); // Recompute the geometry
    });

    sizeSlider.addEventListener("input", function() {
        // resetGasketPosition(); // Reset the gasket position on slider input

        const newSize = parseFloat(sizeSlider.value); // Get the updated size value
        resetGasketPosition(newSize);
        console.log("This is addEventListener");
        sizeValue = parseFloat(sizeSlider.value);
        firstTime = false;
        console.log("Size Value:", sizeValue);
        console.log("Size Slider Value:", sizeSlider.value);
        
        document.getElementById("size-value").innerHTML = sizeValue;
        // sizeValue.innerHTML = sizeNum;
        recalcBoundary();
        recompute();
    }
    );
    
    // Speed Slider
    speedSlider.addEventListener("input", function(event) {
        speed = event.target.value; // Update the speed variable
        speedValue.innerHTML = speed; // Update the speed display
    });
    
    // Background Color Picker
    bgColor.onchange = function(event)
    {
        canvas.style.backgroundColor = event.target.value;
        // const rgb = hexToRgb(bgColor.value);
        // gl.clearColor(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1.0);
        // render();
    }

    // Texture Choices
    checkTex1.onchange = function() 
	{
		if(checkTex1.checked)
        {
            configureTexture(tex1);
            recompute();
        }
    };

    checkTex2.onchange = function() 
	{
		if(checkTex2.checked)
        {
            configureTexture(tex2);
            recompute();
        }
    };

    checkTex3.onchange = function() 
	{
		if(checkTex3.checked)
        {
            configureTexture(tex3);
            recompute();
        }
    };

    toggleWallRandomMovement.addEventListener("change", function () {
        if (toggleWallRandomMovement.checked) {
            console.log("Random Rotation Movement enabled");
            
        } else {
            console.log("Random Rotation Movement disabled");
            resetGasketPosition();
        }
    });

    toggleWallVibrate.addEventListener("change", function () {
        if (toggleWallVibrate.checked) {
            console.log("Wall Vibration enabled");
        } else {
            console.log("Wall Vibration disabled");
        }
    });

    saveBtn.addEventListener("click", function () {
        const settings = {
            subdivision: subdivSlider.value,
            size: sizeSlider.value,
            speed: speedSlider.value,
            bgColor: bgColor.value,
            faceColors: {
                face1: { color: face1Color.value, opacity: face1Opacity.value },
                face2: { color: face2Color.value, opacity: face2Opacity.value },
                face3: { color: face3Color.value, opacity: face3Opacity.value },
                face4: { color: face4Color.value, opacity: face4Opacity.value }
            },
            randomColor: toggleWallColor.checked,
            randomMovement: toggleWallRandomMovement.checked,
            vibration: toggleWallVibrate.checked,
            // Add new properties to save
            wallHitCount: boundaryHitCount,
            position: {
                x: move[0],
                y: move[1]
            },
            rotation: {
                x: theta[0],
                y: theta[1],
                z: theta[2]
            },
            scale: scaleNum,
            animationSequence: animSeq,
            movementDirection: {
                x: moveDir[0],
                y: moveDir[1]
            }
        };
    
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "tv-gasket-settings.txt";
        a.click();
        URL.revokeObjectURL(a.href); // Clean up the URL
    });
    
    // Load button click event
    loadBtn.addEventListener("click", function () {
        const fileInput = document.getElementById("file-input");
        fileInput.click();
    
        fileInput.onchange = function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const settings = JSON.parse(e.target.result);
                    applySettings(settings);
                };
                reader.readAsText(file);
            }
        };
        
    });

    // Animation Start Button
    startAnimationBtn.onclick = startAnimation;

    // Reset Gasket Button
    resetGasketBtn.onclick = resetGasket;

    // Reset Settings Button
    resetSettingsBtn.onclick = resetSettings;
}

// Configure WebGL Settings
function configWebGL()
{
    // Initialize the WebGL context
    gl = WebGLUtils.setupWebGL(canvas);
    
    if(!gl)
    {
        alert("WebGL isn't available");
    }

    // Set the viewport and clear the color
    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Initial background color: white
    gl.clearColor(1.0, 0.9216, 0.6, 1.0)

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);   // Using the depth buffer to perform hidden surface removal
    gl.enable(gl.BLEND); // Use blending to render transparent objects
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Configure blending mode

    // Compile the vertex and fragment shaders and link to WebGL
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create buffers and link them to the corresponding attribute variables in vertex and fragment shaders
    // Buffer for positions
    posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Buffer for colors
    colBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // Buffer for textures
    texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);
    
    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    // Get the location of the uniform variables within a compiled shader program
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    texCoordLoc = gl.getUniformLocation(program, "texture");

    transformLoc = gl.getUniformLocation(program, "transform");
}

// Render the graphics for viewing
function render()
{
    // Cancel the animation frame before performing any graphic rendering
    if(animFlag)
    {
        animFlag = false;
        window.cancelAnimationFrame(animFrame);
    }
    
    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Pass a 4x4 projection matrix from JavaScript to the GPU for use in shader
    // ortho(left, right, bottom, top, near, far)
    projectionMatrix = ortho(-4, 4, -2.25, 2.25, 2, -2);
	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Pass a 4x4 model view matrix from JavaScript to the GPU for use in shader
    // Use translation to readjust the position of the primitive (if needed)
    modelViewMatrix = mat4();
    console.log('sizeValue:', sizeValue);
    // modelViewMatrix = mult(modelViewMatrix, scale(sizeValue, sizeValue, sizeValue)); // Set initial size
    console.log("Is this the first time?", firstTime);
    if (firstTime) {
        modelViewMatrix = mult(modelViewMatrix, scale(1.0, 1.0, 1.0)); // Set initial size
    } else {
        modelViewMatrix = mult(modelViewMatrix, scale(sizeValue, sizeValue, sizeValue)); // Set initial size
    }
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

// Recompute points and colors, followed by reconfiguring WebGL for rendering
function recompute()
{
    // Reset points and colors for render update
    points = [];
	colors = [];
    textures = [];
    
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);
    configWebGL();
    render();
}

function recalcBoundary() {
    // Adjust boundaries dynamically based on scaleNum
    // The boundaries shrink as the object scales up to keep it within view
    // hBoundary = 1.9 - (1 * (sizeValue - 1.5)); // Horizontal boundary reduces as scale increases
    // topBoundary = 0.73125 - (0.6 * (sizeValue - 1.5)); // Top boundary reduces faster to fit the larger object
    // bottomBoundary = -1 + (0.4 * (sizeValue - 1.5)); // Bottom boundary shifts upwards as scale increases

    // Calculate hBoundary
    hBoundary = 2.68 * (1 / sizeValue) - 0.81;

    // Calculate topBoundary
    topBoundary = 1.4625 * (1 / sizeValue) - 0.73125;

    // Calculate bottomBoundary
    bottomBoundary = -1.52 * (1 / sizeValue) + 0.63;

    // Debugging output to verify calculations
    console.log("Scale:", sizeValue);
    console.log("Horizontal Boundary (hBoundary):", hBoundary);
    console.log("Top Boundary:", topBoundary);
    console.log("Bottom Boundary:", bottomBoundary);

    // whien sizeValue = 1.0
    // var hBoundary = 1.87;
    // var topBoundary = 0.73125; 
    // var bottomBoundary = -0.89;
    
    // when sizeValue = 0.5
    // hBoundary = 4.55;
    // topBoundary = 2.25;
    // bottomBoundary = -2.4;

    // when sizeValue = 2.0
    // hBoundary = 0.53;
    // topBoundary = 0.0;
    // bottomBoundary = -0.13;
}

// Update the animation frame
function animUpdate()
{
    if (!animFlag) return; // Stop if animation is toggled off

    // Clear the color buffer and the depth buffer before rendering a new frame
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const hitSound = document.getElementById("hit-sound");

    // Set the model view matrix for vertex transformation
    // Use translation to readjust the position of the primitive (if needed)
    console.log(`Size Value: ${sizeValue}`);
    modelViewMatrix = mat4();
    // modelViewMatrix = mult(modelViewMatrix, scale(sizeValue, sizeValue, sizeValue)); 
    if(!firstTime)
    {
        modelViewMatrix = mult(modelViewMatrix, scale(sizeValue, sizeValue, sizeValue)); 
    }
    modelViewMatrix = mult(modelViewMatrix, translate(0, -0.2357, 0));

    // Switch case to handle the ongoing animation sequence
    // The animation is executed sequentially from case 0 to case n
    switch(animSeq)
    {
        case 0: // Rotate to the right 180 degrees clockwise
            // theta[2] += 1;
            theta[axis] += 2.0 * speed;
            if (theta[axis] >= 180) {
                theta[axis] = 180;
                animSeq++;
            }
            break;

        case 1: // Rotate back to the original position
            // theta[2] -= 1;
            theta[axis] -= 2.0 * speed;
            if (theta[axis] <= 0) {
                theta[axis] = 0;
                animSeq++;
            }
            break;

        case 2: // Rotate to the left 180 degrees anti-clockwise
            // theta[2] -= 1;
            theta[axis] -= 2.0 * speed;
            if (theta[axis] <= -180) {
                theta[axis] = -180;
                animSeq++;
            }
            break;
        
        case 3: // Rotate back to the original position
            // theta[2] += 1;
            theta[axis] += 2.0 * speed;
            if (theta[axis] >= 0) {
                theta[axis] = 0;
                animSeq++;
            }
            break;
        
        case 4: // Gradually enlarge the size of gasket
            console.log(`enlargeScale = ${enlargeScale}`);
            scaleNum += 0.01 * speed;
            if (scaleNum >= enlargeScale) {
                scaleNum = enlargeScale;
                animSeq++;
            }
            console.log(`Enlarging: scaleNum = ${scaleNum}`);
            break;

        case 5: // Random movement around the screen
            if (move[0] > hBoundary || move[0] < -hBoundary) {
                // Reverse horizontal movement direction
                moveDir[0] *= -1; // Reverse horizontal direction
                boundaryHitCount++; // Increment boundary hit count
                wallHitCountDisplay.textContent = boundaryHitCount; // Update the wall hit count display
                console.log(`Boundary Hit Count: ${boundaryHitCount}`);

                // Play sound on hit if sound is enabled
                if (soundEnabled) {
                    hitSound.currentTime = 0; // Reset the sound to the start
                    hitSound.play();
                }

                axis = getRandomAxis(); // Get a new random rotation axis
                console.log(`New Rotation Axis: ${axis === 0 ? 'X' : axis === 1 ? 'Y' : 'Z'}`);
                
                if (toggleRandomColor && toggleRandomColor.checked) {
                    changeGasketColors();
                }
                
                if (toggleWallVibrate && toggleWallVibrate.checked) {
                    vibratePage('left-right'); // Vibrate left-right for horizontal wall hit
                }
            }

            if (move[1] >= topBoundary || move[1] < bottomBoundary) {
                // Reverse vertical movement direction
                moveDir[1] *= -1; // Reverse vertical direction
                boundaryHitCount++; // Increment boundary hit count
                wallHitCountDisplay.textContent = boundaryHitCount; // Update the wall hit count display
                console.log(`Boundary Hit Count: ${boundaryHitCount}`);

                // Play sound on hit if sound is enabled
                if (soundEnabled) {
                    hitSound.currentTime = 0; // Reset the sound to the start
                    hitSound.play();
                }

                axis = getRandomAxis(); // Get a new random rotation axis
                console.log(`New Rotation Axis: ${axis === 0 ? 'X' : axis === 1 ? 'Y' : 'Z'}`);

                if (toggleRandomColor && toggleRandomColor.checked) {
                    changeGasketColors();
                }

                if (toggleWallVibrate && toggleWallVibrate.checked) {
                    vibratePage('up-down'); // Vibrate up-down for vertical wall hit
                }
            }
            
            // Update position based on direction and speed
            move[0] += 0.01 * speed * moveDir[0];
            move[1] += 0.01 * speed * moveDir[1];
            // console.log(`Theta: [${theta[0]}, ${theta[1]}, ${theta[2]}]`);
            // console.log(`Move: [${move[0]}, ${move[1]}]`);
            // console.log(`Move Direction: [${moveDir[0]}, ${moveDir[1]}]`);
            // console.log(`Boundaries: Left=${-hBoundary}, Right=${hBoundary}, Top=${topBoundary}, Bottom=${bottomBoundary}`);
            gl.uniform2fv(transformLoc, move);
            
            // Super random movement
            let initialState = {
                theta: [...theta],
                axis: axis,
                moveDir: [...moveDir],
                hBoundary: hBoundary,
                topBoundary: topBoundary,
                bottomBoundary: bottomBoundary,
            };

            let randomMovementEnabled = false; // Flag to track the state of random movement

            if (toggleWallRandomMovement && toggleWallRandomMovement.checked) {
                if (!randomMovementEnabled) {
                    // Enable random movement for the first time
                    randomMovementEnabled = true;
                    console.log("Random movement enabled.");
                }
                // Continue with random movement logic
                theta[axis] += 2.0 * speed;
                if (theta[axis] >= 360) {
                    theta[axis] -= 360;
                }
                console.log(`Random Rotation: Axis=${axis}, Theta=${theta[axis]}`);
            } else {
                if (randomMovementEnabled) {
                    resetGasket(); // Reset the gasket to its original position
                }
            }
            break;

        default: // Reset animation sequence
            animSeq = 5;    
            break;
    }

    // Perform vertex transformation for the gasket
    modelViewMatrix = mult(modelViewMatrix, rotateX(theta[0])); // Rotate along X-axis
    modelViewMatrix = mult(modelViewMatrix, rotateY(theta[1])); // Rotate along Y-axis
    modelViewMatrix = mult(modelViewMatrix, rotateZ(theta[2])); // Rotate along Z-axis
    modelViewMatrix = mult(modelViewMatrix, scale(scaleNum, scaleNum, scaleNum));   // Scale the gasket
    modelViewMatrix = mult(modelViewMatrix, translate(move[0], move[1], move[2]));  // Move the gasket

    // Pass the matrix to the GPU for use in shader
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Draw the primitive / geometric shape
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    // Schedule the next frame for a looped animation (60fps)
    animFrame = window.requestAnimationFrame(animUpdate);
}

// Disable the UI elements when the animation is ongoing
function disableUI()
{
    subdivSlider.disabled = true;
    sizeSlider.disabled = true;
    checkTex1.disabled = true;
    checkTex2.disabled = true;
    checkTex3.disabled = true;
    resetGasketBtn.disabled = true;
    resetSettingsBtn.disabled = true;
    rotateX.disabled = true;
    rotateY.disabled = true;
    rotateZ.disabled = true;
}

// Enable the UI elements after the animation is completed
function enableUI()
{
    subdivSlider.disabled = false;
    sizeSlider.disabled = false;
    checkTex1.disabled = false;
    checkTex2.disabled = false;
    checkTex3.disabled = false;
    resetGasketBtn.disabled = false;
    resetSettingsBtn.disabled = false;
    rotateX.disabled = false;
    rotateY.disabled = false;
    rotateZ.disabled = false;
}

// Reset all necessary variables to their default values
function resetValue()
{
    theta = [0, 0, 0];
    move = [0, 0, 0];
    scaleNum = 1;
    animSeq = 0;
    iterTemp = 0;
}

// Check whether whether a given number value is a power of 2
function isPowerOf2(value) 
{
  return (value & (value - 1)) == 0;
}

// Configure the texture
function configureTexture(tex)
{
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, tex);
	if (isPowerOf2(tex.width) && isPowerOf2(tex.height)) 
	{
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        console.log("Width: " + tex.width + ", Height: " + tex.height + " (yes)");
    } 
	
	else 
	{
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        console.log("Width: " + tex.width + ", Height: " + tex.height + " (no)");
    }
}

/*-----------------------------------------------------------------------------------*/
// 3D Sierpinski Gasket
/*-----------------------------------------------------------------------------------*/
function triangle(a, b, c, colorIndex) {
    colors.push(faceColors[colorIndex]); 
    points.push(a);
    textures.push(texCoord[0]);

    colors.push(faceColors[colorIndex]);
    points.push(b);
    textures.push(texCoord[1]);

    colors.push(faceColors[colorIndex]);
    points.push(c);
    textures.push(texCoord[2]);
}


// Form a tetrahedron with different color for each side
function tetra(a, b, c, d)
{
    triangle(a, c, b, 0);
    triangle(a, c, d, 1);
    triangle(a, b, d, 2);
    triangle(b, c, d, 3);
}

// subdivNum a tetrahedron
function divideTetra(a, b, c, d, count)
{
    // Check for end of recursion
    if(count === 0)
    {
        tetra(a, b, c, d);
    }

    // Find midpoints of sides and divide into four smaller tetrahedra
    else
    {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var ad = mix(a, d, 0.5);
        var bc = mix(b, c, 0.5);
        var bd = mix(b, d, 0.5);
        var cd = mix(c, d, 0.5);
        --count;

        divideTetra(a, ab, ac, ad, count);
        divideTetra(ab, b, bc, bd, count);
        divideTetra(ac, bc, c, cd, count);
        divideTetra(ad, bd, cd, d, count);
    }
}

/*-----------------------------------------------------------------------------------*/

/*-----------------------------------------------------------------------------------*/
// Button Functions
/*-----------------------------------------------------------------------------------*/

function startAnimation() {
    animFlag = !animFlag;   // Toggle the animation flag to be true or false

    // Start animation
    if (animFlag) {
        console.log("Animation started");
        disableUI();
        // resetValue();
        animUpdate();
        document.getElementById("start-animation-btn").innerHTML = "Stop";
    } else {
        enableUI();
        window.cancelAnimationFrame(animFrame);
        document.getElementById("start-animation-btn").innerHTML = "Start";
    }

}

function resetGasketPosition(newSizeValue = null) {
    // Reset the position of the gasket to the center of the screen
    theta = [0, 0, 0];
    move = [0, 0, 0];
    scaleNum = 1.5;
    sizeValue = newSizeValue !== null ? newSizeValue : 1.0; // Use newSizeValue if provided
    boundaryHitCount = 0; // Reset wall hit count
    wallHitCountDisplay.textContent = boundaryHitCount;
    firstTime = true; // Indicate first-time rendering
    
    // sizeSlider.value = 1.;
    // document.getElementById("size-value").textContent = "1.0"; // Update size slider display

    sizeSlider.value = sizeValue; // Update the slider value
    document.getElementById("size-value").textContent = sizeValue; // Update the size slider display
    console.log("Size Value:", sizeValue);

    // To handle the case when the animation is running and user press it
    if (animFlag) {
        document.getElementById("start-animation-btn").innerHTML = "Start";
    }

    // Recalculate boundaries based on the reset scale
    recalcBoundary();

    render();
}

function resetGasket() {

    // Get the current rotation axis from the input elements
    const rotationAxisInputs = document.querySelectorAll('input[name="rotation-axis"]');
    rotationAxisInputs.forEach((input) => {
        if (input.checked) {
            if (input.value === "x") {
                axis = 0; // X-axis
            } else if (input.value === "y") {
                axis = 1; // Y-axis
            } else if (input.value === "z") {
                axis = 2; // Z-axis
            }
        }
    });

    console.log("Current axis from button:", axis);

    // Reset transformation variables
    theta = [0, 0, 0];  
    move = [0, 0, 0];   
    scaleNum = 1.0;     
    sizeValue = 1.0;    
    boundaryHitCount = 0; 
    animSeq = 0;       
    firstTime = true;  

    // Reset boundary values dynamically based on the reset scale
    recalcBoundary();

    // Reset gasket geometry
    points = []; // Clear existing points
    colors = []; // Clear existing colors
    textures = []; // Clear existing textures
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum); // Recalculate geometry

    // Re-render the gasket in its reset state
    render();
}

function resetSettings() {
    // Stop the animation if it's running
    if (animFlag) {
        animFlag = false;
        window.cancelAnimationFrame(animFrame); // Cancel ongoing animation
        document.getElementById("start-animation-btn").innerHTML = "Start"; // Reset animation button label
    }

    // Reset sliders and update state variables
    subdivSlider.value = 3;
    sizeSlider.value = 1.0;
    // scaleSlider.value = 1.5;
    speedSlider.value = 1.0;

    subdivNum = parseInt(subdivSlider.value);
    sizeValue = parseFloat(sizeSlider.value);
    // scaleNum = parseFloat(scaleSlider.value);
    speed = parseFloat(speedSlider.value);

    // Update displayed values
    subdivValue.innerHTML = subdivSlider.value;
    document.getElementById("size-value").textContent = sizeSlider.value;
    document.getElementById("speed-value").textContent = speedSlider.value;

    // Reset background color
    bgColor.value = "#FFEB99";
    const rgb = hexToRgb(bgColor.value);
    gl.clearColor(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1.0);

    // Reset face colors and opacity
    faceColors = [
        vec4(1.0, 0.2, 0.3, 1.0), // Face 1
        vec4(0.0, 0.9, 1.0, 1.0), // Face 2
        vec4(0.2, 0.2, 0.5, 1.0), // Face 3
        vec4(1.0, 1.0, 1.0, 1.0), // Face 4
    ];

    face1Color.value = "#ff3366";
    face2Color.value = "#00e6ff";
    face3Color.value = "#33337f";
    face4Color.value = "#ffffff";

    face1Opacity.value = 1.0;
    face2Opacity.value = 1.0;
    face3Opacity.value = 1.0;
    face4Opacity.value = 1.0;

    // Reset toggles
    toggleWallColor.checked = false;
    toggleWallRandomMovement.checked = false;
    toggleWallVibrate.checked = false;

    // Reset sound settings
    soundEnabled = false;
    document.getElementById("sound-toggle-input").checked = false;

    // Reset wall hit count
    boundaryHitCount = 0;
    wallHitCountDisplay.textContent = boundaryHitCount;

    // Reset rotation axis
    axis = 2; // Default to Z-axis
    const rotationAxisInputs = document.querySelectorAll('input[name="rotation-axis"]');
    rotationAxisInputs.forEach((input) => {
        input.checked = input.value === "z";
    });

    // Reset gasket state
    theta = [0, 0, 0];
    move = [0, 0, 0];
    firstTime = true;

    // Recalculate boundaries
    recalcBoundary();

    // Reset geometry and buffers
    points = [];
    colors = [];
    textures = [];
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);

    // Update buffers with reset geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(textures), gl.STATIC_DRAW);

    // Re-render the scene with updated state
    // render();

    console.log("Settings reset to default.");

    resetGasket();
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

function rgbToHex(vec4Color) {
    const r = Math.round(vec4Color[0] * 255);
    const g = Math.round(vec4Color[1] * 255);
    const b = Math.round(vec4Color[2] * 255);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function changeGasketColors() {
    // Get the current opacity values from the sliders
    const opacityValues = [
        parseFloat(face1Opacity.value),
        parseFloat(face2Opacity.value),
        parseFloat(face3Opacity.value),
        parseFloat(face4Opacity.value),
    ];

    // Generate random colors for each face with the corresponding opacity
    faceColors = [
        vec4(Math.random(), Math.random(), Math.random(), opacityValues[0]), // Random color for Face 1
        vec4(Math.random(), Math.random(), Math.random(), opacityValues[1]), // Random color for Face 2
        vec4(Math.random(), Math.random(), Math.random(), opacityValues[2]), // Random color for Face 3
        vec4(Math.random(), Math.random(), Math.random(), opacityValues[3]), // Random color for Face 4
    ];

    // Update the colors for all faces
    colors = []; // Reset the colors array
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum); // Recompute the geometry with new colors

    // Update the color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    console.log("Random colors with opacity applied to gasket faces:", faceColors);

    face1Color.value = rgbToHex(faceColors[0]);
    face2Color.value = rgbToHex(faceColors[1]);
    face3Color.value = rgbToHex(faceColors[2]);
    face4Color.value = rgbToHex(faceColors[3]);
}

function updateFaceColor(faceIndex, colorHex, opacity) {
    const rgb = hexToRgb(colorHex); // Convert hex color to RGB
    faceColors[faceIndex] = vec4(rgb.r / 255, rgb.g / 255, rgb.b / 255, parseFloat(opacity));

    // Update the colors for the specific face
    colors = []; // Reset colors
    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum);

    // Update the color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, colBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // Re-render the scene without recomputing transformations
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, points.length);
}

// Function to get a random rotation axis (0, 1, or 2)
function getRandomAxis() {
    // Ensure a new random axis is chosen different from the current axis
    let newAxis;
    do {
        newAxis = Math.floor(Math.random() * 3);
    } while (newAxis === axis);
    return newAxis;
}

function playWallHitSound() {
    if (soundEnabled) {
      audioElement.currentTime = 0; // Reset to the start of the audio
      audioElement.play(); // Play the sound
    }
  }

function vibratePage(direction) {

    console.log(`Vibration triggered in direction: ${direction}`);
    const body = document.body;

    // Remove any existing shake classes to avoid conflicts
    body.classList.remove('shake-left-right', 'shake-up-down');

    // Add the appropriate shake class based on direction
    if (direction === 'left-right') {
        body.classList.add('shake-left-right');
    } else if (direction === 'up-down') {
        body.classList.add('shake-up-down');
    }

    // Remove the class after the animation ends (500ms in this case)
    setTimeout(() => {
        body.classList.remove('shake-left-right', 'shake-up-down');
    }, 500);
}

function applySettings(settings) {
    // Apply settings to the UI elements
    subdivSlider.value = settings.subdivision;
    subdivValue.innerHTML = subdivSlider.value;

    sizeSlider.value = settings.size;
    sizeValue.innerHTML = sizeSlider.value;

    speedSlider.value = settings.speed;
    speedValue.innerHTML = speedSlider.value;
    
    bgColor.value = settings.bgColor;
    console.log("Background Color:", settings.bgColor);

    // Update corresponding variables
    subdivNum = parseInt(settings.subdivision);
    sizeValue = parseFloat(settings.size);
    speed = parseFloat(settings.speed);
    scaleNum = settings.scale; // Update scaleNum from settings

    console.log("Settings loaded:", settings);
    console.log("Subdivisions:", subdivNum);
    console.log("Size:", sizeValue);
    console.log("Speed:", speed);
    console.log("Scale:", scaleNum);

    // Apply face colors and opacities
    face1Color.value = settings.faceColors.face1.color;
    face1Opacity.value = settings.faceColors.face1.opacity;
    face2Color.value = settings.faceColors.face2.color;
    face2Opacity.value = settings.faceColors.face2.opacity;
    face3Color.value = settings.faceColors.face3.color;
    face3Opacity.value = settings.faceColors.face3.opacity;
    face4Color.value = settings.faceColors.face4.color;
    face4Opacity.value = settings.faceColors.face4.opacity;

    // Update the faceColors array with loaded values
    faceColors = [
        vec4(...hexToRgbArray(face1Color.value), parseFloat(face1Opacity.value)),
        vec4(...hexToRgbArray(face2Color.value), parseFloat(face2Opacity.value)),
        vec4(...hexToRgbArray(face3Color.value), parseFloat(face3Opacity.value)),
        vec4(...hexToRgbArray(face4Color.value), parseFloat(face4Opacity.value)),
    ];

    // Apply toggles
    toggleWallColor.checked = settings.randomColor;
    toggleWallRandomMovement.checked = settings.randomMovement;
    toggleWallVibrate.checked = settings.vibration;

    // Apply wall hit count
    boundaryHitCount = settings.wallHitCount;
    wallHitCountDisplay.textContent = boundaryHitCount;

    // Apply position
    move[0] = settings.position.x;
    move[1] = settings.position.y;

    // Apply rotation
    theta[0] = settings.rotation.x;
    theta[1] = settings.rotation.y;
    theta[2] = settings.rotation.z;

    // Apply scale
    scaleNum = settings.scale;

    // Apply animation sequence
    animSeq = settings.animationSequence;

    // Apply movement direction
    moveDir[0] = settings.movementDirection.x;
    moveDir[1] = settings.movementDirection.y;

    divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], subdivNum); // Recalculate geometry

    firstTime = false; 

    // Recalculate boundaries
    recalcBoundary();

    // Recompute the geometry with updated subdivisions
    recompute();

    const rgb = hexToRgb(settings.bgColor); // Convert HEX to RGB
    gl.clearColor(rgb.r / 255, rgb.g / 255, rgb.b / 255, 1.0); // Apply as background color

    // Clear the color buffer only (not depth), without resetting the state of the animation
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use the current modelViewMatrix and other parameters to render the current state of the animation
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    // Draw the primitive / geometric shape using the current state
    gl.drawArrays(gl.TRIANGLES, 0, points.length);

    resetGasket();


    console.log("Settings applied successfully:", settings);
}

// Helper function to convert HEX color to RGB array
function hexToRgbArray(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    return [r, g, b];
}
