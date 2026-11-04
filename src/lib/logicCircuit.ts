export type Bit = 0 | 1
export type Point = { x: number; y: number }
export type Device = { id: string; kind: 'input' | 'nand' | 'output'; position: Point }
export type Pin = { device: string; name: 'in1' | 'in2' | 'out' }
export type Wire = { id: string; from: Pin; to: Pin; bend?: Point }
export type Circuit = { devices: Device[]; wires: Wire[] }
export type Signal = { value: Bit; at: number }

export const boardSize = { x: 720, y: 384 }
export const wireDelay = 300
export const pinKey = ({ device, name }: Pin) => `${device}:${name}`
export const invert = (bit: Bit): Bit => bit === 0 ? 1 : 0

export function initialCircuit(): Circuit {
  return {
    devices: [
      { id: 'A', kind: 'input', position: { x: 108, y: 192 } },
      { id: 'N1', kind: 'nand', position: { x: 360, y: 192 } },
      { id: 'Y', kind: 'output', position: { x: 612, y: 192 } },
    ],
    wires: [],
  }
}

export function pinsOf(device: Device): Pin[] {
  const names = device.kind === 'input' ? ['out'] as const
    : device.kind === 'output' ? ['in1'] as const : ['in1', 'in2', 'out'] as const
  return names.map(name => ({ device: device.id, name }))
}

export function pinPosition(device: Device, name: Pin['name']): Point {
  const { x, y } = device.position
  const isGate = device.kind === 'nand'
  return { x: x + (isGate ? 60 : 46) * (name === 'out' ? 1 : -1),
    y: y + (isGate && name !== 'out' ? name === 'in1' ? -37 : 37 : 0) }
}

export function createsFeedback(wires: Wire[], from: Pin, to: Pin): boolean {
  const reachable = new Set([to.device])
  const queue = [to.device]
  for (let index = 0; index < queue.length; index++) {
    if (queue[index] === from.device) return true
    for (const wire of wires) {
      if (wire.from.device !== queue[index] || reachable.has(wire.to.device)) continue
      reachable.add(wire.to.device)
      queue.push(wire.to.device)
    }
  }
  return false
}

export function simulate(circuit: Circuit, input: Bit) {
  const devices = new Map(circuit.devices.map(device => [device.id, device]))
  const incoming = new Map(circuit.wires.map(wire => [pinKey(wire.to), wire]))
  const ports = new Map<string, Signal | null>()
  const wires = new Map<string, Signal | null>()
  let duration = 0

  function resolve(pin: Pin): Signal | null {
    const key = pinKey(pin)
    if (ports.has(key)) return ports.get(key) ?? null
    const device = devices.get(pin.device)
    if (!device) return null

    // Mark the pin before resolving upstream dependencies so a cycle stays undefined.
    ports.set(key, null)
    let signal: Signal | null = null
    if (pin.name !== 'out') {
      const wire = incoming.get(key)
      if (wire) {
        const source = resolve(wire.from)
        wires.set(wire.id, source)
        if (source) signal = { value: source.value, at: source.at + wireDelay }
      }
    } else if (device.kind === 'input') signal = { value: input, at: 0 }
    else if (device.kind === 'nand') {
      const left = resolve({ device: device.id, name: 'in1' })
      const right = resolve({ device: device.id, name: 'in2' })
      if (left && right) signal = { value: left.value === 1 && right.value === 1 ? 0 : 1, at: Math.max(left.at, right.at) + 90 }
    }
    if (signal) duration = Math.max(duration, signal.at)
    ports.set(key, signal)
    return signal
  }

  for (const device of circuit.devices) pinsOf(device).forEach(resolve)
  return { ports, wires, output: ports.get('Y:in1')?.value ?? null, duration }
}

export function wireRoute(start: Point, end: Point, bend?: Point) {
  const exit = start.x + 14
  const entry = end.x - 14
  const forward = exit <= entry
  const top = Math.min(start.y, end.y)
  const bypass = top >= 80 ? top - 62 : Math.min(368, Math.max(start.y, end.y) + 62)
  const handle = bend ?? { x: (start.x + end.x) / 2, y: forward ? (start.y + end.y) / 2 : bypass }
  const points = [start, { x: exit, y: start.y }, forward ? { x: handle.x, y: start.y } : { x: exit, y: handle.y }, handle,
    { x: entry, y: handle.y }, { x: entry, y: end.y }, end]
  return { handle, points, path: points.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ') }
}

export function alongWire(points: Point[], progress: number): Point {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y))
  let remaining = progress * lengths.reduce((sum, length) => sum + length, 0)
  for (const [index, length] of lengths.entries()) {
    if (length > 0 && remaining <= length) {
      const from = points[index], to = points[index + 1], ratio = remaining / length
      return { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio }
    }
    remaining -= length
  }
  return points.at(-1)!
}
