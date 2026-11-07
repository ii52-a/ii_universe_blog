export type Vec3 = {x: number; y: number; z: number};
export enum EdgeType { WALK = 'WALK', SLOPE = 'SLOPE', JUMP_UP = 'JUMP_UP', DROP_DOWN = 'DROP_DOWN' }
export type Surface = {y: number; layer: string; normal: Vec3};
export type Node = Vec3 & {id: number; layer: string; normal: Vec3};
export type Arc = {from: Vec3; to: Vec3; vy: number; duration: number; gravity: number};
export type Edge = {to: number; cost: number; type: EdgeType; arc?: Arc};
/** Type describes the incoming edge. The first entry has type=null. */
export type PathEntry = {node: Node; type: EdgeType | null; arc?: Arc};
export type Graph = {nodes: Node[]; edges: Edge[][]; revision: number; config: Config};
export type Config = {
  cellSize: number; maxStepHeight: number; maxJumpHeight: number; maxJumpDistance: number;
  maxDropHeight: number; maxSlopeRadians: number; gravity: number; maxAirSpeed: number;
  radius: number; height: number; verticalWeight: number; jumpPenalty: number; dropPenalty: number;
  walkSample: number; arcStep: number; walkSpeed: number;
};
export const defaults: Config = {
  cellSize: .2, maxStepHeight: .28, maxJumpHeight: .79, maxJumpDistance: 1.65,
  maxDropHeight: 3.8, maxSlopeRadians: Math.PI / 4, gravity: 13, maxAirSpeed: 3.78,
  radius: .18, height: 1.84, verticalWeight: .7, jumpPenalty: 1.5, dropPenalty: 1,
  walkSample: .04, arcStep: 1 / 120, walkSpeed: 1.8,
};
/** All positions are feet. sweep checks a finite body, including floors and ceilings.
 * upperPadding encloses the parabola above its chord; it must not inflate downward.
 * surfaces returns ALL supports at XZ, never just the highest floor.
 */
export interface World {
  readonly revision: number;
  surfaces(x: number, z: number): Surface[];
  sweep(from: Vec3, to: Vec3, config: Config, upperPadding?: number): boolean;
}
export const distance = (a: Vec3, b: Vec3) => Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
export const horizontal = (a: Vec3, b: Vec3) => Math.hypot(a.x-b.x, a.z-b.z);
export const metric = (a: Vec3, b: Vec3, weight: number) => distance(a,b)+weight*Math.abs(a.y-b.y);
export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => ({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
export function validateConfig(c: Config) {
  for (const [key,value] of Object.entries(c)) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid navigation config: ${key}`);
  }
  for (const key of ['cellSize','gravity','maxAirSpeed','height','walkSample','arcStep','walkSpeed'] as const)
    if (c[key] === 0) throw new Error(`${key} must be positive`);
  if (c.maxSlopeRadians >= Math.PI/2) throw new Error('Slope limit must be less than pi/2');
}
