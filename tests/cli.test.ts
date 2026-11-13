import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, readdir, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root=fileURLToPath(new URL('../',import.meta.url));
const entry=join(root,'apps/cli/src/main.ts');
const loader=pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
const dirs:string[]=[];
async function directory(){const path=await mkdtemp(join(tmpdir(),'stacksense-cli-'));dirs.push(path);return path;}
function cli(args:string[],cwd=root){return spawnSync(process.execPath,['--import',loader,entry,...args],{cwd,encoding:'utf8'});}
afterEach(async()=>{await Promise.all(dirs.splice(0).map(path=>rm(path,{recursive:true,force:true})));});

describe('real CLI subprocess',()=>{
  it('validates a public scenario from an unrelated working directory',async()=>{
    const path=await directory();const result=cli(['--input',join(root,'fixtures/public/P1.json'),'--no-llm'],path);
    expect(result.status).toBe(0);expect(result.stderr).toBe('');expect(JSON.parse(result.stdout).status).toBe('valid');
  });
  it('returns all field errors and exit 2 for invalid input',async()=>{
    const path=await directory();await writeFile(join(path,'bad.json'),'{}');
    const result=cli(['--input',join(path,'bad.json')]);
    expect(result.status).toBe(2);expect(JSON.parse(result.stdout).validation_errors).toHaveLength(5);
  });
  it('writes a malformed JSON report to the requested output',async()=>{
    const path=await directory();await writeFile(join(path,'bad.json'),'{');
    const result=cli(['--input',join(path,'bad.json'),'--output',join(path,'report.json')]);
    expect(result.status).toBe(2);expect(JSON.parse(await readFile(join(path,'report.json'),'utf8')).validation_errors[0].field).toBe('$');
  });
  it('requires explicit overwrite and preserves existing data',async()=>{
    const path=await directory();const output=join(path,'report.json');await writeFile(output,'important');
    const args=['--input',join(root,'fixtures/minimal.json'),'--output',output];
    expect(cli(args).status).toBe(1);expect(await readFile(output,'utf8')).toBe('important');
    expect(cli([...args,'--force']).status).toBe(0);expect(JSON.parse(await readFile(output,'utf8')).status).toBe('valid');
    expect((await readdir(path)).some(name=>name.endsWith('.tmp'))).toBe(false);
  });
  it('refuses to overwrite the input itself even with --force',async()=>{
    const path=await directory();const input=join(path,'input.json');const original=await readFile(join(root,'fixtures/minimal.json'),'utf8');await writeFile(input,original);
    expect(cli(['--input',input,'--output',input,'--force']).status).toBe(1);expect(await readFile(input,'utf8')).toBe(original);
  });
  it.skipIf(process.platform === 'win32')('rejects aliased input paths through symlinks',async()=>{
    const path=await directory();const input=join(path,'input.json');const alias=join(path,'alias.json');
    const original=await readFile(join(root,'fixtures/minimal.json'),'utf8');await writeFile(input,original);await symlink(input,alias);
    expect(cli(['--input',alias,'--output',input,'--force']).status).toBe(1);
    expect(cli(['--input',input,'--output',alias,'--force']).status).toBe(1);
    expect(await readFile(input,'utf8')).toBe(original);
  });
  it.each(['oversized','invalid-utf8'])('exports a bounded %s input error to the requested report',async(kind)=>{
    const path=await directory();const input=join(path,'bad.json');const output=join(path,'report.json');
    await writeFile(input,kind==='oversized'?Buffer.alloc(2*1024*1024+1,32):Buffer.from([0xc3,0x28]));
    const result=cli(['--input',input,'--output',output]);expect(result.status).toBe(2);expect(result.stdout).toBe('');
    expect(JSON.parse(await readFile(output,'utf8')).status).toBe('invalid_input');
  });
  it('continues mixed batches and uses safe unique portable filenames',async()=>{
    const path=await directory();const value=JSON.parse(await readFile(join(root,'fixtures/minimal.json'),'utf8'));
    const unsafe=JSON.parse(JSON.stringify({...value,scenario_id:'../P1'}).replace('"project":','"__proto__":{"polluted":true},"project":'));
    const batch=[{...value,scenario_id:'../P1'},{...value,scenario_id:'../P1'},{...value,scenario_id:'CON'},unsafe,{}];
    const input=join(path,'batch.json');await writeFile(input,JSON.stringify(batch));const output=join(path,'reports');
    const result=cli(['--input',input,'--batch','--output-dir',output]);expect(result.status).toBe(2);
    const manifest=JSON.parse(await readFile(join(output,'validation_manifest.json'),'utf8'));
    expect(manifest.valid).toBe(3);expect(manifest.invalid_input).toBe(2);expect(new Set(manifest.files).size).toBe(5);
    expect(manifest.files.every((file:string)=>!file.includes('/')&&!file.startsWith('CON_'))).toBe(true);
    expect((await readdir(output)).length).toBe(6);
  });
  it('does not publish batch reports when a destination already exists',async()=>{
    const path=await directory();await writeFile(join(path,'P1_validation.json'),'existing');
    const result=cli(['--input',join(root,'fixtures/public/scenarios.json'),'--batch','--output-dir',path]);
    expect(result.status).toBe(1);expect(await readdir(path)).toEqual(['P1_validation.json']);
  });
  it('reports invalid batch containers without creating per-item files',async()=>{
    const path=await directory();const result=cli(['--input',join(root,'fixtures/minimal.json'),'--batch','--output-dir',join(path,'reports')]);
    expect(result.status).toBe(2);expect(JSON.parse(result.stdout).status).toBe('invalid_input');expect(await readdir(path)).toEqual([]);
  });
  it('rejects missing files and incorrect flags as usage/IO errors',()=>{
    expect(cli(['--input',resolve('/this-file-does-not-exist.json')]).status).toBe(1);
    expect(cli(['--surprise']).status).toBe(1);expect(cli(['--help']).status).toBe(0);
  });
});
