import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { alongWire, boardSize, createsFeedback, pinKey, pinPosition, pinsOf, wireDelay, wireRoute,
  type Bit, type Circuit, type Device, type Pin, type Point, type Wire, type simulate } from '../../lib/logicCircuit'

type Selection = { type: 'device' | 'wire'; id: string }
type Gesture = Selection | { type: 'pin'; pin: Pin } | { type: 'signal'; value: Bit }
type Drag = { pointer: number; origin: Point; gesture: Gesture; moved: boolean; position: Point }
type Preview = { from: Pin; point: Point } | { value: Bit; point: Point }

const placed = ({ x, y }: Point) => ({ left: `${x / boardSize.x * 100}%`, top: `${y / boardSize.y * 100}%` })
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const pinName = (pin: Pin) => pin.name === 'out' ? 'Q' : pin.name === 'in1' ? 'I1' : 'I2'
const pinLabel = (pin: Pin) => pin.device === 'A' ? 'A 输出端' : pin.device === 'Y' ? 'Y 输入端' : `${pin.device} ${pinName(pin)}`

interface Props {
  circuit: Circuit
  frame: ReturnType<typeof simulate>
  input: Bit
  elapsed: number
  onChange: (next: Circuit, topology?: boolean) => void
  onInput: (input: Bit) => void
  onReset: () => void
}

