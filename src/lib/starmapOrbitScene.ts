import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const orbitRadius = 4.45
const initialAngle = -.32
const vertex = `
  varying vec3 surface;
  varying vec3 normalWorld;
  varying vec3 pointWorld;
  void main() {
    surface = position;
    normalWorld = mat3(modelMatrix) * normal;
    pointWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(pointWorld, 1.0);
  }
`

const surfaceNoise = `
  varying vec3 surface;
  varying vec3 normalWorld;
  varying vec3 pointWorld;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
`

function glowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, '#fff1b8')
  gradient.addColorStop(.29, '#fbc2669c')
  gradient.addColorStop(.5, '#e179362c')
  gradient.addColorStop(1, '#bd4a1a00')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createStarmapOrbitScene(host: HTMLDivElement, paused: () => boolean, onUnavailable: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(41, 1, .1, 100)
  const home = new THREE.Vector3(7.2, 5.1, 9.8)
  camera.position.copy(home)
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.minDistance = 7
  controls.maxDistance = 45

  const sphere = new THREE.SphereGeometry(1, 64, 40)
  const solar = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: `${surfaceNoise}
    void main() {
      vec3 p = normalize(surface);
      float grain = noise(p * 67.0) * .38 + noise(p * 24.0) * .35 + noise(p * 9.0) * .27;
      float facing = max(0.0, dot(normalize(normalWorld), normalize(cameraPosition - pointWorld)));
      vec3 color = mix(vec3(.82, .19, .027), vec3(1.0, .83, .42), smoothstep(.19, .78, grain));
      gl_FragColor = vec4(color * (.82 + .64 * sqrt(facing)), 1.0);
      #include <colorspace_fragment>
    }
  ` })
  const planetary = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: `${surfaceNoise}
    void main() {
      vec3 p = normalize(surface), n = normalize(normalWorld);
      float clouds = noise(p * 7.0) * .7 + noise(p * 28.0) * .3;
      float stripe = .5 + .5 * sin(p.y * 42.0 + clouds * 5.0);
      vec3 ground = mix(vec3(.045, .13, .21), vec3(.24, .43, .45), smoothstep(.15, .85, stripe * .52 + clouds * .48));
      float light = max(0.0, dot(n, normalize(-pointWorld)));
      float rim = pow(1.0 - max(0.0, dot(n, normalize(cameraPosition-pointWorld))), 3.0);
      gl_FragColor = vec4(ground * (.08 + light * .95) + rim * vec3(.045,.15,.22) * (.28 + light), 1.0);
      #include <colorspace_fragment>
    }
  ` })
  const star = new THREE.Mesh(sphere, solar)
  star.scale.setScalar(1.14)
  const planet = new THREE.Mesh(sphere, planetary)
  planet.scale.setScalar(.56)
  planet.rotation.z = .24

  const glow = glowTexture()
  const coronaMaterial = new THREE.SpriteMaterial({ map: glow, transparent: true, opacity: .76, depthWrite: false, blending: THREE.AdditiveBlending })
  const corona = new THREE.Sprite(coronaMaterial)
  corona.scale.setScalar(7.1)
  scene.add(corona, star, planet)

  const ringGeometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 180 }, (_, index) => {
    const angle = index / 180 * Math.PI * 2
    return new THREE.Vector3(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius)
  }))
  const ringMaterial = new THREE.LineBasicMaterial({ color: 0x6b7582, transparent: true, opacity: .51 })
  scene.add(new THREE.LineLoop(ringGeometry, ringMaterial))
  const points = new Float32Array(500 * 3)
  for (let index = 0; index < 500; index++) {
    const height = 1 - (index + .5) / 250
    const distance = Math.sqrt(1 - height * height) * 53
    const azimuth = index * 2.399963
    points.set([Math.cos(azimuth) * distance, height * 53, Math.sin(azimuth) * distance], index * 3)
  }
  const starsGeometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(points, 3))
  const starsMaterial = new THREE.PointsMaterial({ color: 0x9ba6ba, size: .065, transparent: true, opacity: .53 })
  scene.add(new THREE.Points(starsGeometry, starsMaterial))

  let frame = 0, last = 0, angle = initialAngle, disposed = false, lost = false, aspect = 1
  const reset = () => {
    camera.position.copy(home).multiplyScalar(Math.max(1, .95 / aspect))
    controls.update()
    invalidate()
  }
  const invalidate = () => {
    if (!frame && !disposed && !lost && !document.hidden) frame = requestAnimationFrame(render)
  }
  function render(now: number) {
    frame = 0
    if (disposed || lost || document.hidden) return
    const stopped = paused()
    if (!stopped && last) {
      const delta = Math.min((now - last) / 1000, .05)
      angle += delta * Math.PI * 2 / 24
      star.rotation.y += delta * .08
      planet.rotation.y += delta * .36
    }
    last = stopped ? 0 : now
    planet.position.set(orbitRadius * Math.cos(angle), 0, orbitRadius * Math.sin(angle))
    renderer.render(scene, camera)
    if (!stopped) invalidate()
  }
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host
    if (!width || !height) return
    const oldAspect = aspect
    camera.aspect = aspect = width / height
    camera.position.multiplyScalar(Math.max(1, .95 / aspect) / Math.max(1, .95 / oldAspect))
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    invalidate()
  }
  const visibility = () => { last = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else invalidate() }
  const unavailable = (event: Event) => { event.preventDefault(); lost = true; onUnavailable() }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  document.addEventListener('visibilitychange', visibility)
  canvas.addEventListener('webglcontextlost', unavailable)
  controls.addEventListener('change', invalidate)
  resize()
  controls.update()

  return {
    invalidate, reset,
    zoom(step: number) {
      camera.position.setLength(THREE.MathUtils.clamp(camera.position.length() * step, controls.minDistance, controls.maxDistance))
      controls.update()
      invalidate()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      canvas.removeEventListener('webglcontextlost', unavailable)
      controls.dispose()
      for (const resource of [sphere, solar, planetary, coronaMaterial, glow, ringGeometry, ringMaterial, starsGeometry, starsMaterial]) resource.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
