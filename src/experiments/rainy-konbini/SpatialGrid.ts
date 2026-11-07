const CELL=2.8;

export class SpatialGrid<T>{
 private cells=new Map<string,T[]>();
 private cell(value:number){return Math.floor(value/CELL);}

 add(value:T,minX:number,minZ:number,maxX:number,maxZ:number){
  for(let x=this.cell(minX);x<=this.cell(maxX);x++){
   for(let z=this.cell(minZ);z<=this.cell(maxZ);z++){
    const id=x+','+z;
    const bucket=this.cells.get(id);
    if(bucket)bucket.push(value);
    else this.cells.set(id,[value]);
   }
  }
 }
 at(x:number,z:number):readonly T[]{
  return this.cells.get(this.cell(x)+','+this.cell(z))??[];
 }
 someIn(minX:number,minZ:number,maxX:number,maxZ:number,test:(value:T)=>boolean){
  for(let x=this.cell(minX);x<=this.cell(maxX);x++){
   for(let z=this.cell(minZ);z<=this.cell(maxZ);z++){
    if(this.cells.get(x+','+z)?.some(test))return true;
   }
  }
  return false;
 }
}
