import { useCallback, useEffect, useRef, useState } from 'react'

/** 仅在主动点击后创建音频；离开页面释放，后台自动静音。 */
export function useUnformAudio(study: number, playing: boolean) {
  const audio = useRef<{ context: AudioContext; gain: GainNode; voices: OscillatorNode[] }>()
  const [enabled, setEnabled] = useState(false)
  const [failed, setFailed] = useState(false)
  const enabledRef = useRef(false)
  const playingRef = useRef(playing)
  playingRef.current = playing

  const syncVolume = useCallback(() => {
    const current = audio.current
    if (!current) return
    const audible = enabledRef.current && playingRef.current && !document.hidden
    current.gain.gain.setTargetAtTime(audible ? .045 : 0, current.context.currentTime, .3)
  }, [])

  const toggle = async () => {
    try {
      if (!audio.current) {
        const context = new AudioContext()
        const gain = context.createGain()
        gain.gain.value = 0
        const filter = context.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 700
        filter.connect(gain)
        gain.connect(context.destination)
        const voices = [55, 82.407, 110.12].map((frequency, i) => {
          const voice = context.createOscillator()
          voice.type = i === 1 ? 'triangle' : 'sine'
          voice.frequency.value = frequency
          voice.connect(filter)
          voice.start()
          return voice
        })
        audio.current = { context, gain, voices }
      }
      await audio.current.context.resume()
      enabledRef.current = !enabledRef.current
      setEnabled(enabledRef.current)
      setFailed(false)
      syncVolume()
    } catch { setFailed(true) }
  }

  useEffect(() => {
    const current = audio.current
    if (current) {
      const base = [55, 65.406, 73.416][study]
      current.voices.forEach((voice, i) => voice.frequency.setTargetAtTime(base * [1, 1.4983, 2.002][i], current.context.currentTime, .8))
    }
    syncVolume()
  }, [study, enabled, playing, syncVolume])

  useEffect(() => {
    document.addEventListener('visibilitychange', syncVolume)
    return () => {
      document.removeEventListener('visibilitychange', syncVolume)
      const current = audio.current
      audio.current = undefined
      current?.voices.forEach((voice) => voice.stop())
      void current?.context.close()
    }
  }, [syncVolume])

  return { enabled, failed, toggle }
}
