var vertexShaderText = 
[
'precision mediump float;', // Set the precision for float variables
'',
'attribute vec3 vertPosition;', // Input vertex position
'attribute vec3 vertColor;', // Input vertex color
'attribute vec3 vertNormal;', // Input vertex normal
'varying vec3 fragColor;', // Output color to fragment shader
'varying vec3 vNormal;', // Pass normal to fragment shader
'varying vec3 vPosition;', // Pass position to fragment shader
'varying vec3 lightDirection;', // Pass light direction to fragment shader
'uniform mat4 mWorld;', // World transformation matrix
'uniform mat4 mView;', // View transformation matrix
'uniform mat4 mProj;', // Projection transformation matrix
'uniform vec4 uLightPosition;', // Light position in world space
'',
'void main()',
'{',
'   fragColor = vertColor;',
'   vNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;', // Transform normal to world space
'   vPosition = (mWorld * vec4(vertPosition, 1.0)).xyz;', // Transform position to world space
'   vec4 transformedLightPosition = mView * uLightPosition;', // Transform light position to eye space
'   lightDirection = normalize(transformedLightPosition.xyz - (mView * vec4(vPosition, 1.0)).xyz);',
'   gl_Position = mProj * mView * vec4(vPosition, 1.0);',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;', // Set the precision for float variables
'',
'varying vec3 fragColor;', // Input color from vertex shader
'varying vec3 vNormal;', // Input normal from vertex shader
'varying vec3 vPosition;', // Input position from vertex shader
'varying vec3 lightDirection;', // Input light direction from vertex shader
'uniform vec4 uLightAmbient;', // Ambient light
'uniform vec4 uLightDiffuse;', // Diffuse light
'uniform vec4 uLightSpecular;', // Specular light
'uniform vec4 uMaterialAmbient;', // Material ambient
'uniform vec4 uMaterialDiffuse;', // Material diffuse
'uniform vec4 uMaterialSpecular;', // Material specular
'uniform float uShininess;', // Material shininess
'',
'void main()',
'{',
'   vec3 normal = normalize(vNormal);',
'   float diff = max(dot(lightDirection, normal), 0.0);',
'   vec4 diffuse = diff * uLightDiffuse * uMaterialDiffuse;',
'   vec3 viewDir = normalize(-vPosition);',
'   vec3 reflectDir = reflect(-lightDirection, normal);',
'   float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);',
'   vec4 specular = spec * uLightSpecular * uMaterialSpecular;',
'   vec4 ambient = uLightAmbient * uMaterialAmbient;',
'   vec4 color = ambient + diffuse + specular;',
'   gl_FragColor = vec4(color.rgb * fragColor, 1.0);',
'}'
].join('\n');

