export class SurvivalState{
 health=100;stamina=100;time=0;invulnerableUntil=0;hurtUntil=0;exhausted=false;
 private recoveryDelay=0;
 get dead(){return this.health<=0;}
 get canSprint(){return !this.dead&&!this.exhausted&&this.stamina>0;}
 update(dt:number,sprinting:boolean,resting:boolean){
  if(this.dead)return;
  this.time+=dt;
  if(sprinting&&this.canSprint){this.stamina=Math.max(0,this.stamina-10*dt);this.recoveryDelay=1;if(this.stamina===0)this.exhausted=true;}
  else{
   this.recoveryDelay=Math.max(0,this.recoveryDelay-dt);
   if(resting||this.recoveryDelay===0)this.stamina=Math.min(100,this.stamina+(resting?28:6)*dt);
  }
  if(this.exhausted&&this.stamina>=20)this.exhausted=false;
 }
 damage(amount:number){
  if(this.dead||this.time<this.invulnerableUntil)return false;
  this.health=Math.max(0,this.health-amount);this.invulnerableUntil=this.time+.65;this.hurtUntil=this.time+.22;return true;
 }
 reset(){this.health=100;this.stamina=100;this.time=0;this.invulnerableUntil=0;this.hurtUntil=0;this.exhausted=false;this.recoveryDelay=0;}
}
