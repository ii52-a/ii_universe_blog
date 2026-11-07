import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createOrbitBackdrop } from './orbitBackdrop'
import { testGalaxies, testGalaxy, testInteraction, testPlanetPosition, type TestGalaxy, type TestLevel, type TestMapFrame } from './starmapTest'

export interface HierarchyState { level: TestLevel; body: string | null; moving: boolean; free: boolean; locked: boolean }
interface SceneOptions {
  paused: () => boolean; reduced: () => boolean
  inputBlocked: () => boolean
  onState: (state: HierarchyState) => void; onFrame: (frame: TestMapFrame) => void; onUnavailable: () => void
}
interface Layer { group: THREE.Group; materials: THREE.Material[]; amount: number }
interface CameraPose { position: THREE.Vector3; target: THREE.Vector3 }
interface Label { node: THREE.Object3D; element: HTMLElement | null; level: TestLevel; radius: number }

function randomSource(seed: number) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
}
const vertex = `
  varying vec3 local, world, normalWorld;
  void main() {
    local = position;
    world = (modelMatrix * vec4(position,1.0)).xyz;
    normalWorld = normalize(mat3(modelMatrix)*normal);
    gl_Position = projectionMatrix * viewMatrix * vec4(world,1.0);
  }
`
const noise = `
  float hash(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  float noise(vec3 p) {
    vec3 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
`