// Another fragment shader for toggling
var fragmentShaderTextAlt =
[
'precision mediump float;', // Set the precision for float variables
'',
'varying vec3 fragColor;', // Input color from vertex shader
'void main()',
'{',
'   gl_FragColor = vec4(fragColor.r, fragColor.g, 1.0 - fragColor.b, 1.0);', // Different color effect
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
    var compileShader = function(shaderText, shaderType) {
        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderText);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('ERROR compiling shader!', gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    };

    var vertexShader = compileShader(vertexShaderText, gl.VERTEX_SHADER);
    var fragmentShader = compileShader(fragmentShaderText, gl.FRAGMENT_SHADER);
    var fragmentShaderAlt = compileShader(fragmentShaderTextAlt, gl.FRAGMENT_SHADER);

    var createProgram = function(vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Error linking program!', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    };

    var program = createProgram(vertexShader, fragmentShader);
    var programAlt = createProgram(vertexShader, fragmentShaderAlt);
    var currentProgram = program;
    gl.useProgram(currentProgram);
    
    // Define cube vertices and indices
    var boxVertices = 
    [
        -1.0,  1.0, -1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
        -1.0,  1.0,  1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
         1.0,  1.0,  1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
         1.0,  1.0, -1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
        // Left
        -1.0,  1.0,  1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        -1.0, -1.0,  1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        -1.0, -1.0, -1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        -1.0,  1.0, -1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        // Right
        1.0,  1.0,  1.0,    0.25, 0.25, 0.75,  1.0,  0.0,  0.0,
        1.0, -1.0,  1.0,    0.25, 0.25, 0.75,  1.0,  0.0,  0.0,
        1.0, -1.0, -1.0,    0.25, 0.25, 0.75,  1.0,  0.0,  0.0,
        1.0,  1.0, -1.0,    0.25, 0.25, 0.75,  1.0,  0.0,  0.0,
        // Front
         1.0, 1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
         1.0,-1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
        -1.0,-1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
        -1.0, 1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
        // Back
         1.0,  1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
         1.0, -1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
        -1.0, -1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
        -1.0,  1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
        // Bottom
        -1.0, -1.0,-1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
        -1.0, -1.0, 1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
         1.0, -1.0, 1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
         1.0, -1.0,-1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
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
    var linkAttribs = function(program) {
        var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
        var normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
        gl.vertexAttribPointer(
            positionAttribLocation, 
            3, // Number of elements per attribute (x, y, z)
            gl.FLOAT, // Type of elements
            gl.FALSE, // Not normalized
            9 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex (9 floats per vertex)
            0 // Offset from the beginning of a single vertex to this attribute
        );
        gl.vertexAttribPointer(
            colorAttribLocation,
            3,
            gl.FLOAT,
            gl.FALSE,
            9 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT
        );
        gl.vertexAttribPointer(
            normalAttribLocation,
            3,
            gl.FLOAT,
            gl.FALSE,
            9 * Float32Array.BYTES_PER_ELEMENT,
            6 * Float32Array.BYTES_PER_ELEMENT
        );

        gl.enableVertexAttribArray(positionAttribLocation);
        gl.enableVertexAttribArray(colorAttribLocation);
        gl.enableVertexAttribArray(normalAttribLocation);
    };
    linkAttribs(currentProgram);

    // Get uniform locations for transformation matrices and lighting
    var matWorldUniformLocation = gl.getUniformLocation(currentProgram, 'mWorld');
    var matViewUniformLocation = gl.getUniformLocation(currentProgram, 'mView');
    var matProjUniformLocation = gl.getUniformLocation(currentProgram, 'mProj');
    var lightPositionLoc = gl.getUniformLocation(currentProgram, "uLightPosition");
    var lightAmbientLoc = gl.getUniformLocation(currentProgram, "uLightAmbient");
    var lightDiffuseLoc = gl.getUniformLocation(currentProgram, "uLightDiffuse");
    var lightSpecularLoc = gl.getUniformLocation(currentProgram, "uLightSpecular");
    var materialAmbientLoc = gl.getUniformLocation(currentProgram, "uMaterialAmbient");
    var materialDiffuseLoc = gl.getUniformLocation(currentProgram, "uMaterialDiffuse");
    var materialSpecularLoc = gl.getUniformLocation(currentProgram, "uMaterialSpecular");
    var shininessLoc = gl.getUniformLocation(currentProgram, "uShininess");

    // Set lighting and material properties
    var lightPosition = [1.0, 1.0, 1.0, 1.0];
    gl.uniform4fv(lightPositionLoc, lightPosition);
    gl.uniform4fv(lightAmbientLoc, [0.2, 0.2, 0.2, 1.0]);
    gl.uniform4fv(lightDiffuseLoc, [1.0, 1.0, 1.0, 1.0]);
    gl.uniform4fv(lightSpecularLoc, [1.0, 1.0, 1.0, 1.0]);
    gl.uniform4fv(materialAmbientLoc, [0.0, 1.0, 1.0, 1.0]);
    gl.uniform4fv(materialDiffuseLoc, [0.0, 1.0, 1.0, 1.0]);
    gl.uniform4fv(materialSpecularLoc, [1.0, 1.0, 1.0, 1.0]);
    gl.uniform1f(shininessLoc, 80.0);

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

    // Button event handlers for toggling shaders
    var toggleShaderButton = document.getElementById('toggle-shader-button');
    toggleShaderButton.addEventListener('click', function() {
        currentProgram = (currentProgram === program) ? programAlt : program;
        gl.useProgram(currentProgram);
        linkAttribs(currentProgram);

        // Update uniform locations after switching the program
        matWorldUniformLocation = gl.getUniformLocation(currentProgram, 'mWorld');
        matViewUniformLocation = gl.getUniformLocation(currentProgram, 'mView');
        matProjUniformLocation = gl.getUniformLocation(currentProgram, 'mProj');
        lightPositionLoc = gl.getUniformLocation(currentProgram, "uLightPosition");
        lightAmbientLoc = gl.getUniformLocation(currentProgram, "uLightAmbient");
        lightDiffuseLoc = gl.getUniformLocation(currentProgram, "uLightDiffuse");
        lightSpecularLoc = gl.getUniformLocation(currentProgram, "uLightSpecular");
        materialAmbientLoc = gl.getUniformLocation(currentProgram, "uMaterialAmbient");
        materialDiffuseLoc = gl.getUniformLocation(currentProgram, "uMaterialDiffuse");
        materialSpecularLoc = gl.getUniformLocation(currentProgram, "uMaterialSpecular");
        shininessLoc = gl.getUniformLocation(currentProgram, "uShininess");

        // Set lighting and material properties again
        gl.uniform4fv(lightPositionLoc, lightPosition);
        gl.uniform4fv(lightAmbientLoc, [0.2, 0.2, 0.2, 1.0]);
        gl.uniform4fv(lightDiffuseLoc, [1.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(lightSpecularLoc, [1.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(materialAmbientLoc, [0.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(materialDiffuseLoc, [0.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(materialSpecularLoc, [1.0, 1.0, 1.0, 1.0]);
        gl.uniform1f(shininessLoc, 80.0);

        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
    });

    // Event handlers for selecting and highlighting parts of the object
    canvas.addEventListener('click', function(event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        var pixel = new Uint8Array(4);
        gl.readPixels(x, rect.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

        if (pixel[3] > 0) {
            // Highlight the selected part
            console.log('Part selected: ', pixel);
        }
    });

    // Dropdown event handler for switching visualizations
    var visualizationDropdown = document.getElementById('visualization-dropdown');
    visualizationDropdown.addEventListener('change', function() {
        var visualization = visualizationDropdown.value;
        // Change the visualization based on the selection
        console.log('Switching to visualization: ', visualization);
        // Implement different visualizations here
    });
};

window.onload = InitDemo;

