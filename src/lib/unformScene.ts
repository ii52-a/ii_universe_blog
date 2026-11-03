import * as THREE from 'three'
import type { UnformState } from '../content/unform'

export interface UnformScene {
  invalidate: () => void
  dispose: () => void
}

/** 独立的视觉舞台。按路由加载，暂停时按需渲染，卸载时释放全部 GPU 资源。 */
export function createUnformScene(
  host: HTMLElement,
  readState: () => UnformState,
  onUnavailable: () => void,
): UnformScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, host.clientWidth < 700 ? 1.5 : 1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 60)
  camera.position.set(0, 0, 8.8)
  // 程序生成摄影棚反光板，避免依赖远程 HDR 文件。
  const room = new THREE.Scene()
  room.background = new THREE.Color(0x101411)
  const panelGeometry = new THREE.PlaneGeometry(1, 1)
  const panelMaterials: THREE.MeshBasicMaterial[] = []
  const addPanel = (position: [number, number, number], size: [number, number], color: number, intensity: number) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    panelMaterials.push(material)
    const panel = new THREE.Mesh(panelGeometry, material)
    panel.position.set(...position)
    panel.scale.set(size[0], size[1], 1)
    panel.lookAt(0, 0, 0)
    room.add(panel)
  }
  addPanel([-4, 2, 3], [2.2, 7], 0xf0f5ff, 5)
  addPanel([4, 1, 1], [1.7, 6], 0xffffff, 4)
  addPanel([0, 6, 0], [7, 3], 0xffffff, 5)
  addPanel([1, -3, 2], [5, 1], 0xd6ff9e, 1.5)
  addPanel([-2, 1, -4], [3, 5], 0xc2cfff, 3)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(room, .035)
  scene.environment = environment.texture
  panelGeometry.dispose()
  panelMaterials.forEach((material) => material.dispose())
  pmrem.dispose()

  const mainLight = new THREE.DirectionalLight(0xffffff, 2)
  mainLight.position.set(-3, 5, 4)
  const edgeLight = new THREE.DirectionalLight(0xd3ff96, 1)
  edgeLight.position.set(3, -1, -2)
  const coolLight = new THREE.DirectionalLight(0xb6cbff, 1)
  coolLight.position.set(-4, 0, 1)
  scene.add(mainLight, edgeLight, coolLight)
  const root = new THREE.Group()
  scene.add(root)
  const groups = [new THREE.Group(), new THREE.Group(), new THREE.Group()]
  groups.forEach((group) => root.add(group))
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const timeUniform = { value: 0 }
  const energyUniform = { value: .55 }
  const pulseUniform = { value: 0 }
  const particleOpacity = { value: 0 }
  const alloyReveal = { value: 1 }

  // 01 / 镜面合金：真实环境反射与缓慢扭曲的连续曲面。
  const alloyGeometry = new THREE.TorusKnotGeometry(1.14, .43, 220, 36, 2, 3)
  geometries.push(alloyGeometry)
  const alloyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe1e5df, metalness: 1, roughness: .16,
    clearcoat: 1, clearcoatRoughness: .1, envMapIntensity: 1.4,
  })
  alloyMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform
    shader.uniforms.uEnergy = energyUniform
    shader.uniforms.uPulse = pulseUniform
    shader.uniforms.uReveal = alloyReveal
    shader.fragmentShader = `uniform float uReveal;\n${shader.fragmentShader}`.replace('#include <clipping_planes_fragment>', `
      #include <clipping_planes_fragment>
      float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      if (grain > uReveal) discard;
    `)
    shader.vertexShader = `uniform float uTime; uniform float uEnergy; uniform float uPulse;\n${shader.vertexShader}`
      .replace('#include <beginnormal_vertex>', `
        #include <beginnormal_vertex>
        float twist = sin(position.y * 1.5 + uTime * .45) * (.12 + uEnergy * .2) + uPulse * .15;
        mat2 spin = mat2(cos(twist), -sin(twist), sin(twist), cos(twist));
        objectNormal.xz = spin * objectNormal.xz;
      `)
      .replace('#include <begin_vertex>', `
        #include <begin_vertex>
        transformed.xz = spin * transformed.xz;
      `)
  }
  materials.push(alloyMaterial)
  const alloy = new THREE.Mesh(alloyGeometry, alloyMaterial)
  alloy.rotation.set(.35, -.3, -.35)
  groups[0].add(alloy)

  // 02 / 生长：斐波那契球面采样，顶点着色器中的波动与呼吸。
  const count = host.clientWidth < 600 ? 10500 : 18000
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const radius = Math.sqrt(1 - y * y)
    const theta = i * Math.PI * (3 - Math.sqrt(5))
    positions.set([Math.cos(theta) * radius, y, Math.sin(theta) * radius], i * 3)
    seeds[i] = ((i * 16807) % 2147483647) / 2147483647
  }
  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometries.push(particleGeometry)
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform, uEnergy: energyUniform, uPulse: pulseUniform,
      uOpacity: particleOpacity, uDpr: { value: renderer.getPixelRatio() },
    },
    vertexShader: `
      uniform float uTime, uEnergy, uPulse, uDpr;
      attribute float aSeed;
      varying float vLight;
      void main() {
        float azimuth = atan(position.z, position.x);
        float latitude = acos(clamp(position.y, -1., 1.));
        float wave = sin(azimuth * 5. + uTime * .75 + latitude * 3.)
          * sin(latitude * 4. - uTime * .5);
        float radius = 1.62 + wave * (.15 + uEnergy * .36) + uPulse * .17;
        vec3 pos = position * radius;
        pos.y += sin(azimuth * 3. + uTime) * .08 * uEnergy;
        vec4 mv = modelViewMatrix * vec4(pos, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp((2. + fract(aSeed * 97.) * 1.7) * uDpr * (5. / -mv.z), 1., 6.);
        vLight = .3 + .7 * pow((position.z + 1.) * .5, 1.5);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying float vLight;
      void main() {
        float circle = 1. - smoothstep(.16, .5, length(gl_PointCoord - .5));
        if(circle < .02) discard;
        vec3 color = mix(vec3(.42, .26, .8), vec3(.86, .79, 1.), vLight);
        gl_FragColor = vec4(color, circle * (.35 + vLight * .65) * uOpacity);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  materials.push(particleMaterial)
  groups[1].add(new THREE.Points(particleGeometry, particleMaterial))

  // 03 / 回环：36 条闭合空间曲线，沿环面展开成扭转的丝带。
  const ribbonMaterial = new THREE.LineBasicMaterial({ color: 0xffb08a, transparent: true, opacity: .8 })
  ribbonMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform
    shader.uniforms.uEnergy = energyUniform
    shader.vertexShader = `uniform float uTime; uniform float uEnergy;\n${shader.vertexShader}`
      .replace('#include <begin_vertex>', `
        #include <begin_vertex>
        float angle = sin(position.x * 1.8 + uTime * .65) * uEnergy * .23;
        transformed.yz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * transformed.yz;
      `)
  }
  materials.push(ribbonMaterial)
  for (let j = 0; j < 36; j++) {
    const points: THREE.Vector3[] = []
    const v = (j / 36) * Math.PI * 2
    for (let k = 0; k <= 240; k++) {
      const u = (k / 240) * Math.PI * 2
      const r = 1.25 + .56 * Math.cos(v + u * 3)
      points.push(new THREE.Vector3(r * Math.cos(u), r * Math.sin(u), .56 * Math.sin(v + u * 3)))
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    geometries.push(geometry)
    groups[2].add(new THREE.Line(geometry, ribbonMaterial))
  }
  groups[2].rotation.set(.5, .6, 0)

  let disposed = false
  let lost = false
  let frame = 0
  let previousTime = 0
  let elapsed = 0
  let turn = 0
  let energy = readState().energy
  let active = readState().study
  const weights: number[] = groups.map((_, index) => index === active ? 1 : 0)
  let lastImpulse = readState().impulse
  let pulse = 0
  let dragging = false
  let dragX = 0
  let dragY = 0
  let lastX = 0
  let lastY = 0
  let targetX = -.12
  let targetY = .05
  let rotationX = targetX
  let rotationY = targetY
  let velocityX = 0
  let velocityY = 0
  let hoverX = 0
  let hoverY = 0
  let width = 1
  let height = 1

  const requestFrame = () => {
    if (!frame && !disposed && !lost && !document.hidden) frame = requestAnimationFrame(draw)
  }
  const resize = () => {
    width = host.clientWidth
    height = host.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.position.z = camera.aspect < 1 ? 8.8 / camera.aspect : 8.3
    camera.updateProjectionMatrix()
    requestFrame()
  }

  function draw(now: number) {
    frame = 0
    if (disposed || lost || document.hidden) return
    const dt = previousTime ? Math.min((now - previousTime) / 1000, .04) : .016
    previousTime = now
    const state = readState()
    const animate = state.playing && !state.reducedMotion
    if (animate) { elapsed += dt; turn += dt * (.12 + energy * .22) }
    active = state.study
    weights.forEach((weight, index) => {
      const target = index === active ? 1 : 0
      weights[index] = state.reducedMotion ? target : weight + (target - weight) * (1 - Math.exp(-dt * 6))
      if (Math.abs(weights[index] - target) < .001) weights[index] = target
    })
    energy += (state.energy - energy) * Math.min(1, dt * 5)
    if (lastImpulse !== state.impulse) {
      lastImpulse = state.impulse
      pulse = state.reducedMotion ? 0 : 1
      targetY += 1.5 + (state.impulse % 3) * .6
      targetX = Math.sin(state.impulse * 2.4) * .8
    }
    pulse *= Math.exp(-dt * 2.5)
    if (!dragging) {
      targetX += velocityX
      targetY += velocityY
      velocityX *= Math.exp(-dt * 7)
      velocityY *= Math.exp(-dt * 7)
    }
    const smoothing = state.reducedMotion ? 1 : 1 - Math.exp(-dt * 7)
    rotationX += (targetX - rotationX) * smoothing
    rotationY += (targetY - rotationY) * smoothing
    root.rotation.set(rotationX + hoverY * .05, rotationY + turn + hoverX * .06, -.12)
    root.position.y = animate ? Math.sin(elapsed * .7) * .055 : root.position.y
    timeUniform.value = elapsed
    energyUniform.value = energy
    pulseUniform.value = pulse
    groups.forEach((group, index) => {
      group.visible = weights[index] > .001
      group.scale.setScalar(.68 + weights[index] * .32 + pulse * .045)
    })
    alloy.rotation.z = -.35 + Math.sin(elapsed * .35) * .12
    alloyReveal.value = weights[0]
    particleOpacity.value = weights[1]
    ribbonMaterial.opacity = .8 * weights[2]
    groups[2].rotation.z = elapsed * .04
    groups[2].scale.y *= 1 + Math.sin(elapsed * .5) * energy * .12
    renderer.render(scene, camera)
    const unsettled = weights[active] !== 1 || pulse > .001 || Math.abs(state.energy - energy) > .001
      || Math.abs(targetX - rotationX) + Math.abs(targetY - rotationY) > .001
      || Math.abs(velocityX) + Math.abs(velocityY) > .0001
    if (animate || unsettled) requestFrame()
  }

  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a, input')) return
    dragging = true
    lastX = dragX = event.clientX
    lastY = dragY = event.clientY
    velocityX = velocityY = 0
    host.setPointerCapture(event.pointerId)
    host.dataset.dragging = 'true'
    requestFrame()
  }
  const pointerMove = (event: PointerEvent) => {
    if (dragging) {
      const dx = (event.clientX - lastX) * .008
      const dy = (event.clientY - lastY) * .008
      targetY += dx
      targetX += dy
      velocityY = dx * .32
      velocityX = dy * .32
      lastX = event.clientX
      lastY = event.clientY
    } else if (event.pointerType === 'mouse' && !readState().reducedMotion) {
      const box = host.getBoundingClientRect()
      hoverX = (event.clientX - box.left) / width - .5
      hoverY = (event.clientY - box.top) / height - .5
      host.style.setProperty('--pointer-x', `${event.clientX - box.left}px`)
      host.style.setProperty('--pointer-y', `${event.clientY - box.top}px`)
    }
    requestFrame()
  }
  const pointerUp = (event: PointerEvent) => {
    if (!dragging) return
    dragging = false
    host.dataset.dragging = 'false'
    if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId)
    if (Math.hypot(event.clientX - dragX, event.clientY - dragY) < 5) targetY += .45
    if (readState().reducedMotion) velocityX = velocityY = 0
    requestFrame()
  }
  const pointerLeave = () => { hoverX = 0; hoverY = 0; requestFrame() }
  const keydown = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    if (event.key === 'ArrowLeft') targetY -= .3
    if (event.key === 'ArrowRight') targetY += .3
    if (event.key === 'ArrowUp') targetX -= .3
    if (event.key === 'ArrowDown') targetX += .3
    requestFrame()
  }
  const visibility = () => {
    previousTime = 0
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else requestFrame()
  }
  const contextLost = (event: Event) => {
    event.preventDefault()
    lost = true
    cancelAnimationFrame(frame)
    frame = 0
    onUnavailable()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  host.addEventListener('pointerdown', pointerDown)
  host.addEventListener('pointermove', pointerMove)
  host.addEventListener('pointerup', pointerUp)
  host.addEventListener('pointercancel', pointerUp)
  host.addEventListener('pointerleave', pointerLeave)
  host.addEventListener('keydown', keydown)
  canvas.addEventListener('webglcontextlost', contextLost)
  document.addEventListener('visibilitychange', visibility)
  resize()

  return {
    invalidate: requestFrame,
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      host.removeEventListener('pointerdown', pointerDown)
      host.removeEventListener('pointermove', pointerMove)
      host.removeEventListener('pointerup', pointerUp)
      host.removeEventListener('pointercancel', pointerUp)
      host.removeEventListener('pointerleave', pointerLeave)
      host.removeEventListener('keydown', keydown)
      canvas.removeEventListener('webglcontextlost', contextLost)
      document.removeEventListener('visibilitychange', visibility)
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      environment.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