export function createStarmapHierarchyScene(host: HTMLDivElement, options: SceneOptions) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, host.clientWidth < 700 ? 1.35 : 1.75))
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const scene = new THREE.Scene()
  const space = new THREE.Group()
  scene.add(space)
  const camera = new THREE.PerspectiveCamera(44, 1, .06, 1000)
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.minDistance = 2
  controls.maxDistance = 210
  controls.minPolarAngle = .12
  controls.maxPolarAngle = Math.PI * .86
  const backdrop = createOrbitBackdrop(scene, renderer.getPixelRatio())
  const resources = new Set<{ dispose: () => void }>()
  const keep = <T extends { dispose: () => void }>(resource: T) => { resources.add(resource); return resource }
  const sphere = keep(new THREE.SphereGeometry(1, 48, 32))
  const plane = keep(new THREE.PlaneGeometry(2, 2))
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 128
  const context = glowCanvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.12, '#ffffffbd')
  gradient.addColorStop(.38, '#ffffff38'); gradient.addColorStop(1, '#ffffff00')
  context.fillStyle = gradient; context.fillRect(0, 0, 128, 128)
  const glow = keep(new THREE.CanvasTexture(glowCanvas))
  glow.colorSpace = THREE.SRGBColorSpace
  const time = { value: 0 }
  const root: Layer = { group: new THREE.Group(), materials: [], amount: 1 }
  space.add(root.group)
  const layers = new Map<TestLevel, Layer>([['overview', root]])
  const labels: Label[] = []
  const picks = new Map<TestLevel, THREE.Object3D[]>()
  const planets: { mesh: THREE.Mesh; planet: TestGalaxy['planets'][number] }[] = []
  const galaxies: THREE.Group[] = []
  const objects = new Map<string, THREE.Object3D>()
  const lights: { level: TestLevel; value: THREE.Vector3 }[] = []
  const state: HierarchyState = { level: 'overview', body: null, moving: false, free: false, locked: false }
  let elapsed = 0, frame = 0, previous = 0, disposed = false, lost = false, aspect = 1
  let transition: { from: CameraPose; to: CameraPose; level: TestLevel; body: string | null; started: number; world: boolean; spaceFrom: THREE.Vector3; spaceTo: THREE.Vector3; amounts: Map<TestLevel, number> } | null = null
  let entryCooldown = 0
  const previousDistances = new Map<string, number>()
  const vector = new THREE.Vector3(), projected = new THREE.Vector3(), direction = new THREE.Vector3()
  const view = new THREE.Vector3(8, 23, 33).normalize()
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2()
  const keys = new Set<string>(), look = new THREE.Euler(0, 0, 0, 'YXZ')
  const flightPose = { position: new THREE.Vector3(), target: new THREE.Vector3() }
  let press: { x: number; y: number; id: number } | null = null
  let lockPending = false
  let dragLook: { x: number; y: number; id: number } | null = null
  const emit = () => options.onState({ ...state })
  const fit = () => Math.max(1, .98 / aspect)
  const key = (level: TestLevel, body: string) => `${level}/${body}`
  function addLabel(node: THREE.Object3D, level: TestLevel, id: string, radius: number) {
    labels.push({ node, level, radius, element: host.querySelector<HTMLElement>(`[data-space-node="${key(level, id)}"]`) })
    objects.set(key(level, id), node)
  }
  function material<T extends THREE.Material>(layer: Layer, value: T) {
    keep(value); value.userData.baseOpacity = value.opacity; layer.materials.push(value); return value
  }
  function opacity(layer: Layer, amount: number) {
    layer.amount = amount; layer.group.visible = amount > .002
    for (const value of layer.materials) {
      value.opacity = value.userData.baseOpacity * amount
      if (value instanceof THREE.ShaderMaterial) value.uniforms.fade.value = amount
    }
  }
  function sprite(layer: Layer, color: string, size: number, alpha: number) {
    const value = material(layer, new THREE.SpriteMaterial({ map: glow, color, opacity: alpha,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    const object = new THREE.Sprite(value); object.scale.setScalar(size); return object
  }
  function createGalaxy(config: TestGalaxy) {
    const group = new THREE.Group(); group.position.set(...config.center); root.group.add(group)
    const disk = new THREE.Group(); disk.rotation.set(...config.inclination); group.add(disk); galaxies.push(disk)
    const random = randomSource(config.seed), count = 12500
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), sizes = new Float32Array(count)
    const color = new THREE.Color(), coreColor = new THREE.Color(config.color), armsColor = new THREE.Color(config.arms)
    for (let i = 0; i < count; i++) {
      const radius = Math.pow(random(), .75) * config.radius
      const arm = i % 3 * Math.PI * 2 / 3
      const scatter = (random() + random() + random() - 1.5) * (.18 + radius * .055)
      const angle = arm + radius * .34 + scatter
      const spread = (random() - .5) * (.3 + radius * .075)
      positions.set([Math.cos(angle) * radius + spread, (random() + random() - 1) * (.12 + Math.exp(-radius * .4) * 2), Math.sin(angle) * radius + spread], i * 3)
      color.copy(coreColor).lerp(armsColor, Math.min(1, radius / config.radius * 1.5)).multiplyScalar(.48 + random() * .63)
      colors.set(color.toArray(), i * 3)
      sizes[i] = random() > .97 ? 2.7 : .55 + random() * 1.0
    }
    const geometry = keep(new THREE.BufferGeometry())
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    const stars = material(root, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { fade: { value: 1 }, pixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute vec3 color; attribute float size; uniform float pixelRatio; varying vec3 tint;
        void main(){vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;
        gl_PointSize=clamp(size*pixelRatio*100.0/max(5.0,-p.z),1.0,14.0);tint=color;}`,
      fragmentShader: `uniform float fade; varying vec3 tint; void main(){float r=length(gl_PointCoord-.5)*2.0;
        if(r>1.0)discard;gl_FragColor=vec4(tint,exp(-r*r*4.0)*fade*.82);
        #include <colorspace_fragment>
      }`,
    }))
    disk.add(new THREE.Points(geometry, stars))
    const dust = material(root, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { fade: { value: 1 }, tint: { value: armsColor }, core: { value: coreColor } },
      vertexShader: vertex,
      fragmentShader: `${noise} varying vec3 local,world,normalWorld; uniform vec3 tint,core; uniform float fade;
        void main(){float r=length(local.xy);float a=atan(local.y,local.x);
          float arms=pow(.5+.5*cos(a*3.0-r*14.0),5.0);
          float cloud=noise(vec3(local.xy*15.0,1.0))*.6+noise(vec3(local.xy*41.0,2.0))*.4;
          float density=(arms*.28+.06)*exp(-r*2.3)*(1.0-smoothstep(.80,1.0,r));
          gl_FragColor=vec4(mix(core,tint,min(1.0,r*3.0)),density*cloud*fade);
          #include <colorspace_fragment>
        }`,
    }))
    const veil = new THREE.Mesh(plane, dust); veil.rotation.x = -Math.PI / 2; veil.scale.setScalar(config.radius); disk.add(veil)
    group.add(sprite(root, config.color, 10, .62), sprite(root, '#fff2db', 2.4, .86))
    const hit = new THREE.Mesh(sphere, keep(new THREE.MeshBasicMaterial({ visible: false })))
    hit.scale.set(config.radius * .85, 4, config.radius * .85); hit.userData.destination = config.id; group.add(hit)
    picks.set('overview', [...picks.get('overview') ?? [], hit])
    addLabel(group, 'overview', config.id, 2)
  }
  function createSystem(config: TestGalaxy) {
    const layer: Layer = { group: new THREE.Group(), materials: [], amount: 0 }
    layer.group.position.set(...config.center); space.add(layer.group); layers.set(config.id, layer)
    const starMaterial = material(layer, new THREE.ShaderMaterial({ vertexShader: vertex, transparent: true,
      uniforms: { fade: { value: 0 }, time, tint: { value: new THREE.Color(config.star.color) } },
      fragmentShader: `${noise} varying vec3 local,world,normalWorld; uniform vec3 tint; uniform float fade,time;
        void main(){vec3 p=normalize(local);float grain=noise(p*65.0+sin(p.zxy*9.0+time*.12)*.4)*.6+noise(p*21.0)*.4;
          float facing=max(0.0,dot(normalize(normalWorld),normalize(cameraPosition-world)));
          vec3 color=mix(tint*.57,vec3(1.0,.97,.85),smoothstep(.25,.8,grain));
          gl_FragColor=vec4(color*(.7+.45*sqrt(facing)),fade);
          #include <colorspace_fragment>
        }`,
    }))
    const star = new THREE.Mesh(sphere, starMaterial); star.scale.setScalar(config.star.radius); star.userData.body = 'star'; layer.group.add(star)
    layer.group.add(sprite(layer, config.star.color, 10, .77))
    addLabel(star, config.id, 'star', config.star.radius)
    const targets: THREE.Object3D[] = [star]
    for (const planet of config.planets) {
      const value = material(layer, new THREE.ShaderMaterial({ vertexShader: vertex, transparent: true,
        uniforms: { fade: { value: 0 }, base: { value: new THREE.Color(planet.color) }, detail: { value: new THREE.Color(planet.detail) },
          light: { value: new THREE.Vector3(...config.center) }, banded: { value: planet.ring ? .5 : .08 } },
        fragmentShader: `${noise} varying vec3 local,world,normalWorld; uniform vec3 base,detail,light; uniform float fade,banded;
          void main(){vec3 p=normalize(local),n=normalize(normalWorld);float land=noise(p*4.0)*.5+noise(p*16.0)*.3+noise(p*47.0)*.2;
            float bands=.5+.5*sin(p.y*39.0+noise(p*8.0)*3.0);vec3 ground=mix(base,detail,smoothstep(.22,.79,mix(land,bands,banded)));
            float sun=max(0.0,dot(n,normalize(light-world)));float rim=pow(1.0-max(0.0,dot(n,normalize(cameraPosition-world))),3.0);
            gl_FragColor=vec4(ground*(.05+sun)+detail*rim*.13*(.2+sun),fade);
            #include <colorspace_fragment>
          }`,
      }))
      lights.push({ level: config.id, value: value.uniforms.light.value })
      const mesh = new THREE.Mesh(sphere, value); mesh.scale.setScalar(planet.radius); mesh.userData.body = planet.id; layer.group.add(mesh)
      planets.push({ mesh, planet }); targets.push(mesh); addLabel(mesh, config.id, planet.id, planet.radius)
      if (planet.ring) {
        const ringValue = material(layer, new THREE.MeshBasicMaterial({ color: planet.detail, transparent: true, opacity: .34, side: THREE.DoubleSide, depthWrite: false }))
        const ring = new THREE.Mesh(keep(new THREE.RingGeometry(1.35, 1.95, 80)), ringValue)
        ring.rotation.set(-1.18, .15, -.12); mesh.add(ring)
      }
      const orbit = keep(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, i) =>
        new THREE.Vector3(Math.cos(i / 128 * Math.PI * 2) * planet.orbit, 0, Math.sin(i / 128 * Math.PI * 2) * planet.orbit))))
      layer.group.add(new THREE.LineLoop(orbit, material(layer, new THREE.LineBasicMaterial({ color: config.arms, transparent: true, opacity: .12 }))))
    }
    const random = randomSource(config.seed + 18), positions = new Float32Array(440 * 3)
    for (let i = 0; i < 440; i++) {
      const angle = random() * Math.PI * 2, radius = 7.7 + random() * .65
      positions.set([Math.cos(angle) * radius, (random() - .5) * .22, Math.sin(angle) * radius], i * 3)
    }
    layer.group.add(new THREE.Points(keep(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3))),
      material(layer, new THREE.PointsMaterial({ map: glow, color: config.arms, size: .075, opacity: .47, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))))
    picks.set(config.id, targets); opacity(layer, 0)
  }
  testGalaxies.forEach(config => { createGalaxy(config); createSystem(config) })

  function levelCenter(level: TestLevel, target: THREE.Vector3) {
    return level === 'overview' ? space.localToWorld(target.set(0, 0, 0)) : layers.get(level)!.group.getWorldPosition(target)
  }
  function levelAnchor(level: TestLevel, target: THREE.Vector3) {
    levelCenter(level, target)
    if (level === 'overview') target.z -= 2
    return target
  }
  function defaultPose(level: TestLevel, body: string | null = null): CameraPose {
    const config = testGalaxy(level), target = levelAnchor(level, new THREE.Vector3())
    let distance = config ? testInteraction.layerDistance : 100
    if (config && body) {
      const node = objects.get(key(level, body))
      if (node) { scene.updateMatrixWorld(true); node.getWorldPosition(target) }
      distance = body === 'star' ? config.star.radius * 6.2 : Math.max(4.1, (config.planets.find(p => p.id === body)?.radius ?? .7) * 7.2)
    }
    return { target, position: target.clone().addScaledVector(view, distance * fit()) }
  }
  function applyPose(pose: CameraPose) {
    camera.position.copy(pose.position); controls.target.copy(pose.target); controls.update()
  }
  const invalidate = () => { if (!disposed && !lost && !document.hidden && !frame) frame = requestAnimationFrame(render) }
  const unlock = () => { if (document.pointerLockElement === canvas) document.exitPointerLock() }
  function stopFlight() {
    unlock(); keys.clear(); dragLook = null; state.free = false; controls.enabled = true
  }
  function navigate(level: TestLevel, instant = false, body: string | null = null, { keepFlight = false, resetCamera = false } = {}) {
    if (disposed || lost || (level !== 'overview' && !testGalaxy(level))) return
    if (state.moving && !instant) return
    const world = !resetCamera && (!body || level !== state.level)
    const destination = defaultPose(level, body)
    const spaceTo = space.position.clone()
    if (world) {
      camera.getWorldDirection(direction)
      const distance = destination.position.distanceTo(destination.target)
      spaceTo.add(camera.position).addScaledVector(direction, distance).sub(destination.target)
    }
    if (!keepFlight) stopFlight()
    if (!world) keys.clear()
    state.moving = true; controls.enabled = world && !state.free
    transition = { from: { position: camera.position.clone(), target: controls.target.clone() },
      to: destination, level, body, started: performance.now(), world,
      spaceFrom: space.position.clone(), spaceTo,
      amounts: new Map([...layers].map(([id, layer]) => [id, layer.amount])) }
    if (instant || options.reduced()) arrive()
    else emit()
    invalidate()
  }
  function arrive() {
    if (!transition) return
    const destination = transition
    state.level = destination.level; state.body = destination.body; state.moving = false
    layers.forEach((layer, id) => { opacity(layer, id === state.level ? 1 : 0); layer.group.scale.setScalar(1) })
    if (destination.world) {
      space.position.copy(destination.spaceTo)
      scene.updateMatrixWorld(true)
      const anchor = state.body ? objects.get(key(state.level, state.body)) : null
      if (anchor) anchor.getWorldPosition(vector)
      else levelAnchor(state.level, vector)
      const distance = anchor ? destination.to.position.distanceTo(destination.to.target) : Math.max(2, camera.position.distanceTo(vector))
      camera.getWorldDirection(direction)
      controls.target.copy(camera.position).addScaledVector(direction, distance)
      if (anchor) space.position.add(controls.target).sub(vector)
    } else applyPose(destination.to)
    transition = null; controls.enabled = !state.free
    if (state.free) { look.setFromQuaternion(camera.quaternion, 'YXZ'); flightPose.position.copy(camera.position); flightPose.target.copy(controls.target) }
    entryCooldown = performance.now() + 1800
    previousDistances.clear()
    controls.maxDistance = state.level === 'overview' ? 210 : 100
    emit()
  }
  function updateBodies() {
    for (const { mesh, planet } of planets) {
      const position = testPlanetPosition(planet, elapsed)
      mesh.position.set(position.x, 0, position.z); mesh.rotation.y = elapsed * .07
    }
    galaxies.forEach((galaxy, index) => { galaxy.rotation.y = elapsed * (index ? -.018 : .022) })
    time.value = elapsed
  }
  function updateLabels() {
    const width = host.clientWidth, height = host.clientHeight, placed: { x: number; y: number }[] = []
    for (const label of labels) {
      const element = label.element
      if (!element) continue
      const amount = layers.get(label.level)!.amount
      label.node.getWorldPosition(vector); projected.copy(vector).project(camera)
      const visible = amount > .35 && projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < .97 && Math.abs(projected.y) < .97
      element.hidden = !visible
      if (!visible) continue
      const distance = camera.position.distanceTo(vector)
      const x = (projected.x + 1) * width / 2
      let y = (1 - projected.y) * height / 2 + Math.min(64, label.radius / distance * height * 1.2) + 12
      for (const other of placed) if (Math.abs(other.x - x) < 86 && Math.abs(other.y - y) < 23) y = other.y + 24
      placed.push({ x, y })
      element.style.transform = `translate(${x}px,${y}px) translateX(-50%)`
      element.style.opacity = String(amount)
      element.style.pointerEvents = !state.moving && label.level === state.level ? 'auto' : 'none'
    }
  }
  function render(now: number) {
    frame = 0
    if (disposed || lost || document.hidden) return
    const delta = previous ? Math.min((now - previous) / 1000, .08) : 0
    previous = now
    if (!options.paused()) elapsed += delta
    updateBodies()
    if (transition) {
      const progress = Math.min(1, (now - transition.started) / (transition.world ? testInteraction.transitionDurationMs : 1450))
      const smooth = progress * progress * (3 - 2 * progress)
      if (transition.world) space.position.lerpVectors(transition.spaceFrom, transition.spaceTo, smooth)
      else {
        camera.position.lerpVectors(transition.from.position, transition.to.position, smooth)
        controls.target.lerpVectors(transition.from.target, transition.to.target, smooth)
        camera.lookAt(controls.target)
      }
      host.dataset.entryPhase = transition.world ? progress < .4 ? 'shift' : 'reveal' : ''
      for (const [id, layer] of layers) {
        const from = transition.amounts.get(id) ?? 0, to = id === transition.level ? 1 : 0
        const reveal = transition.world ? THREE.MathUtils.smoothstep(progress, id === transition.level ? .3 : .15, id === transition.level ? 1 : .85) : smooth
        opacity(layer, THREE.MathUtils.lerp(from, to, reveal))
        if (id !== 'overview' && id === transition.level && from === 0) layer.group.scale.setScalar(.35 + reveal * .65)
      }
      if (progress === 1) arrive()
    }
    if (state.free && keys.size && !options.inputBlocked() && (!transition || transition.world)) {
      const speed = delta * (keys.has('shift') ? testInteraction.sprintSpeed : testInteraction.movementSpeed)
      camera.getWorldDirection(direction); vector.set(0, 0, 0)
      if (keys.has('w')) vector.add(direction); if (keys.has('s')) vector.sub(direction)
      direction.set(1, 0, 0).applyQuaternion(camera.quaternion)
      if (keys.has('d')) vector.add(direction); if (keys.has('a')) vector.sub(direction)
      if (keys.has('q')) vector.y--; if (keys.has('e')) vector.y++
      camera.position.addScaledVector(vector.normalize(), speed)
      levelCenter(state.level, vector); camera.position.sub(vector).clampLength(0, 180).add(vector)
    } else if (!transition && !state.free && state.body && state.level !== 'overview') {
      const node = objects.get(key(state.level, state.body))
      if (node) { node.getWorldPosition(vector); camera.position.add(projected.subVectors(vector, controls.target)); controls.target.copy(vector) }
    }
    if (!transition && state.level === 'overview' && !options.inputBlocked() && now > entryCooldown) {
      camera.getWorldDirection(direction)
      for (const galaxy of testGalaxies) {
        objects.get(key('overview', galaxy.id))!.getWorldPosition(vector).sub(camera.position)
        const distance = vector.length(), previousDistance = previousDistances.get(galaxy.id) ?? distance
        previousDistances.set(galaxy.id, distance)
        if (distance < galaxy.radius * testInteraction.enterDistanceRatio && distance < previousDistance - .005 && vector.normalize().dot(direction) > .65) {
          navigate(galaxy.id, false, null, { keepFlight: state.free }); break
        }
      }
    }
    if (!transition) host.dataset.entryPhase = ''
    host.dataset.cameraDistance = camera.position.distanceTo(controls.target).toFixed(3)
    host.dataset.cameraPose = JSON.stringify([...camera.position.toArray(), ...camera.quaternion.toArray()])
    host.dataset.sceneOffset = space.position.toArray().join(',')
    backdrop.update(camera, elapsed)
    scene.updateMatrixWorld(true)
    lights.forEach(light => levelCenter(light.level, light.value))
    renderer.render(scene, camera); updateLabels()
    camera.getWorldDirection(direction)
    levelCenter(state.level, vector)
    options.onFrame({ time: elapsed, x: camera.position.x - vector.x, z: camera.position.z - vector.z, heading: Math.atan2(direction.x, -direction.z) })
    if (!options.paused() || transition || (state.free && keys.size)) invalidate()
    else previous = 0
  }
  function resize() {
    const width = host.clientWidth, height = host.clientHeight
    if (!width || !height) return
    const oldFit = fit(); aspect = width / height; camera.aspect = aspect
    const ratio = fit() / oldFit
    camera.position.sub(controls.target).multiplyScalar(ratio).add(controls.target)
    if (transition && !transition.world) for (const pose of [transition.from, transition.to]) pose.position.sub(pose.target).multiplyScalar(ratio).add(pose.target)
    camera.updateProjectionMatrix(); renderer.setSize(width, height); invalidate()
  }
  function pick(clientX: number, clientY: number) {
    const bounds = canvas.getBoundingClientRect()
    pointer.set((clientX - bounds.x) / bounds.width * 2 - 1, 1 - (clientY - bounds.y) / bounds.height * 2)
    raycaster.setFromCamera(pointer, camera)
    return raycaster.intersectObjects(picks.get(state.level) ?? [], false)[0]?.object
  }
  function select(event: MouseEvent, instant = false) {
    if (state.free || state.moving) return
    const object = pick(event.clientX, event.clientY)
    if (object?.userData.destination) navigate(object.userData.destination, instant)
    else if (object?.userData.body) navigate(state.level, instant, object.userData.body)
  }
  const pointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return
    press = { x: event.clientX, y: event.clientY, id: event.pointerId }
    if (state.free && !state.locked) { requestLock(); dragLook = { ...press }; canvas.setPointerCapture(event.pointerId) }
  }
  const pointerMove = (event: PointerEvent) => {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press = null
    if (dragLook?.id === event.pointerId) {
      turn(event.clientX - dragLook.x, event.clientY - dragLook.y); dragLook.x = event.clientX; dragLook.y = event.clientY
    }
    if (!state.free && !state.moving) canvas.style.cursor = pick(event.clientX, event.clientY) ? 'pointer' : 'grab'
  }
  const pointerUp = (event: PointerEvent) => {
    if (press?.id === event.pointerId) select(event)
    press = null; dragLook = null
  }
  const pointerCancel = () => { press = null; dragLook = null }
  const contextMenu = (event: MouseEvent) => { event.preventDefault(); select(event, true) }
  const wheelTarget = (event: WheelEvent) => {
    if (event.deltaY >= 0 || state.free || state.moving || state.level !== 'overview') return
    const destination = pick(event.clientX, event.clientY)?.userData.destination as TestLevel | undefined
    const galaxy = destination && testGalaxy(destination)
    if (galaxy) { objects.get(key('overview', galaxy.id))!.getWorldPosition(controls.target); controls.update() }
  }
  function turn(x: number, y: number) {
    look.y -= x * .003; look.x = THREE.MathUtils.clamp(look.x - y * .003, -1.54, 1.54)
    camera.quaternion.setFromEuler(look); invalidate()
  }
  const mouseMove = (event: MouseEvent) => { if (state.locked) turn(event.movementX, event.movementY) }
  const lockChange = () => {
    const locked = document.pointerLockElement === canvas
    if (locked && (!state.free || disposed || lost || options.inputBlocked())) { unlock(); return }
    state.locked = locked; keys.clear(); emit()
  }
  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && state.free && !options.inputBlocked()) {
      event.preventDefault(); event.stopImmediatePropagation(); unlock(); keys.clear(); return
    }
    if (!state.free || (state.moving && !transition?.world) || options.inputBlocked() || event.ctrlKey || event.metaKey || event.altKey || (event.target as Element | null)?.closest?.('input,textarea,[contenteditable]')) return
    if (['w', 'a', 's', 'd', 'q', 'e', 'shift'].includes(event.key.toLowerCase())) { event.preventDefault(); keys.add(event.key.toLowerCase()); invalidate() }
  }
  const keyup = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase())
  const blur = () => { keys.clear(); press = null; dragLook = null }
  const visibility = () => { previous = 0; if (document.hidden) { blur(); unlock(); cancelAnimationFrame(frame); frame = 0 } else invalidate() }
  const unavailable = (event: Event) => { event.preventDefault(); lost = true; stopFlight(); cancelAnimationFrame(frame); frame = 0; options.onUnavailable() }
  canvas.addEventListener('pointerdown', pointerDown)
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerup', pointerUp)
  canvas.addEventListener('pointercancel', pointerCancel)
  canvas.addEventListener('contextmenu', contextMenu)
  canvas.addEventListener('wheel', wheelTarget, { capture: true, passive: true })
  canvas.addEventListener('webglcontextlost', unavailable)
  document.addEventListener('pointerlockchange', lockChange)
  document.addEventListener('mousemove', mouseMove)
  document.addEventListener('visibilitychange', visibility)
  window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur)
  controls.addEventListener('change', invalidate)
  const observer = new ResizeObserver(resize); observer.observe(host)
  updateBodies(); applyPose(defaultPose('overview')); resize(); emit()
  function requestLock() {
    if (disposed || lost || (state.moving && !transition?.world) || state.locked || lockPending) return
    lockPending = true
    try { void Promise.resolve(canvas.requestPointerLock?.()).catch(() => {}).finally(() => { lockPending = false }) }
    catch { lockPending = false }
  }
  return {
    navigate, invalidate,
    reset() { navigate(state.level, false, null, { resetCamera: true }) },
    zoom(factor: number) { if (!state.free && !state.moving) { vector.subVectors(camera.position, controls.target).multiplyScalar(factor).clampLength(controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(vector); controls.update(); invalidate() } },
    release() { unlock(); keys.clear() },
    resume() {
      if (disposed || lost) return
      if (!state.free) { flightPose.position.copy(camera.position); flightPose.target.copy(controls.target) }
      state.free = true; controls.enabled = false; look.setFromQuaternion(camera.quaternion, 'YXZ'); emit(); requestLock(); invalidate()
    },
    flight() {
      if (state.moving) return
      if (state.free) { stopFlight(); applyPose(flightPose); emit(); invalidate(); return }
      flightPose.position.copy(camera.position); flightPose.target.copy(controls.target)
      state.free = true; controls.enabled = false; look.setFromQuaternion(camera.quaternion, 'YXZ'); emit()
      requestLock()
      invalidate()
    },
    dispose() {
      disposed = true; unlock(); cancelAnimationFrame(frame); observer.disconnect(); controls.dispose()
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove); canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', pointerCancel); canvas.removeEventListener('contextmenu', contextMenu); canvas.removeEventListener('webglcontextlost', unavailable)
      canvas.removeEventListener('wheel', wheelTarget, true)
      document.removeEventListener('pointerlockchange', lockChange); document.removeEventListener('mousemove', mouseMove); document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur)
      backdrop.dispose(); resources.forEach(resource => resource.dispose()); renderer.dispose(); canvas.remove()
    },
  }
}
