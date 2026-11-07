const chords=[
 [45,57,60,64,67], [43,55,59,62,65], [41,53,57,60,64], [40,52,55,59,62],
 [45,57,60,64,71], [50,57,60,65,69], [41,53,57,60,64], [43,55,59,62,67],
];
const melody=[
 [0.5,72],[1.5,76],[2.75,79],[4.25,74],[5.75,71],[7.25,67],
 [8.5,69],[9.75,72],[11,76],[12.75,74],[14.5,71],
 [16.5,72],[17.5,76],[18.75,83],[20.5,81],[21.75,77],[23.25,74],
 [24.75,76],[26.25,72],[28.5,74],[30.25,67],[31.25,71],
];
const combatBass=[33,33,33,33,34,34,37,39];
const combatLead=[81,76,82,76,87,82,85,76];

export function createBackgroundMusic(canvas:HTMLCanvasElement){
 let context:AudioContext|undefined, master:GainNode|undefined, timer=0;
 let cursor=0,beatIndex=0,muted=false,disposed=false;
 let combat=false,noise:AudioBuffer|undefined;
 const playing=new Set<AudioScheduledSourceNode>();
 const beat=.88;
 const combatBeat=60/136;

 const play=(voice:AudioScheduledSourceNode,envelope:GainNode,at:number,length:number)=>{
  playing.add(voice);
  voice.onended=()=>{
   playing.delete(voice);
   voice.disconnect();
   envelope.disconnect();
  };
  voice.start(at);
  voice.stop(at+length+.012);
 };

 const note=(midi:number,at:number,length:number,volume:number,type:OscillatorType,fallTo?:number)=>{
  if(!context||!master)return;
  const voice=context.createOscillator(),envelope=context.createGain();
  voice.type=type;
  voice.frequency.value=440*2**((midi-69)/12);
  if(fallTo){
   voice.frequency.setValueAtTime(voice.frequency.value,at);
   voice.frequency.exponentialRampToValueAtTime(fallTo,at+length*.85);
  }
  envelope.gain.setValueAtTime(.0001,at);
  envelope.gain.exponentialRampToValueAtTime(volume,at+Math.min(length*.3,type==='sine'?.18:.045));
  envelope.gain.exponentialRampToValueAtTime(.0001,at+length);
  voice.connect(envelope).connect(master);
  play(voice,envelope,at,length);
 };
 const drum=(at:number,length:number,volume:number)=>{
  if(!context||!master)return;
  if(!noise){
   noise=context.createBuffer(1,Math.ceil(context.sampleRate*.2),context.sampleRate);
   const samples=noise.getChannelData(0);
   for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
  }
  const voice=context.createBufferSource(),envelope=context.createGain();
  voice.buffer=noise;
  envelope.gain.setValueAtTime(volume,at);
  envelope.gain.exponentialRampToValueAtTime(.0001,at+length);
  voice.connect(envelope).connect(master);
  play(voice,envelope,at,length);
 };
 const combatStep=(index:number,at:number)=>{
  const step=index%16,bar=Math.floor(index/16)%8,bass=combatBass[bar];
  if([0,6,8,14].includes(step))note(47,at,.16,.38,'sine',41);
  if(step===4||step===12){drum(at,.125,.19);note(46,at,.085,.12,'triangle',64);}
  else if(step%2===0||step===15)drum(at,.027,step===15?.06:.035);
  if([0,3,6,8,10,14].includes(step))note(bass+(step===14?12:0),at,step===0?.29:.15,.15,'sawtooth');
  if(step===0){
   note(bass+24,at,combatBeat*3.8,.085,'triangle');
   note(bass+30,at+.06,combatBeat*3.5,.053,'triangle');
  }
  if(step===2||step===9||step===13)note(combatLead[bar]-(step===9?12:0),at,.26,.068,'triangle');
 };
 const schedule=()=>{
  if(!context||context.state!=='running'||muted||document.hidden)return;
  if(cursor<context.currentTime)cursor=context.currentTime+.06;
  while(cursor<context.currentTime+.75){
   const index=beatIndex%128,tick=index/4,chord=chords[Math.floor(tick/4)];
   if(combat){
    combatStep(index,cursor);
    cursor+=combatBeat/4;beatIndex++;
    continue;
   }
   if(index%16===0){
    note(chord[0],cursor,beat*3.7,.17,'sine');
    for(const [i,pitch] of chord.slice(1).entries())note(pitch,cursor+i*.04,beat*4.3,.047,'sine');
   }
   if(index%8===4)note(chord[2+(index%3)],cursor,beat*1.35,.071,'triangle');
   for(const [when,pitch] of melody)if(when===tick)note(pitch,cursor,beat*1.25,.083,'triangle');
   cursor+=beat/4;beatIndex++;
  }
 };
 const update=async(activate=false)=>{
  if(disposed||!globalThis.AudioContext)return;
  if(!context&&activate&&!muted){
   context=new AudioContext();
   master=context.createGain();master.gain.value=.26;
   const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1900;
   master.connect(filter).connect(context.destination);
   cursor=context.currentTime+.07;
  }
  if(!context)return;
  try{
   if(document.hidden||muted){
    clearInterval(timer);timer=0;
    await context.suspend();
   }else{
    await context.resume();
    if(disposed||muted||document.hidden)return;
    if(!timer)timer=window.setInterval(schedule,170);
    schedule();
   }
   if(!disposed)canvas.dataset.music=context.state;
  }catch{/* A later user gesture can retry playback. */}
 };
 const activate=(event:PointerEvent)=>{if(event.button===0)void update(true);};
 const key=(event:KeyboardEvent)=>{
  if(event.code==='KeyB'&&!event.repeat){
   event.preventDefault();
   muted=context? !muted : false;
   void update(true);
  }else if(!context)void update(true);
 };
 const visibility=()=>{void update();};
 canvas.addEventListener('pointerup',activate);
 canvas.addEventListener('keydown',key);
 document.addEventListener('visibilitychange',visibility);
 const setCombat=(active:boolean)=>{
  if(disposed||combat===active)return;
  combat=active;
  canvas.dataset.musicTheme=active?'combat':'ambient';
  beatIndex=0;
  if(context){
   const now=context.currentTime;
   for(const voice of playing)voice.stop(now+.025);
   cursor=now+.045;
  }
  void update(active);
 };
 const dispose=()=>{
  disposed=true;
  canvas.removeEventListener('pointerup',activate);canvas.removeEventListener('keydown',key);
  document.removeEventListener('visibilitychange',visibility);
  clearInterval(timer);
  if(context)void context.close().catch(()=>{});
  playing.clear();
 };
 canvas.dataset.musicTheme='ambient';
 return {setCombat,dispose};
}