export function LogicCanvas({ circuit, frame, input, elapsed, onChange, onInput, onReset }: Props) {
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [source, setSource] = useState<Pin | null>(null)
  const [notice, setNotice] = useState('')
  const devices = new Map(circuit.devices.map(device => [device.id, device]))
  const pins = circuit.devices.flatMap(pinsOf)
  const location = (pin: Pin) => pinPosition(devices.get(pin.device)!, pin.name)
  const incoming = (pin: Pin) => circuit.wires.find(wire => pinKey(wire.to) === pinKey(pin))
  const route = (wire: Wire) => wireRoute(location(wire.from), location(wire.to), wire.bend)
  const selectedDevice = selection?.type === 'device' ? devices.get(selection.id) : null
  const canRemove = selection?.type === 'wire' || selectedDevice?.kind === 'nand'
  const nextGate = circuit.devices.filter(device => device.kind === 'nand').length

  function connect(from: Pin, to: Pin, moving?: Wire) {
    const occupied = incoming(to)
    const id = pinKey(to)
    const wires = circuit.wires.filter(wire => wire.id !== occupied?.id && wire.id !== moving?.id)
    if (createsFeedback(wires, from, to)) {
      setNotice('反馈回路无法用于这道组合逻辑关卡。')
      return
    }
    if (!occupied || pinKey(occupied.from) !== pinKey(from) || (moving && moving.id !== id)) {
      onChange({ ...circuit, wires: [...wires, { id, from, to, bend: moving?.bend }] }, true)
    }
    setSelection({ type: 'wire', id })
    setNotice('')
    setSource(null)
  }

  function tapPin(pin: Pin) {
    setNotice('')
    if (pin.name === 'out') setSource(source && pinKey(source) === pinKey(pin) ? null : pin)
    else if (source) connect(source, pin)
    else {
      const wire = incoming(pin)
      if (wire) setSelection({ type: 'wire', id: wire.id })
      else setNotice('从输出端拖出导线，或先选中输出端。')
    }
  }

  function editPosition(item: Selection, point: Point) {
    if (item.type === 'device') {
      const position = { x: clamp(point.x, 72, 648), y: clamp(point.y, 72, 312) }
      onChange({ ...circuit, devices: circuit.devices.map(device => device.id === item.id ? { ...device, position } : device) })
    } else {
      const bend = { x: clamp(point.x, 16, 704), y: clamp(point.y, 16, 368) }
      onChange({ ...circuit, wires: circuit.wires.map(wire => wire.id === item.id ? { ...wire, bend } : wire) })
    }
  }

  function nudge(event: KeyboardEvent, item: Selection, position: Point) {
    const offsets: Record<string, Point> = { ArrowUp: { x: 0, y: -12 }, ArrowDown: { x: 0, y: 12 },
      ArrowLeft: { x: -12, y: 0 }, ArrowRight: { x: 12, y: 0 } }
    const offset = offsets[event.key]
    if (!offset) return
    event.preventDefault()
    setSelection(item)
    editPosition(item, { x: position.x + offset.x, y: position.y + offset.y })
  }

  function begin(event: PointerEvent, gesture: Gesture, position?: Point) {
    if (event.button !== 0 || !event.isPrimary || drag.current) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointer: event.pointerId, gesture, moved: false,
      origin: { x: event.clientX, y: event.clientY }, position: position ?? { x: 0, y: 0 } }
    setNotice('')
    if (gesture.type === 'device' || gesture.type === 'wire') setSelection(gesture)
  }

  function track(event: PointerEvent) {
    const active = drag.current
    const bounds = stage.current?.getBoundingClientRect()
    if (!active || active.pointer !== event.pointerId || !bounds) return
    const delta = { x: event.clientX - active.origin.x, y: event.clientY - active.origin.y }
    if (!active.moved && Math.hypot(delta.x, delta.y) < 5) return
    active.moved = true
    const { gesture, position } = active
    if (gesture.type === 'device' || gesture.type === 'wire') editPosition(gesture, {
      x: position.x + delta.x / bounds.width * boardSize.x, y: position.y + delta.y / bounds.height * boardSize.y,
    })
    else if (gesture.type === 'signal') setPreview({ value: gesture.value, point: { x: event.clientX, y: event.clientY } })
    else if (gesture.type === 'pin') {
      const from = gesture.pin.name === 'out' ? gesture.pin : incoming(gesture.pin)?.from
      if (from) setPreview({ from, point: {
        x: clamp((event.clientX - bounds.left) / bounds.width * boardSize.x, 0, boardSize.x),
        y: clamp((event.clientY - bounds.top) / bounds.height * boardSize.y, 0, boardSize.y),
      } })
    }
  }

  function end(event: PointerEvent, cancelled = false) {
    const active = drag.current
    if (!active || active.pointer !== event.pointerId) return
    drag.current = null
    setPreview(null)
    if (cancelled) return
    const hit = document.elementFromPoint(event.clientX, event.clientY)
    const { gesture, moved } = active
    if (gesture.type === 'signal') {
      if (!moved || hit?.closest('[data-device="A"]')) onInput(gesture.value)
      else setNotice('把信号块放到输入 A 上。')
    } else if (gesture.type === 'pin') {
      if (!moved) { tapPin(gesture.pin); return }
      const moving = gesture.pin.name === 'out' ? undefined : incoming(gesture.pin)
      const from = gesture.pin.name === 'out' ? gesture.pin : moving?.from
      const targetKey = hit?.closest<HTMLElement>('[data-pin]')?.dataset.pin
      const to = pins.find(pin => pin.name !== 'out' && pinKey(pin) === targetKey)
      if (from && to) connect(from, to, moving)
      else if (from) setNotice('导线须落在输入端。')
    }
  }

  function remove() {
    if (!selection || !canRemove) return
    const { id, type } = selection
    onChange(type === 'wire' ? { ...circuit, wires: circuit.wires.filter(wire => wire.id !== id) } : {
      devices: circuit.devices.filter(device => device.id !== id),
      wires: circuit.wires.filter(wire => wire.from.device !== id && wire.to.device !== id),
    }, true)
    if (source?.device === id) setSource(null)
    setSelection(null)
    setNotice('')
  }

  function addGate() {
    const id = Array.from({ length: 6 }, (_, index) => `N${index + 1}`).find(candidate => !devices.has(candidate))
    if (!id) return
    const device: Device = { id, kind: 'nand', position: { x: 280 + nextGate % 3 * 65, y: nextGate % 2 ? 84 : 304 } }
    onChange({ ...circuit, devices: [...circuit.devices, device] })
    setSelection({ type: 'device', id })
  }

  return <section className="logic-panel" aria-label="电路画布"
    onPointerMove={track} onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)}
    onLostPointerCapture={event => end(event, true)}>
    <div className="logic-tools">
      <div className="logic-signals" role="group" aria-label="输入信号">
        <span>信号</span>{([0, 1] as const).map(value => <button key={value} type="button" data-signal={value}
          aria-pressed={input === value} aria-label={`输入信号 ${value}`}
          onPointerDown={event => begin(event, { type: 'signal', value })}
          onClick={event => { if (event.detail === 0) onInput(value) }}>{value}</button>)}
      </div>
      <div className="logic-tool-actions">
        <button type="button" onClick={addGate} disabled={nextGate >= 6}><Plus size={14} />与非门</button>
        <button type="button" onClick={remove} disabled={!canRemove} aria-label="删除选中"><Trash2 size={14} /></button>
        <button type="button" aria-label="重置" onClick={() => { onReset(); setSelection(null); setSource(null); setNotice('') }}><RotateCcw size={14} /></button>
      </div>
    </div>
    <div className="logic-stage" ref={stage} role="group" aria-label="元器件和导线">
      <svg viewBox={`0 0 ${boardSize.x} ${boardSize.y}`} aria-hidden="true">
        {circuit.wires.map(wire => {
          const { path, points } = route(wire)
          const signal = frame.wires.get(wire.id)
          const progress = signal ? (elapsed - signal.at) / wireDelay : -1
          const pulse = progress >= 0 && progress < 1 ? alongWire(points, progress) : null
          return <g key={wire.id} className="logic-route" data-wire={wire.id} data-selected={selection?.type === 'wire' && selection.id === wire.id}>
            <path className="logic-wire-shadow" d={path} />
            <path className="logic-wire" data-signal={progress >= 1 ? signal?.value : undefined} d={path} />
            <path className="logic-wire-hit" d={path} onPointerDown={event => begin(event, { type: 'wire', id: wire.id }, route(wire).handle)} />
            {pulse && <circle className="logic-pulse" data-signal={signal?.value} cx={pulse.x} cy={pulse.y} r="5" />}
          </g>
        })}
        {preview && 'from' in preview && <path className="logic-wire logic-wire--preview" d={wireRoute(location(preview.from), preview.point).path} />}
      </svg>
      {circuit.wires.map(wire => {
        const { handle } = route(wire)
        const item = { type: 'wire', id: wire.id } as const
        return <button key={wire.id} type="button" className="logic-bend" style={placed(handle)}
          aria-label={`移动导线 ${pinLabel(wire.from)} 到 ${pinLabel(wire.to)} 的拐点`}
          aria-pressed={selection?.type === 'wire' && selection.id === wire.id}
          onPointerDown={event => begin(event, item, handle)} onKeyDown={event => nudge(event, item, handle)}
          onClick={() => setSelection(item)} />
      })}
      {circuit.devices.map(device => {
        const item = { type: 'device', id: device.id } as const
        const pin = { device: device.id, name: device.kind === 'output' ? 'in1' : 'out' } as const
        const signal = frame.ports.get(pinKey(pin))
        const live = signal && elapsed >= signal.at ? signal.value : undefined
        const name = device.kind === 'nand' ? 'NAND' : device.kind === 'input' ? '输入' : '输出'
        return <button key={device.id} type="button" className="logic-device" data-device={device.id} data-kind={device.kind}
          data-signal={live} style={placed(device.position)} aria-label={`移动${name} ${device.id}，信号 ${live ?? '未到达'}`}
          aria-pressed={selection?.type === 'device' && selection.id === device.id}
          onPointerDown={event => begin(event, item, device.position)} onKeyDown={event => nudge(event, item, device.position)}
          onClick={() => setSelection(item)}>
          <span>{name}</span><strong>{device.id}</strong><b>{live ?? '—'}</b>
        </button>
      })}
      {pins.map(pin => {
        const id = pinKey(pin)
        const isOutput = pin.name === 'out'
        const signal = frame.ports.get(id)
        const live = signal && elapsed >= signal.at ? signal.value : undefined
        return <button key={id} type="button" className="logic-port" style={placed(location(pin))} data-pin={id} data-device={pin.device}
          data-signal={live} data-connected={Boolean(incoming(pin))} aria-label={pinLabel(pin)}
          aria-pressed={isOutput ? Boolean(source && pinKey(source) === id) : undefined}
          onPointerDown={event => begin(event, { type: 'pin', pin })} onClick={event => { if (event.detail === 0) tapPin(pin) }}>
          <span aria-hidden="true" />
        </button>
      })}
    </div>
    {preview && 'value' in preview && <span className="logic-drag-signal" data-signal={preview.value} aria-hidden="true"
      style={{ left: preview.point.x, top: preview.point.y }}>{preview.value}</span>}
    <p className="logic-foot" role="status">{notice || (source ? `已选 ${pinLabel(source)}，请选择输入端。` : '从输出端拖线。拖动元器件或导线拐点可调整布局。')}</p>
  </section>
}
