import {CrowdSolver,type CrowdRequest} from './CrowdNavigation';
import type {NavigationSnapshot} from './NavigationWorld';
type Message={kind:'init';snapshot:NavigationSnapshot;epoch:number}|{kind:'targets';requests:CrowdRequest[];epoch:number;sequence:number};
const channel=self as unknown as {onmessage:(event:MessageEvent<Message>)=>void;postMessage:(message:unknown)=>void};
let solver:CrowdSolver|undefined,epoch=0,sequence=0,timer:ReturnType<typeof setTimeout>|undefined,lastReport=0;
function pump(){
 timer=undefined;if(!solver)return;
 const result=solver.advance(4,180);
 if(!result.expanded||performance.now()-lastReport>100){
  const report=solver.report(result.ms);
  channel.postMessage({epoch,sequence,...report});
  lastReport=performance.now();
  // Keep the existing frontier for later requests once every current start has a route.
  if(report.routes.every(route=>route.route.length))return;
 }
 if(result.expanded)timer=setTimeout(pump,12);
}
channel.onmessage=({data})=>{
 if(data.kind==='init'){if(timer)clearTimeout(timer);solver=new CrowdSolver(data.snapshot);epoch=data.epoch;sequence=0;timer=undefined;}
 else if(data.epoch===epoch&&solver){sequence=data.sequence;solver.setRequests(data.requests);if(!timer)timer=setTimeout(pump,0);}
};
