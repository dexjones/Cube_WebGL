var vertexShaderText = 
[
'precision mediump float;', 
'',
'attribute vec3 vertPosition;', 
'attribute vec3 vertColor;', 
'attribute vec3 vertNormal;', 
'varying vec3 fragColor;', 
'varying vec3 vNormal;', 
'varying vec3 vPosition;', 
'varying vec3 lightDirection;', 
'uniform mat4 mWorld;', 
'uniform mat4 mView;', 
'uniform mat4 mProj;', 
'uniform vec4 uLightPosition;', 
'',
'void main()',
'{',
'   fragColor = vertColor;',
'   vNormal = (mWorld * vec4(vertNormal, 0.0)).xyz;', 
'   vPosition = (mWorld * vec4(vertPosition, 1.0)).xyz;', 
'   vec4 transformedLightPosition = mView * uLightPosition;', 
'   lightDirection = normalize(transformedLightPosition.xyz - (mView * vec4(vPosition, 1.0)).xyz);',
'   gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;', 
'',
'varying vec3 fragColor;', 
'varying vec3 vNormal;', 
'varying vec3 vPosition;', 
'varying vec3 lightDirection;', 
'uniform vec4 uLightAmbient;', 
'uniform vec4 uLightDiffuse;', 
'uniform vec4 uLightSpecular;', 
'uniform vec4 uMaterialAmbient;', 
'uniform vec4 uMaterialDiffuse;', 
'uniform vec4 uMaterialSpecular;', 
'uniform float uShininess;', 
'uniform float uAlpha;', 
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
'   gl_FragColor = vec4(color.rgb, uAlpha);',
'}'
].join('\n');

var fragmentShaderTextAlt =
[
'precision mediump float;', 
'',
'varying vec3 fragColor;', 
'void main()',
'{',
'   gl_FragColor = vec4(fragColor.r, fragColor.g, 1.0 - fragColor.b, 1.0);',
'}'
].join('\n');

var wireframeVertexShaderText = 
[
'precision mediump float;', 
'',
'attribute vec3 vertPosition;', 
'uniform mat4 mWorld;', 
'uniform mat4 mView;', 
'uniform mat4 mProj;', 
'',
'void main()',
'{',
'   gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);',
'}'
].join('\n');

var wireframeFragmentShaderText =
[
'precision mediump float;', 
'',
'void main()',
'{',
'   gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);', 
'}'
].join('\n');

