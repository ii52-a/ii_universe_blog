import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { orbitSystems, type OrbitBodyId, type OrbitSystemId } from '../content/orbitSystems'
import { createOrbitBackdrop } from './orbitBackdrop'

const flightKeys = { w: 'forward', s: 'back', a: 'left', d: 'right', q: 'down', e: 'up' } as const
export type FlightDirection = (typeof flightKeys)[keyof typeof flightKeys]
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
  gradient.addColorStop(0, '#ffffff')
  gradient.addColorStop(.29, '#ffffff9c')
  gradient.addColorStop(.5, '#ffffff2c')
  gradient.addColorStop(1, '#ffffff00')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createStarmapOrbitScene(host: HTMLDivElement, paused: () => boolean, onUnavailable: () => void,
  onLock: (state: 'locked' | 'idle' | 'unavailable') => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, host.clientWidth < 700 ? 1.4 : 1.75))
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(43, 1, .05, 1000)
  const overviewCenter = new THREE.Vector3(0, 0, 0)
  const home = new THREE.Vector3(14, 38, 46)
  const viewDirection = home.clone().normalize()
  camera.position.copy(home).add(overviewCenter)
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.target.copy(overviewCenter)
  controls.minDistance = 3
  controls.maxDistance = 280
  const backdrop = createOrbitBackdrop(scene, renderer.getPixelRatio())
  const stellarTime = { value: 0 }

  const sphere = new THREE.SphereGeometry(1, 64, 40)
  const solar = new THREE.ShaderMaterial({ vertexShader: vertex, uniforms: {
    baseColor: { value: new THREE.Color() }, detailColor: { value: new THREE.Color() },
    time: stellarTime,
  }, fragmentShader: `${surfaceNoise}
    uniform vec3 baseColor, detailColor;
    uniform float time;
    void main() {
      vec3 p = normalize(surface);
      vec3 flow = p + sin(p.zxy * 11.0 + time * .12) * .013;
      float grain = noise(flow * 79.0) * .40 + noise(flow * 29.0) * .37 + noise(flow * 10.0) * .23;
      float spots = (1.0-smoothstep(.20,.36,noise(p*13.0))) * .42;
      float facing = max(0.0, dot(normalize(normalWorld), normalize(cameraPosition - pointWorld)));
      vec3 color = mix(baseColor, detailColor, smoothstep(.19, .78, grain));
      gl_FragColor = vec4(color * (.63 + .67 * sqrt(facing)) * (1.0 - spots), 1.0);
      #include <colorspace_fragment>
    }
  ` })
  const planetary = new THREE.ShaderMaterial({ vertexShader: vertex, uniforms: {
    baseColor: { value: new THREE.Color() }, detailColor: { value: new THREE.Color() }, pattern: { value: 0 },
    lightOrigin: { value: new THREE.Vector3() },
    bandStrength: { value: 0 }, atmosphere: { value: 0 }, storm: { value: 0 },
  }, fragmentShader: `${surfaceNoise}
    uniform vec3 baseColor, detailColor;
    uniform vec3 lightOrigin;
    uniform float pattern;
    uniform float bandStrength, atmosphere, storm;
    void main() {
      vec3 p = normalize(surface), n = normalize(normalWorld);
      float terrain = noise(p * 5.0) * .52 + noise(p * 17.0) * .30 + noise(p * 47.0) * .18;
      float bands = .5 + .5 * sin(p.y * 41.0 + noise(p*9.0) * 4.0 + sin(p.x*5.0)*.6);
      float texture = pattern == 1.0 ? mix(terrain, bands, bandStrength) : terrain;
      vec3 ground = mix(baseColor, detailColor, smoothstep(.25, .77, texture));
      if (pattern == 0.0) ground *= .80 + noise(p*97.0)*.24;
      float spot = exp(-pow((p.y+.21)*12.0,2.0)-pow((p.z-.74)*8.0,2.0))*storm;
      ground = mix(ground,vec3(.49,.18,.09),spot*.73);
      float specular = 0.0;
      if (pattern == 2.0) {
        float continents = noise(p*2.8+vec3(2.0))*.73 + noise(p*8.5)*.21 + noise(p*27.0)*.06;
        float land = smoothstep(.48,.51,continents + sin(p.y*7.0)*.025);
        ground = mix(baseColor, detailColor, land);
        vec3 wind = p + sin(p.yzx*4.0)*.06;
        float clouds = noise(wind*9.0+vec3(3.0))*.47 + noise(wind*25.0)*.33 + noise(wind*67.0)*.20;
        ground = mix(ground, vec3(.77,.83,.87), smoothstep(.57,.70,clouds)*.88);
        ground = mix(ground,vec3(.74,.84,.9),smoothstep(.87,.96,abs(p.y)));
        vec3 halfway = normalize(normalize(lightOrigin-pointWorld)+normalize(cameraPosition-pointWorld));
        specular = pow(max(0.0,dot(n,halfway)),42.0) * (1.0-land) * .23;
      }
      float light = max(0.0, dot(n, normalize(lightOrigin - pointWorld)));
      float rim = pow(1.0 - max(0.0, dot(n, normalize(cameraPosition-pointWorld))), 3.0);
      vec3 haze = pattern == 2.0 ? vec3(.12,.33,.70) : detailColor;
      gl_FragColor = vec4(ground * (.045 + light * .99) + specular*light + rim * haze * atmosphere * (.12 + light), 1.0);
      #include <colorspace_fragment>
    }
  ` })
  const systems = new Map(orbitSystems.map(system => {
    const node = new THREE.Group()
    node.position.set(...system.center)
    scene.add(node)
    return [system.id, { ...system, node }] as const
  }))
  const bodies = new Map(orbitSystems.flatMap(system => system.bodies.map(body => {
    const stellar = body.orbit === 0
    const material = stellar ? solar.clone() : planetary.clone()
    material.uniforms.baseColor.value.set(body.base)
    material.uniforms.detailColor.value.set(body.detail)
    if (!stellar) {
      material.uniforms.pattern.value = body.surface
      material.uniforms.lightOrigin.value.set(...system.center)
      material.uniforms.bandStrength.value = body.id === 'jupiter' ? .69 : body.id === 'saturn' ? .48 : .15
      material.uniforms.atmosphere.value = body.id === 'earth' ? .45 : ['mercury', 'moon', 'pluto'].includes(body.id) ? 0 : .14
      material.uniforms.storm.value = body.id === 'jupiter' ? 1 : 0
    }
    if (stellar) material.uniforms.time = stellarTime
    const mesh = new THREE.Mesh(sphere, material)
    mesh.scale.setScalar(body.radius)
    const node = new THREE.Group()
    node.add(mesh)
    systems.get(system.id)!.node.add(node)
    return [body.id, { ...body, stellar, node, mesh, label: host.querySelector<HTMLElement>(`[data-body-label="${body.id}"]`) }] as const
  })))

  const saturnRings = [
    { inner: 1.12, outer: 1.34, color: 0xab8965, opacity: .50 },
    { inner: 1.35, outer: 1.56, color: 0xddc59e, opacity: .72 },
    { inner: 1.63, outer: 1.91, color: 0xbba784, opacity: .58 },
  ].map(({ inner, outer, color, opacity }) => {
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: { tint: { value: new THREE.Color(color) }, opacity: { value: opacity }, center: { value: new THREE.Vector3() } },
      fragmentShader: `${surfaceNoise}
        uniform vec3 tint, center;
        uniform float opacity;
        void main() {
          float radius = length(surface.xy);
          float grain = .72 + .16*sin(radius*164.0) + .12*sin(radius*573.0);
          vec3 light = normalize(-pointWorld);
          float along = dot(center-pointWorld,light);
          float shadow = along>0.0 ? 1.0-smoothstep(.73,.86,length(pointWorld+light*along-center)) : 0.0;
          gl_FragColor = vec4(tint * grain * (1.0-shadow*.84), opacity * grain);
          #include <colorspace_fragment>
        }
      ` })
    const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 96), material)
    ring.onBeforeRender = () => bodies.get('saturn')!.node.getWorldPosition(material.uniforms.center.value)
    ring.rotation.set(-Math.PI / 2 + .37, .15, -.16)
    bodies.get('saturn')!.node.add(ring)
    return ring
  })

  const glow = glowTexture()
  const coronaMaterials = orbitSystems.map(system => {
    const material = new THREE.SpriteMaterial({ map: glow, color: system.glow, transparent: true, opacity: .76, depthWrite: false, blending: THREE.AdditiveBlending })
    const corona = new THREE.Sprite(material)
    corona.scale.setScalar(9.2)
    systems.get(system.id)!.node.add(corona)
    return material
  })

  const orbitMaterials = new Map(orbitSystems.map(system => [system.id,
    new THREE.LineBasicMaterial({ color: system.orbitColor, transparent: true, opacity: .18 })]))
  const moonOrbit = new THREE.Group()
  scene.add(moonOrbit)
  function positionOnOrbit(target: THREE.Vector3, radius: number, angle: number, tilt = 0) {
    const depth = Math.sin(angle) * radius
    return target.set(Math.cos(angle) * radius, depth * Math.sin(tilt), depth * Math.cos(tilt))
  }
  const orbitGeometries = orbitSystems.flatMap(system => system.bodies.filter(body => body.orbit > 0).map(body => {
    const tilt = body.id === 'pluto' ? .26 : 0
    const geometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 160 }, (_, index) =>
      positionOnOrbit(new THREE.Vector3(), body.orbit, index / 160 * Math.PI * 2, tilt)))
    const ring = new THREE.LineLoop(geometry, orbitMaterials.get(system.id)!)
    if (body.id === 'moon') moonOrbit.add(ring)
    else systems.get(system.id)!.node.add(ring)
    return geometry
  }))

  function belt(count: number, inner: number, outer: number, color: number, size: number) {
    const coordinates = new Float32Array(count * 3)
    for (let index = 0; index < count; index++) {
      const angle = index * 2.399963
      const radius = inner + (outer - inner) * (.5 + .5 * Math.sin(index * 14.932))
      coordinates.set([Math.cos(angle) * radius, Math.sin(index * 21.41) * .24, Math.sin(angle) * radius], index * 3)
    }
    const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(coordinates, 3))
    const material = new THREE.PointsMaterial({ map: glow, color, size, transparent: true, opacity: .50, depthWrite: false,
      alphaTest: .015, blending: THREE.AdditiveBlending })
    const points = new THREE.Points(geometry, material)
    scene.add(points)
    return points
  }
  const asteroidBelt = belt(560, 7.65, 8.88, 0xae9b83, .065)
  const kuiperBelt = belt(700, 22.0, 26.1, 0x6d829b, .085)

  let frame = 0, last = 0, elapsed = 0, disposed = false, lost = false, aspect = 1, free = false
  let focused: OrbitBodyId | null = null, locked = false
  const savedOrbit = home.clone()
  const look = new THREE.Euler(0, 0, 0, 'YXZ')
  const keys = new Set<FlightDirection>()
  const movement = new THREE.Vector3(), forward = new THREE.Vector3(), right = new THREE.Vector3()
  const cameraOffset = new THREE.Vector3(), projected = new THREE.Vector3()
  let looking: { id: number; x: number; y: number } | null = null

  function move(directions: Iterable<FlightDirection>, distance: number) {
    camera.getWorldDirection(forward)
    right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    movement.set(0, 0, 0)
    for (const direction of directions) {
      if (direction === 'forward' || direction === 'back') movement.addScaledVector(forward, direction === 'forward' ? 1 : -1)
      else if (direction === 'left' || direction === 'right') movement.addScaledVector(right, direction === 'right' ? 1 : -1)
      else movement.y += direction === 'up' ? 1 : -1
    }
    camera.position.addScaledVector(movement.normalize(), distance).clampLength(0, 205)
  }

  const fitScale = () => Math.max(1, .95 / aspect)
  const reset = () => {
    focused = null
    controls.target.copy(overviewCenter)
    controls.minDistance = 3
    savedOrbit.copy(home).multiplyScalar(fitScale())
    camera.position.copy(savedOrbit).add(overviewCenter)
    if (free) { camera.lookAt(overviewCenter); look.setFromQuaternion(camera.quaternion, 'YXZ') }
    else controls.update()
    invalidate()
  }
  const invalidate = () => {
    if (!frame && !disposed && !lost && !document.hidden) frame = requestAnimationFrame(render)
  }
  function updateBodies() {
    for (const body of bodies.values()) {
      if (body.stellar) { body.mesh.rotation.y = elapsed * .08; continue }
      positionOnOrbit(body.node.position, body.orbit, body.phase + elapsed / body.period * Math.PI * 2, body.id === 'pluto' ? .26 : 0)
      body.mesh.rotation.y = elapsed * .28
    }
    const earth = bodies.get('earth')!.node.position
    bodies.get('moon')!.node.position.add(earth)
    moonOrbit.position.copy(earth)
    asteroidBelt.rotation.y = elapsed * .028
    kuiperBelt.rotation.y = elapsed * .012
  }

  function updateLabels() {
    const placed: { x: number; y: number }[] = []
    for (const body of bodies.values()) {
      if (!body.label) continue
      body.node.getWorldPosition(projected)
      const distance = projected.distanceTo(camera.position)
      projected.project(camera)
      const visible = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < .95 && Math.abs(projected.y) < .91
      body.label.hidden = !visible
      if (!visible) continue
      const x = (projected.x + 1) * 50
      let y = (1 - projected.y) * 50 + Math.min(12, body.radius / Math.max(distance, .1) * 130)
      for (const other of placed) if (Math.abs(other.x - x) < 5 && Math.abs(other.y - y) < 2.5) y = other.y + 2.6
      placed.push({ x, y })
      body.label.style.left = `${x}%`
      body.label.style.top = `${y}%`
    }
  }

  function render(now: number) {
    frame = 0
    if (disposed || lost || document.hidden) return
    const stopped = paused()
    if (last) {
      const delta = Math.min((now - last) / 1000, .05)
      if (!stopped) elapsed += delta
      if (free && keys.size) move(keys, delta * (5 + camera.position.length() * .19))
    }
    const running = !stopped || (free && keys.size > 0)
    last = running ? now : 0
    updateBodies()
    stellarTime.value = elapsed
    scene.updateMatrixWorld(true)
    if (!free && focused) {
      bodies.get(focused)!.node.getWorldPosition(projected)
      camera.position.add(cameraOffset.subVectors(projected, controls.target))
      controls.target.copy(projected)
    }
    backdrop.update(camera, elapsed)
    renderer.render(scene, camera)
    updateLabels()
    if (running) invalidate()
  }
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host
    if (!width || !height) return
    const oldAspect = aspect
    camera.aspect = aspect = width / height
    const fit = fitScale() / Math.max(1, .95 / oldAspect)
    if (free) savedOrbit.multiplyScalar(fit)
    else camera.position.copy(cameraOffset.subVectors(camera.position, controls.target).multiplyScalar(fit).add(controls.target))
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    invalidate()
  }
  const clearFlight = () => {
    keys.clear()
    if (looking && canvas.hasPointerCapture(looking.id)) canvas.releasePointerCapture(looking.id)
    looking = null
  }
  const unlock = () => { if (document.pointerLockElement === canvas) document.exitPointerLock() }
  const visibility = () => { last = 0; if (document.hidden) { clearFlight(); unlock(); cancelAnimationFrame(frame); frame = 0 } else invalidate() }
  const unavailable = (event: Event) => { event.preventDefault(); lost = true; unlock(); clearFlight(); onUnavailable() }
  const beginLook = (event: PointerEvent) => {
    if (!free || locked || !event.isPrimary || event.button !== 0) return
    looking = { id: event.pointerId, x: event.clientX, y: event.clientY }
    canvas.setPointerCapture(event.pointerId)
  }
  const turn = (x: number, y: number) => {
    look.y -= x * .004
    look.x = THREE.MathUtils.clamp(look.x - y * .004, -1.55, 1.55)
    camera.quaternion.setFromEuler(look)
    invalidate()
  }
  const updateLook = (event: PointerEvent) => {
    if (!looking || looking.id !== event.pointerId) return
    turn(event.clientX - looking.x, event.clientY - looking.y)
    looking.x = event.clientX
    looking.y = event.clientY
  }
  const lockedLook = (event: MouseEvent) => { if (locked) turn(event.movementX, event.movementY) }
  const lockChange = () => {
    const next = document.pointerLockElement === canvas
    if (next && (!free || lost)) { unlock(); return }
    if (next === locked) return
    locked = next
    clearFlight()
    onLock(locked ? 'locked' : 'idle')
  }
  const lockError = () => { if (!disposed && free && !lost && !locked) onLock('unavailable') }
  const endLook = (event: PointerEvent) => { if (looking?.id === event.pointerId) looking = null }
  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && locked) { unlock(); return }
    const direction = flightKeys[event.key.toLowerCase() as keyof typeof flightKeys]
    if (!free || lost || !direction || event.ctrlKey || event.metaKey || event.altKey || (event.target as Element | null)?.closest?.('input,textarea,[contenteditable]')) return
    event.preventDefault()
    keys.add(direction)
    invalidate()
  }
  const keyup = (event: KeyboardEvent) => keys.delete(flightKeys[event.key.toLowerCase() as keyof typeof flightKeys])
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  document.addEventListener('visibilitychange', visibility)
  document.addEventListener('pointerlockchange', lockChange)
  document.addEventListener('pointerlockerror', lockError)
  document.addEventListener('mousemove', lockedLook)
  canvas.addEventListener('webglcontextlost', unavailable)
  canvas.addEventListener('pointerdown', beginLook)
  canvas.addEventListener('pointermove', updateLook)
  canvas.addEventListener('lostpointercapture', endLook)
  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  window.addEventListener('blur', clearFlight)
  controls.addEventListener('change', invalidate)
  updateBodies()
  scene.updateMatrixWorld(true)
  resize()
  controls.update()

  function setFree(value: boolean) {
    if (value === free) return
    free = value
    controls.enabled = !free
    if (free) {
      savedOrbit.subVectors(camera.position, controls.target)
      look.setFromQuaternion(camera.quaternion, 'YXZ')
    } else {
      unlock()
      clearFlight()
      if (focused) bodies.get(focused)!.node.getWorldPosition(controls.target)
      camera.position.copy(savedOrbit).add(controls.target)
      controls.update()
    }
    invalidate()
  }

  return {
    invalidate, reset, setFree,
    lock() {
      setFree(true)
      if (typeof canvas.requestPointerLock !== 'function') { lockError(); return }
      try { void Promise.resolve(canvas.requestPointerLock()).catch(lockError) }
      catch { lockError() }
    },
    focusSystem(id: OrbitSystemId) {
      setFree(false)
      focused = null
      const system = systems.get(id)!
      controls.target.copy(system.node.position)
      controls.minDistance = 3
      camera.position.copy(controls.target).addScaledVector(viewDirection, system.radius * 2.7 * fitScale())
      controls.update()
      invalidate()
    },
    focus(id: OrbitBodyId) {
      setFree(false)
      const body = bodies.get(id)!
      focused = id
      body.node.getWorldPosition(controls.target)
      controls.minDistance = Math.max(.42, body.radius * 1.6)
      camera.position.copy(controls.target).addScaledVector(viewDirection, Math.max(2.35, body.radius * 6.4) * fitScale())
      controls.update()
      invalidate()
    },
    step(direction: FlightDirection) {
      if (!free) return
      move([direction], Math.max(.85, camera.position.length() * .032))
      invalidate()
    },
    zoom(step: number) {
      cameraOffset.subVectors(camera.position, controls.target)
      cameraOffset.setLength(THREE.MathUtils.clamp(cameraOffset.length() * step, controls.minDistance, controls.maxDistance))
      camera.position.copy(controls.target).add(cameraOffset)
      controls.update()
      invalidate()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      document.removeEventListener('pointerlockchange', lockChange)
      document.removeEventListener('pointerlockerror', lockError)
      document.removeEventListener('mousemove', lockedLook)
      unlock()
      clearFlight()
      canvas.removeEventListener('webglcontextlost', unavailable)
      canvas.removeEventListener('pointerdown', beginLook)
      canvas.removeEventListener('pointermove', updateLook)
      canvas.removeEventListener('lostpointercapture', endLook)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clearFlight)
      controls.dispose()
      for (const body of bodies.values()) body.mesh.material.dispose()
      for (const ring of saturnRings) { ring.geometry.dispose(); ring.material.dispose() }
      backdrop.dispose()
      for (const resource of [sphere, solar, planetary, glow, ...coronaMaterials, ...orbitMaterials.values(),
        asteroidBelt.geometry, asteroidBelt.material, kuiperBelt.geometry, kuiperBelt.material, ...orbitGeometries]) resource.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
