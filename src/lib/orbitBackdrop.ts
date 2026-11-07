import * as THREE from 'three'

function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function nebulaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1536
  canvas.height = 768
  const context = canvas.getContext('2d')!
  const pixels = context.createImageData(canvas.width, canvas.height)
  const random = randomSource(517)
  const gradients = Array.from({ length: 32 }, () => {
    const z = random() * 2 - 1, angle = random() * Math.PI * 2, r = Math.sqrt(1 - z * z)
    return [Math.cos(angle) * r, Math.sin(angle) * r, z]
  })
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
  function dot(x: number, y: number, z: number, dx: number, dy: number, dz: number) {
    let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647)
    hash = Math.imul(hash ^ hash >>> 13, 1274126177)
    const gradient = gradients[(hash ^ hash >>> 16) & 31]
    return gradient[0] * dx + gradient[1] * dy + gradient[2] * dz
  }
  function noise(x: number, y: number, z: number) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
    const dx = x - ix, dy = y - iy, dz = z - iz, u = fade(dx), v = fade(dy), w = fade(dz)
    const a = dot(ix, iy, iz, dx, dy, dz) * (1 - u) + dot(ix + 1, iy, iz, dx - 1, dy, dz) * u
    const b = dot(ix, iy + 1, iz, dx, dy - 1, dz) * (1 - u) + dot(ix + 1, iy + 1, iz, dx - 1, dy - 1, dz) * u
    const c = dot(ix, iy, iz + 1, dx, dy, dz - 1) * (1 - u) + dot(ix + 1, iy, iz + 1, dx - 1, dy, dz - 1) * u
    const d = dot(ix, iy + 1, iz + 1, dx, dy - 1, dz - 1) * (1 - u) + dot(ix + 1, iy + 1, iz + 1, dx - 1, dy - 1, dz - 1) * u
    return ((a * (1 - v) + b * v) * (1 - w) + (c * (1 - v) + d * v) * w) * 1.7
  }
  function clouds(x: number, y: number, z: number) {
    let total = 0, strength = .58
    for (let octave = 0; octave < 5; octave++) {
      total += noise(x, y, z) * strength
      const nextX = (x * .8 - y * .6) * 2.07 + 8.1
      const nextY = (x * .36 + y * .48 - z * .8) * 2.07 + 3.7
      const nextZ = (x * .48 + y * .64 + z * .6) * 2.07 - 5.3
      x = nextX; y = nextY; z = nextZ; strength *= .49
    }
    return total
  }
  for (let row = 0; row < canvas.height; row++) {
    const latitude = (row / canvas.height - .5) * Math.PI, horizontal = Math.cos(latitude), dy = Math.sin(latitude)
    for (let column = 0; column < canvas.width; column++) {
      const longitude = column / canvas.width * Math.PI * 2
      const dx = Math.cos(longitude) * horizontal, dz = Math.sin(longitude) * horizontal
      const warp = noise(dx * 3 + 11, dy * 3, dz * 3)
      const cloud = clouds(dx * 5 + warp * .8, dy * 5 + 4, dz * 5 - 3)
      const axis = dy * .86 + dx * .27 + dz * .43 + warp * .13
      const band = Math.exp(-axis * axis / .035)
      const detail = clouds(dx * 15 - 5, dy * 15 + warp, dz * 15 + 9)
      const thread = Math.pow(Math.max(0, .5 + cloud * .85), 2.2)
      const dust = Math.exp(-Math.pow(axis + detail * .10, 2) / .0015)
      const wisps = thread * band * (.65 + detail * .6) * (1 - dust * .76) * 1.65
      const warm = Math.max(0, noise(dx * 4 + 21, dy * 4, dz * 4))
      const glow = Math.pow(Math.max(0, cloud - .18), 2) * band
      const grain = random() * .7
      const offset = (row * canvas.width + column) * 4
      pixels.data[offset] = 1 + wisps * (29 + warm * 18) + glow * 19 + grain
      pixels.data[offset + 1] = 2 + wisps * (38 + warm * 10) + glow * 22 + grain
      pixels.data[offset + 2] = 4 + wisps * 59 + glow * 30 + grain
      pixels.data[offset + 3] = 255
    }
  }
  context.putImageData(pixels, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

function starMaterial(time: { value: number }, pixelRatio: number) {
  return new THREE.ShaderMaterial({
    uniforms: { time, pixelRatio: { value: pixelRatio } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float size;
      attribute float phase;
      attribute vec3 color;
      uniform float pixelRatio, time;
      varying vec3 glow;
      varying float brightness;
      void main() {
        vec4 point = modelViewMatrix * vec4(position,1.0);
        gl_Position = projectionMatrix * point;
        gl_PointSize = clamp(size * pixelRatio * 350.0 / max(20.0,-point.z), 1.0, 16.0);
        glow = color;
        brightness = .88 + .12 * sin(time * .34 + phase);
      }
    `,
    fragmentShader: `
      varying vec3 glow;
      varying float brightness;
      void main() {
        float radius = length(gl_PointCoord-.5)*2.0;
        if (radius>1.0) discard;
        float halo = exp(-radius*radius*6.0)*.46;
        float core = exp(-radius*radius*25.0);
        gl_FragColor = vec4(glow*brightness, (core+halo)*(1.0-smoothstep(.7,1.0,radius)));
        #include <colorspace_fragment>
      }
    `,
  })
}

export function createOrbitBackdrop(scene: THREE.Scene, pixelRatio: number) {
  const time = { value: 0 }
  const random = randomSource(9517)
  const sky = new THREE.Group()
  const nebula = nebulaTexture()
  const skyGeometry = new THREE.SphereGeometry(470, 48, 24)
  const skyMaterial = new THREE.MeshBasicMaterial({ map: nebula, side: THREE.BackSide, depthWrite: false, fog: false })
  const dome = new THREE.Mesh(skyGeometry, skyMaterial)
  dome.rotation.set(-.30, 0, .28)
  dome.renderOrder = -20
  sky.add(dome)
  scene.add(sky)

  const geometries: THREE.BufferGeometry[] = []
  const material = starMaterial(time, pixelRatio)
  function starCloud(count: number, positionAt: (index: number) => THREE.Vector3, clustered = false) {
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count), phases = new Float32Array(count)
    const color = new THREE.Color()
    for (let index = 0; index < count; index++) {
      positions.set(positionAt(index).toArray(), index * 3)
      const warm = random()
      color.setHSL(warm > .8 ? .10 : .59 + random() * .07, warm > .8 ? .28 : .19,
        .40 + Math.pow(random(), 2) * .50)
      colors.set(color.toArray(), index * 3)
      const bright = random()
      sizes[index] = (bright > .985 ? 7.2 : bright > .91 ? 3.5 : 1.1 + random() * 1.5) * (clustered ? 1.18 : 1)
      phases[index] = random() * Math.PI * 2
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geometries.push(geometry)
    return new THREE.Points(geometry, material)
  }
  sky.add(starCloud(6200, () => {
    const z = random() * 2 - 1, angle = random() * Math.PI * 2
    const radius = 330 + random() * 100, circle = Math.sqrt(1 - z * z) * radius
    return new THREE.Vector3(Math.cos(angle) * circle, z * radius, Math.sin(angle) * circle)
  }))

  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(.00001, random()))) * Math.cos(random() * Math.PI * 2)
  const clusters = [
    { center: [-155, -75, -180], spread: 10, count: 800 },
    { center: [83, -104, -254], spread: 18, count: 620 },
    { center: [-45, -230, -245], spread: 27, count: 430 },
  ]
  for (const cluster of clusters) {
    scene.add(starCloud(cluster.count, index => {
      const spread = cluster.spread * (index % 5 === 0 ? 2 : .66)
      return new THREE.Vector3(gaussian() * spread + cluster.center[0], gaussian() * spread + cluster.center[1], gaussian() * spread + cluster.center[2])
    }, true))
  }

  return {
    update(camera: THREE.Camera, elapsed: number) { sky.position.copy(camera.position); time.value = elapsed },
    dispose() {
      nebula.dispose()
      skyGeometry.dispose()
      skyMaterial.dispose()
      material.dispose()
      geometries.forEach(geometry => geometry.dispose())
    },
  }
}
