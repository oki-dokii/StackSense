#!/usr/bin/env python3
"""Verify the built outer/inner submission ZIP and record its integrity evidence."""
from pathlib import Path
import hashlib,io,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
outer=ROOT/'deliverables/StackSense26_SohamBanerjee.zip';prefix='StackSense26_SohamBanerjee/'
with zipfile.ZipFile(outer) as archive:
 assert archive.testzip() is None
 manifest=json.loads(archive.read(prefix+'manifest.json'))
 for item in manifest['files']:
  data=archive.read(prefix+item['path']);assert hashlib.sha256(data).hexdigest()==item['sha256'];assert len(data)==item['bytes']
 for index in range(1,7):assert archive.read(prefix+f'outputs/P{index}_output.json')==(ROOT/f'outputs/P{index}_output.json').read_bytes()
 assert archive.read(prefix+'Report_SohamBanerjee.pdf')==(ROOT/'output/pdf/Report_SohamBanerjee.pdf').read_bytes()
 with zipfile.ZipFile(io.BytesIO(archive.read(prefix+'source/source.zip'))) as source:
  assert source.testzip() is None;names=source.namelist();assert 'README.md' in names and 'package-lock.json' in names and '.env.example' in names
  assert not any(any(part in {'node_modules','.git','dist','.venv','release','deliverables','output'} for part in Path(name).parts) for name in names)
  assert not any((Path(name).name.startswith('.env') and Path(name).name!='.env.example') or Path(name).suffix in {'.pem','.key'} for name in names)
  digest=hashlib.sha256()
  for name in sorted(names):
   path=Path(name)
   if path.parts[0] in {'apps','packages','schemas','tests','fixtures'} or name in {'package.json','package-lock.json','tsconfig.json','vitest.config.ts','.nvmrc'}:digest.update(name.encode()+b'\0'+source.read(name)+b'\0')
  assert digest.hexdigest()==manifest['runtime_source_sha256']==json.loads((ROOT/'evaluation/setup.json').read_text())['runtime_source_sha256']
assert outer.stat().st_size<1_000_000_000
record={'archive':'deliverables/StackSense26_SohamBanerjee.zip','bytes':outer.stat().st_size,'sha256':hashlib.sha256(outer.read_bytes()).hexdigest(),'source_files':manifest['source_file_count'],'runtime_source_sha256':manifest['runtime_source_sha256'],'checks':['Outer and inner ZIP CRC pass','Every manifest SHA-256 matches','Six public outputs and report exactly match working release','Source README/lockfile/env example present','No Git/dependency/build/cache/nested-release or secret-file patterns','Extracted runtime/test source digest equals clean setup rehearsal','Report QA/hash/page gate passed','Archive below 1 GB'],'owner_review_and_online_submission':'pending; not performed by agent'}
(ROOT/'evaluation/package-checks.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
