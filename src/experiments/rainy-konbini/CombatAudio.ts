/** Synthesized one-shot audio; no download, autoplay, loop or persistent timer. */
const SHOT_GAIN=2;
export class CombatAudio{
 muted=false;
 private context?:AudioContext;
 private noise?:AudioBuffer;
 shot(){
  if(this.muted)return;
  try{
   const context=this.context??=new AudioContext();
   if(context.state==='suspended')void context.resume().catch(()=>{});
   if(!this.noise){
    this.noise=context.createBuffer(1,Math.ceil(context.sampleRate*.13),context.sampleRate);
    const samples=this.noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(1-i/samples.length);
   }
   const now=context.currentTime,source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
   source.buffer=this.noise;filter.type='lowpass';filter.frequency.value=2100;
   gain.gain.setValueAtTime(.11*SHOT_GAIN,now);gain.gain.exponentialRampToValueAtTime(.001*SHOT_GAIN,now+.13);
   source.connect(filter).connect(gain).connect(context.destination);source.start();source.stop(now+.14);
   source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
   const thump=context.createOscillator(),bass=context.createGain();
   thump.frequency.setValueAtTime(150,now);thump.frequency.exponentialRampToValueAtTime(45,now+.09);
   bass.gain.setValueAtTime(.08*SHOT_GAIN,now);bass.gain.exponentialRampToValueAtTime(.001*SHOT_GAIN,now+.1);
   thump.connect(bass).connect(context.destination);thump.start();thump.stop(now+.11);thump.onended=()=>{thump.disconnect();bass.disconnect();};
  }catch{/* Audio restrictions never disable the simulated noise event. */}
 }
 dispose(){if(this.context)void this.context.close().catch(()=>{});this.context=undefined;this.noise=undefined;}
}