var InitDemo = function() {
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

    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvas.width, canvas.height);

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
    var wireframeVertexShader = compileShader(wireframeVertexShaderText, gl.VERTEX_SHADER);
    var wireframeFragmentShader = compileShader(wireframeFragmentShaderText, gl.FRAGMENT_SHADER);

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
    var wireframeProgram = createProgram(wireframeVertexShader, wireframeFragmentShader);
    var currentProgram = program;
    gl.useProgram(currentProgram);

    var boxVertices = 
    [
        -1.0,  1.0, -1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
        -1.0,  1.0,  1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
         1.0,  1.0,  1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
         1.0,  1.0, -1.0,   0.5, 0.5, 0.5,   0.0,  1.0,  0.0,
        -1.0,  1.0,  1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        -1.0, -1.0,  1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        -1.0, -1.0, -1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        -1.0,  1.0, -1.0,   0.75, 0.25, 0.5,  -1.0,  0.0,  0.0,
        1.0,  1.0,  1.0,    0.25, 0.25, 0.75,  1.0,  0.0,  0.0,
        1.0, -1.0,  1.0,    0.25, 0.25, 0.75,  1.0,  0.0,  0.0,
        1.0, -1.0, -1.0,    0.25, 0.25, 0.75,  1.0,   0.0,  0.0,
        1.0,  1.0, -1.0,    0.25, 0.25, 0.75,  1.0,   0.0,  0.0,
        1.0, 1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
        1.0,-1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
        -1.0,-1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
        -1.0, 1.0,  1.0,   1.0, 0.0, 0.15,   0.0,  0.0,  1.0,
        1.0,  1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
        1.0, -1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
        -1.0, -1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
        -1.0,  1.0, -1.0,   0.0, 1.0, 0.15,   0.0,  0.0, -1.0,
        -1.0, -1.0,-1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
        -1.0, -1.0, 1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
        1.0, -1.0, 1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
        1.0, -1.0,-1.0,   0.5, 0.5, 1.0,   0.0, -1.0,  0.0,
    ];

    var boxIndices = 
    [
        0, 1, 2,
        0, 2, 3,
        5, 4, 6,
        6, 4, 7,
        8, 9, 10,
        8, 10, 11,
        13, 12, 14,
        15, 14, 12,
        16, 17, 18,
        16, 18, 19,
        21, 20, 22,
        22, 20, 23
    ];

    var boxEdgeIndices = 
    [
        0, 1,
        1, 2,
        2, 3,
        3, 0,
        4, 5,
        5, 6,
        6, 7,
        7, 4,
        8, 9,
        9, 10,
        10, 11,
        11, 8,
        12, 13,
        13, 14,
        14, 15,
        15, 12,
        16, 17,
        17, 18,
        18, 19,
        19, 16,
        20, 21,
        21, 22,
        22, 23,
        23, 20,
        0, 4,
        1, 5,
        2, 6,
        3, 7,
        8, 12,
        9, 13,
        10, 14,
        11, 15,
        16, 20,
        17, 21,
        18, 22,
        19, 23
    ];

    var boxVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    var boxIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    var boxEdgeIndexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxEdgeIndexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxEdgeIndices), gl.STATIC_DRAW);

    var linkAttribs = function(program) {
        var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
        var normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
        gl.vertexAttribPointer(
            positionAttribLocation, 
            3, 
            gl.FLOAT, 
            gl.FALSE, 
            9 * Float32Array.BYTES_PER_ELEMENT, 
            0 
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

    var linkWireframeAttribs = function(program) {
        var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, 
            3, 
            gl.FLOAT, 
            gl.FALSE, 
            9 * Float32Array.BYTES_PER_ELEMENT, 
            0 
        );

        gl.enableVertexAttribArray(positionAttribLocation);
    };

    linkAttribs(currentProgram);

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
    var alphaLoc = gl.getUniformLocation(currentProgram, "uAlpha");

    var lightPosition = [1.0, 1.0, 1.0, 1.0];
    var ambientLight = [0.2, 0.2, 0.2, 1.0];
    var diffuseLight = [1.0, 1.0, 1.0, 1.0];
    var specularLight = [1.0, 1.0, 1.0, 1.0];
    var materialAmbient = [0.0, 1.0, 1.0, 1.0];
    var materialDiffuse = [0.0, 1.0, 1.0, 1.0];
    var materialSpecular = [1.0, 1.0, 1.0, 1.0];
    var shininess = 80.0;
    var alpha = 1.0;

    gl.uniform4fv(lightPositionLoc, lightPosition);
    gl.uniform4fv(lightAmbientLoc, ambientLight);
    gl.uniform4fv(lightDiffuseLoc, diffuseLight);
    gl.uniform4fv(lightSpecularLoc, specularLight);
    gl.uniform4fv(materialAmbientLoc, materialAmbient);
    gl.uniform4fv(materialDiffuseLoc, materialDiffuse);
    gl.uniform4fv(materialSpecularLoc, materialSpecular);
    gl.uniform1f(shininessLoc, shininess);
    gl.uniform1f(alphaLoc, alpha);

    var worldMatrix = new Float32Array(16);
    var viewMatrix = new Float32Array(16);
    var projMatrix = new Float32Array(16);
    glMatrix.mat4.identity(worldMatrix);
    glMatrix.mat4.lookAt(viewMatrix, [0, 0, -5], [0, 0, 0], [0, 1, 0]);
    glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    var xRotationMatrix = new Float32Array(16);
    var yRotationMatrix = new Float32Array(16);
    var identityMatrix = new Float32Array(16);
    glMatrix.mat4.identity(identityMatrix);

    var angleX = 0;
    var angleY = 0;
    var zoom = -5;

    // Implement the painter's algorithm
    var calculateDepth = function(vertices, indices) {
        var depths = [];
        for (var i = 0; i < indices.length; i += 3) {
            var v1 = vertices.slice(indices[i] * 9, indices[i] * 9 + 3);
            var v2 = vertices.slice(indices[i + 1] * 9, indices[i + 1] * 9 + 3);
            var v3 = vertices.slice(indices[i + 2] * 9, indices[i + 2] * 9 + 3);
            var depth = (v1[2] + v2[2] + v3[2]) / 3;
            depths.push({ index: i, depth: depth });
        }
        return depths;
    };

    var paintersAlgorithm = function(depths) {
        depths.sort(function(a, b) {
            return b.depth - a.depth;
        });
    };

    var renderPolygons = function(gl, depths) {
        for (var i = 0; i < depths.length; i++) {
            var index = depths[i].index;
            var count = 3;
            var offset = index * Uint16Array.BYTES_PER_ELEMENT;
            gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, offset);
        }
    };

    var loop = function() {
        glMatrix.mat4.rotate(yRotationMatrix, identityMatrix, angleY, [0, 1, 0]);
        glMatrix.mat4.rotate(xRotationMatrix, identityMatrix, angleX, [1, 0, 0]);
        glMatrix.mat4.mul(worldMatrix, xRotationMatrix, yRotationMatrix);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);

        glMatrix.mat4.lookAt(viewMatrix, [0, 0, zoom], [0, 0, 0], [0, 1, 0]);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

        gl.clearColor(0.75, 0.85, 0.8, 1.0);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        var depths = calculateDepth(boxVertices, boxIndices);
        paintersAlgorithm(depths);

        if (currentProgram === wireframeProgram) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxEdgeIndexBufferObject);
            gl.drawElements(gl.LINES, boxEdgeIndices.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
            renderPolygons(gl, depths);
        }

        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    var updateUniforms = function() {
        gl.uniform4fv(lightAmbientLoc, ambientLight);
        gl.uniform4fv(lightDiffuseLoc, diffuseLight);
        gl.uniform1f(alphaLoc, alpha);
    };

    document.getElementById('ambient-slider').addEventListener('input', function(event) {
        var value = event.target.value / 100;
        ambientLight = [value, value, value, 1.0];
        updateUniforms();
    });

    document.getElementById('diffuse-slider').addEventListener('input', function(event) {
        var value = event.target.value / 100;
        diffuseLight = [value, value, value, 1.0];
        updateUniforms();
    });

    document.getElementById('transparency-slider').addEventListener('input', function(event) {
        var value = event.target.value / 100;
        alpha = value;
        updateUniforms();
    });

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

        angleY += deltaX * 0.01;
        angleX += deltaY * 0.01;

        lastMouseX = newX;
        lastMouseY = newY;
    });

    var zoomSlider = document.getElementById('zoom-slider');
    zoomSlider.addEventListener('input', function() {
        var minZoom = -10; 
        var maxZoom = -3;  
        zoom = minZoom + (zoomSlider.value / 100) * (maxZoom - minZoom);
    });

    var toggleShaderButton = document.getElementById('toggle-shader-button');
    toggleShaderButton.addEventListener('click', function() {
        currentProgram = (currentProgram === program) ? programAlt : program;
        gl.useProgram(currentProgram);
        linkAttribs(currentProgram);

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
        alphaLoc = gl.getUniformLocation(currentProgram, "uAlpha");

        gl.uniform4fv(lightPositionLoc, lightPosition);
        gl.uniform4fv(lightAmbientLoc, ambientLight);
        gl.uniform4fv(lightDiffuseLoc, diffuseLight);
        gl.uniform4fv(lightSpecularLoc, specularLight);
        gl.uniform4fv(materialAmbientLoc, materialAmbient);
        gl.uniform4fv(materialDiffuseLoc, materialDiffuse);
        gl.uniform4fv(materialSpecularLoc, materialSpecular);
        gl.uniform1f(shininessLoc, shininess);
        gl.uniform1f(alphaLoc, alpha);

        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
    });

    var visualizationDropdown = document.getElementById('visualization-dropdown');
    visualizationDropdown.addEventListener('change', function() {
        var visualization = visualizationDropdown.value;
        if (visualization === 'wireframe') {
            currentProgram = wireframeProgram;
            gl.useProgram(currentProgram);
            linkWireframeAttribs(currentProgram);
        } else {
            currentProgram = program;
            gl.useProgram(currentProgram);
            linkAttribs(currentProgram);
        }

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
        alphaLoc = gl.getUniformLocation(currentProgram, "uAlpha");

        gl.uniform4fv(lightPositionLoc, lightPosition);
        gl.uniform4fv(lightAmbientLoc, ambientLight);
        gl.uniform4fv(lightDiffuseLoc, diffuseLight);
        gl.uniform4fv(lightSpecularLoc, specularLight);
        gl.uniform4fv(materialAmbientLoc, materialAmbient);
        gl.uniform4fv(materialDiffuseLoc, materialDiffuse);
        gl.uniform4fv(materialSpecularLoc, materialSpecular);
        gl.uniform1f(shininessLoc, shininess);
        gl.uniform1f(alphaLoc, alpha);

        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
        gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
        gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
    });
};

window.onload = InitDemo;
