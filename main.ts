import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const Z = [-1.644854, -0.67449, 0, 0.67449, 1.644854];
const TAU = [0.05, 0.25, 0.5, 0.75, 0.95];
const clamp = (x: number) => Math.round(Math.max(0, Math.min(1, x)) * 1e6) / 1e6 + 0;
function median(a: number[]): number { const b = [...a].sort((x,y)=>x-y); if (!b.length) return 0; const m=(b.length-1)/2; return b[Math.floor(m)] + (b[Math.ceil(m)]-b[Math.floor(m)])*(m-Math.floor(m)); }
function forecast(p: number[], horizon: number): number[][] {
  const x = p[p.length - 1];
  // A 120-minute horizon-matched window reacts to the current regime without
  // letting older volatility dominate.  The mean-square move captures the
  // occasional jumps that MAD intentionally discounts, while the median keeps
  // the directional estimate resistant to one-off prints.
  const window = p.slice(Math.max(0, p.length - 121));
  const returns: number[] = [];
  for (let i = 1; i < window.length; i++) returns.push(window[i] - window[i - 1]);
  const med = median(returns);
  const variance = returns.length
    ? returns.reduce((sum, v) => sum + v * v, 0) / returns.length
    : 0;
  let sigma = Math.max(0.0005, Math.min(0.005, Math.sqrt(variance) * 0.5));
  if (!Number.isFinite(sigma) || sigma <= 0) sigma = 0.0025;
  const drift = returns.length ? med * 0.1 : 0;
  const rows: number[][] = [];
  for (let h=1; h<=horizon; h++) {
    const center = x + drift * h;
    rows.push(Z.map(z => clamp(center + z * sigma * Math.sqrt(h))));
  }
  return rows;
}
mkdirSync(OUTPUT_DIR, { recursive: true });
for (const file of readdirSync(INPUT_DIR).filter(f=>f.endsWith('.in')).sort()) {
  const c = JSON.parse(readFileSync(join(INPUT_DIR,file),'utf8'));
  if (c.quantiles.length !== TAU.length || c.quantiles.some((t:number,i:number)=>t !== TAU[i])) throw new Error('unexpected quantiles');
  const forecasts = c.markets.map((m:any)=>({id:m.id,q:forecast(m.prices,c.horizon_minutes)}));
  writeFileSync(join(OUTPUT_DIR,file.slice(0,-3)+'.out'), JSON.stringify({forecasts})+'\n');
}
