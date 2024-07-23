var vertexShaderText = 
[
'precision mediump float;', // Set the precision for float variables
'',
'attribute vec3 vertPosition;', // Input vertex position
'attribute vec3 vertColor;', // Input vertex color
'varying vec3 fragColor;', // Output color to fragment shader
'uniform mat4 mWorld;', // World transformation matrix
'uniform mat4 mView;', // View transformation matrix
'uniform mat4 mProj;', // Projection transformation matrix
'',
'void main()',
'{',
'   fragColor = vertColor;',
'   gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

// Fragment Shader: Defines the colors
var fragmentShaderText =
[
'precision mediump float;', // Set the precision for float variables
'',
'varying vec3 fragColor;', // Input color from vertex shader
'void main()',
'{',
'   gl_FragColor = vec4(fragColor, 1.0);', // Set the fragment color
'}'
].join('\n');

var InitDemo = function() {
    // Get the canvas and WebGL context
    var canvas = document.getElementById('game-surface');
    var gl = canvas.getContext('webgl');

    if (!gl) {
        console.log('WebGL not supported, falling back on experimental WebGL');
        gl = canvas.getContext('experimental-webgl');
    }
    
    if (!gl) {
        alert('Your browser does not support WebGL');
        return;
    }

    // Set clear color and enable depth testing
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Compile shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    // Link shaders into program
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program!', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);
    
    // Define cube vertices and indices
    var boxVertices = 
    [
        -1.0,  1.0, -1.0,   0.5, 0.5, 0.5,
        -1.0,  1.0,  1.0,   0.5, 0.5, 0.5,
         1.0,  1.0,  1.0,   0.5, 0.5, 0.5,
         1.0,  1.0, -1.0,   0.5, 0.5, 0.5,

        //Left
        -1.0,  1.0,  1.0,   0.75, 0.25, 0.5,
        -1.0, -1.0,  1.0,   0.75, 0.25, 0.5,
        -1.0, -1.0, -1.0,   0.75, 0.25, 0.5,
        -1.0,  1.0, -1.0,   0.75, 0.25, 0.5,

        //Right
        1.0,  1.0,  1.0,    0.25, 0.25, 0.75,
        1.0, -1.0,  1.0,    0.25, 0.25, 0.75,
        1.0, -1.0, -1.0,    0.25, 0.25, 0.75,
        1.0,  1.0, -1.0,    0.25, 0.25, 0.75,

        //Front
         1.0, 1.0,  1.0,   1.0, 0.0, 0.15,
         1.0,-1.0,  1.0,   1.0, 0.0, 0.15,
        -1.0,-1.0,  1.0,   1.0, 0.0, 0.15,
        -1.0, 1.0,  1.0,   1.0, 0.0, 0.15,

        //Back
         1.0,  1.0, -1.0,   0.0, 1.0, 0.15,
         1.0, -1.0, -1.0,   0.0, 1.0, 0.15,
        -1.0, -1.0, -1.0,   0.0, 1.0, 0.15,
        -1.0,  1.0, -1.0,   0.0, 1.0, 0.15,

        //Bottom
        -1.0, -1.0,-1.0,   0.5, 0.5, 1.0,
        -1.0, -1.0, 1.0,   0.5, 0.5, 1.0,
         1.0, -1.0, 1.0,   0.5, 0.5, 1.0,
         1.0, -1.0,-1.0,   0.5, 0.5, 1.0,
    ];

    var boxIndices = 
    [
        // Top
        0, 1, 2,
        0, 2, 3,
        
        // Left
        5, 4, 6,
        6, 4, 7,

        // Right
        8, 9, 10,
        8, 10, 11,

        // Front
        13, 12, 14,
        15, 14, 12,

        // Back
        16, 17, 18,
        16, 18, 19,

        // Bottom
        21, 20, 22,
        22, 20, 23
    ];

    // Create buffers for cube vertices
    var boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    // Create buffers for cube indices
    var boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    // Link vertex data to shader attributes
    var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
    var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        positionAttribLocation, 
        3, // Number of elements per attribute (x, y, z)
        gl.FLOAT, // Type of elements
        gl.FALSE, // Not normalized
        6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex (6 floats per vertex)
        0 // Offset from the beginning of a single vertex to this attribute
    );
    gl.vertexAttribPointer(
        colorAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);

    // Get uniform locations for transformation matrices
    var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

    // Define and set transformation matrices
    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    glMatrix.mat4.identity(worldMatrix);
    glMatrix.mat4.lookAt(viewMatrix, [0, 0, -5], [0, 0, 0], [0, 1, 0]);
    glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    // Rotation matrices
    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);
    var identityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(identityMatrix);

    // Variables to store rotation angles and zoom level
    var angleX = 0;
    var angleY = 0;
    var zoom = -5;

    var loop = function() {
        // Apply rotations
        glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, angleY, [0, 1, 0]);
        glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, angleX, [1, 0, 0]);
        glMatrix.mat4.mul(worldMatrix, xRotationMatrix, yRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        // Update view matrix with zoom
        glMatrix.mat4.lookAt(viewMatrix, [0, 0, zoom], [0, 0, 0], [0, 1, 0]);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

        // Clear the canvas and draw the cube
        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Mouse event handlers for rotation
    var mouseDown = false;
    var lastMouseX = null;
    var lastMouseY = null;

    canvas.addEventListener('mousedown', function(event) {
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });

    canvas.addEventListener('mouseup', function() {
        mouseDown = false;
    });

    canvas.addEventListener('mousemove', function(event) {
        if (!mouseDown) {
            return;
        }
        var newX = event.clientX;
        var newY = event.clientY;

        var deltaX = newX - lastMouseX;
        var deltaY = newY - lastMouseY;

        // Update rotation angles based on mouse movement
        angleY += deltaX * 0.01;
        angleX += deltaY * 0.01;

        lastMouseX = newX;
        lastMouseY = newY;
    });

    // Slider event handler for zoom
    var zoomSlider = document.getElementById('zoom-slider');
    zoomSlider.addEventListener('input', function() {
        var minZoom = -10; 
        var maxZoom = -3;  
        zoom = minZoom + (zoomSlider.value / 100) * (maxZoom - minZoom);
    });
};

window.onload = InitDemo;
