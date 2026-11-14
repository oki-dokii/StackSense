#!/usr/bin/env python3
"""Measure a fresh source archive extract + cached dependency install/check/build.

Requires Python 3, Node/npm, and a pre-populated npm cache. Does not claim an
uncached network download or setup on other operating systems.
"""
import argparse,json,subprocess,tempfile,time,zipfile,platform,hashlib
from pathlib import Path
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('source_zip',type=Path);p.add_argument('--npm-cache',required=True,type=Path);p.add_argument('--output',type=Path,default=Path('evaluation/setup.json'))
a=p.parse_args();started=time.perf_counter();destination=Path(tempfile.mkdtemp(prefix='stacksense-release-'))
with zipfile.ZipFile(a.source_zip) as archive:
 for item in archive.infolist():
  target=(destination/item.filename).resolve()
  if not target.is_relative_to(destination.resolve()):raise RuntimeError('Unsafe source archive path')
 archive.extractall(destination)
code_hash=hashlib.sha256()
for file in sorted(destination.rglob('*')):
 if not file.is_file():continue
 relative=file.relative_to(destination)
 if relative.parts[0] in {'apps','packages','schemas','tests','fixtures'} or str(relative) in {'package.json','package-lock.json','tsconfig.json','vitest.config.ts','.nvmrc'}:code_hash.update(str(relative).encode()+b'\0'+file.read_bytes()+b'\0')
steps=[]
for command in [['npm','ci','--offline','--cache',str(a.npm_cache.resolve()),'--no-audit','--no-fund'],['npm','ci','--prefix','benchmarks/postgres','--offline','--cache',str(a.npm_cache.resolve()),'--no-audit','--no-fund'],['node','--test','benchmarks/postgres/tests.mjs'],['npm','run','check'],['node','--test','scripts/tests/evidence-bindings.test.mjs','scripts/tests/calibration.test.mjs','scripts/tests/evidence-review.test.mjs'],['npm','run','build'],['npm','run','evaluate'],['npm','run','verify:release']]:
 tick=time.perf_counter();result=subprocess.run(command,cwd=destination,capture_output=True,text=True,timeout=600)
 if result.returncode:raise RuntimeError(f'{command[:3]} failed:\n{result.stdout}\n{result.stderr}')
 steps.append({'command':command[:-4] if '--cache' in command else command, 'seconds':round(time.perf_counter()-tick,3),'exit_code':result.returncode})
record={'measured_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'mode':'fresh archive extraction; npm offline install using previously populated cache','platform':platform.platform(),'runtime_source_sha256':code_hash.hexdigest(),'source_zip_sha256':hashlib.sha256(a.source_zip.read_bytes()).hexdigest(),'steps':steps,'total_seconds':round(time.perf_counter()-started,3),'scope_limit':'Includes extraction/install/check/build/evaluation verification; real cold API startup measured separately. No new online download or other OS is claimed.'}
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
if record['total_seconds']>=900:raise RuntimeError('Observed setup exceeded 15 minutes')
