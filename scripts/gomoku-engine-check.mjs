import assert from 'node:assert/strict'
import { build } from 'esbuild'

const bundle = await build({ stdin: { contents: "export * from './src/lib/gomoku/engine.ts'; export * from './src/lib/gomoku/rules.ts'", resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' })
const { GomokuEngine, winningLine, validHistory, undoCount, searchBudget, availableStrength, strengthLabels } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
assert.deepEqual(strengthLabels,{quick:'太阳系',deep:'古德尔带',maximum:'银河系'})
for (const completed of [0,1,2,3,4,5,7,8,9,100]) {
  assert.equal(searchBudget('quick',completed),1200)
  assert.equal(searchBudget('deep',completed),completed<5?1200:3000)
  assert.equal(searchBudget('maximum',completed),completed<3?2500:completed<8?4000:6000)
  for(const strength of ['quick','deep','maximum']) {
    assert.equal(availableStrength(strength,false),'quick')
    assert.equal(availableStrength(strength,true),strength)
  }
}
const index = (r, c) => r * 15 + c
const fixtures = []
const check = (name, black, white, side, expected, timeMs = 200) => {
  const board = new Int8Array(225)
  black.forEach(([r, c]) => { board[index(r, c)] = 1 })
  white.forEach(([r, c]) => { board[index(r, c)] = 2 })
  const engine = new GomokuEngine(board)
  const before = Array.from(engine.board)
  const result = engine.choose(side, { timeMs })
  assert.equal(result.candidates[0], result.move)
  assert.ok(result.candidates.length <= 3 && new Set(result.candidates).size === result.candidates.length)
  assert.ok(result.candidates.every(move => board[move] === 0))
  assert.ok(expected.map(([r, c]) => index(r, c)).includes(result.move), `${name}: selected ${result.move}, expected ${expected}`)
  assert.equal(board[result.move], 0)
  assert.deepEqual(Array.from(engine.board), before, 'Search must unwind every speculative move, including timeout')
  assert.ok(result.elapsed <= timeMs + 350, 'Bounded search time')
  fixtures.push({ name, ...result })
}
check('take horizontal win', [[7,4],[7,5],[7,6],[7,7]], [[6,4],[6,5],[6,6]], 1, [[7,3],[7,8]])
check('block single edge four', [[0,0],[0,1],[0,2],[0,3]], [[5,5],[6,6]], 2, [[0,4]])
check('block broken four', [[7,3],[7,4],[7,6],[7,7]], [[7,2],[5,5]], 2, [[7,5]])
check('take diagonal win', [[2,2],[3,3],[4,4],[5,5]], [[1,1],[8,6]], 1, [[6,6]])
check('take anti-diagonal win', [[10,2],[9,3],[8,4],[7,5]], [[11,1]], 1, [[6,6]])
check('win before blocking opponent', [[4,2],[4,3],[4,4],[4,5]], [[8,2],[8,3],[8,4],[8,5]], 1, [[4,1],[4,6]])
check('create open four', [[7,5],[7,6],[7,7]], [[5,4],[9,9]], 1, [[7,4],[7,8]])
check('defend open three', [[7,5],[7,6],[7,7]], [[5,4],[9,9]], 2, [[7,4],[7,8]], 500)
check('two-axis immediate win outranks other four', [[7,5],[7,6],[7,7],[3,8],[4,8],[5,8],[6,8]], [[10,10]], 1, [[2,8],[7,8]])
check('cross double-three', [[7,5],[7,6],[5,7],[6,7]], [[2,2],[3,4],[10,9]], 1, [[7,7]], 1000)
check('continuous four five-ply combination', [[7,5],[7,6],[7,8],[5,7],[6,7]], [[7,4],[2,2],[2,3]], 1, [[7,7]], 1000)
const vcf = fixtures.at(-1)
assert.equal(vcf.proven,true)
assert.ok(vcf.pv.length>=5,'Find a multi-step forcing line')
// Every defender reply in a proven VCF must address an actual immediate five.
const vcfBoard=new Int8Array(225)
for(const [r,c] of [[7,5],[7,6],[7,8],[5,7],[6,7]])vcfBoard[index(r,c)]=1
for(const [r,c] of [[7,4],[2,2],[2,3]])vcfBoard[index(r,c)]=2
for(let ply=0;ply<vcf.pv.length;ply++){
  const move=vcf.pv[ply]
  assert.equal(vcfBoard[move],0)
  if(ply%2===1){vcfBoard[move]=1;assert.ok(winningLine(vcfBoard,move).length>=5,'VCF defender has to block five');vcfBoard[move]=0}
  vcfBoard[move]=ply%2===0?1:2
}
assert.ok(winningLine(vcfBoard,vcf.pv.at(-1)).length>=5)
const empty = new GomokuEngine(new Int8Array(225)).choose(1, { timeMs: 100 })
assert.equal(empty.move,112)
assert.deepEqual(GomokuEngine.advantageHistory([]),[0])
const blackWin = [108,0,109,2,110,4,111,6,112]
const whiteWin = [0,108,2,109,4,110,6,111,8,112]
assert.equal(GomokuEngine.advantageHistory(blackWin).at(-1),1)
assert.equal(GomokuEngine.advantageHistory(whiteWin).at(-1),-1)
assert.deepEqual(GomokuEngine.advantageHistory(blackWin.slice(0,-1)),GomokuEngine.advantageHistory(blackWin).slice(0,-1))
const line = new Int8Array(225); for(let c=0;c<6;c++)line[c]=1
assert.equal(winningLine(line,3).length,6, 'Freestyle overline wins')
assert.equal(winningLine(new Int8Array(225),0).length,0)
assert.equal(validHistory([0,0]),false)
assert.equal(validHistory([225]),false)
assert.equal(validHistory([0,15,1,16,2,17,3,18,4,19]),false)
assert.equal(undoCount([112,96],{mode:'ai',human:1}),0)
assert.equal(undoCount([112],{mode:'ai',human:2}),1)
console.log(JSON.stringify({ok:true,fixtures},null,2))
