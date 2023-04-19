const vertexShader =
    `#version 300 es

in vec4 a_position;

void main() {
    gl_Position = a_position;
}
`

const fragmentShader: string =
    `#version 300 es

precision highp float;

out vec4 outColor;

void main() {
    outColor = vec4(0, 0, 0.5, 1);
}
`

function main() {
    const canvas = document.getElementById("webgl");
    if (canvas === null) {
        console.error("unable to get canvas from id")
        return
    }

    const c = canvas as HTMLCanvasElement;
    c.height = 1000
    c.width = 1000

    let gl = c.getContext("webgl2");
    if (!gl) {
        console.log("unable to get webGL2 context")
        return
    }

    const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShader)
    if (vShader === null) {
        console.log("unable to create vertex shader")
        return
    }

    const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader)
    if (fShader === null) {
        console.log("unable to create fragment shader");
        return
    }

    const program = createProgram(gl, [vShader, fShader])
    if (program === null) {
        console.log("unable to create program")
        return
    }

    // now that the program is setup 
    // I need to create some data and supply it via a buffer to the GPU

    debugger;
    const positionLocation = gl.getAttribLocation(program, "a_position")
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = [
        0, 0,
        0, 0.6,
        0.7, 0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // need to bind this data to the position buffer in the shader
    const vertexArray = gl.createVertexArray()
    gl.bindVertexArray(vertexArray)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(program);
    gl.bindVertexArray(vertexArray)

    gl.drawArrays(gl.TRIANGLES, 0, 3)
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)
    if (shader === null) {
        console.log("unable to create shader", type)
        return null
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader);
    let ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (ok) {
        return shader
    }

    console.error(`unable to create ${type} - deleting shader`)
    console.log(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
}

function createProgram(gl: WebGL2RenderingContext, shaders: WebGLShader[]): WebGLProgram | null {
    const program = gl.createProgram()
    if (program === null) {
        console.log("unable to create program")
        return null
    }

    shaders.forEach(s => gl.attachShader(program, s))
    gl.linkProgram(program);
    const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (ok) {
        return program
    }

    console.error(`unable to create program - deleting`)
    gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    return null
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement | OffscreenCanvas) {
    if (canvas instanceof OffscreenCanvas) {
        return
    }

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    const shouldResize = canvas.width !== displayWidth ||
        canvas.height !== displayHeight

    if (!shouldResize) {
        return
    }

    canvas.width = displayWidth
    canvas.height = displayHeight
}

main()