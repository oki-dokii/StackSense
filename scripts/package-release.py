#!/usr/bin/env python3
"""Build source/review archives without dependencies, credentials or build output."""
import argparse,hashlib,json,subprocess,zipfile,shutil,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
EXCLUDE={'node_modules','dist','.git','.venv','__pycache__','tmp','release','output','deliverables'}
ROOT_CODE={'package.json','package-lock.json','tsconfig.json','vitest.config.ts','.nvmrc'}
def code_file(path):return path.parts[0] in {'apps','packages','schemas','tests','fixtures'} or str(path) in ROOT_CODE

def source_files():
 names=subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=ROOT).decode().split('\0')
 result=[]
 for name in sorted(set(filter(None,names))):
  relative=Path(name);file=ROOT/relative
  if relative.as_posix()=='evaluation/package-checks.json':continue
  if any(part in EXCLUDE for part in relative.parts) or relative.name=='.DS_Store':continue
  if file.is_symlink():raise RuntimeError(f'Symlink excluded from submission: {relative}')
  if not file.is_file():continue
  if (relative.name.startswith('.env') and relative.name!='.env.example') or relative.suffix in {'.pem','.key'} or relative.name in {'id_rsa','id_ed25519'}:raise RuntimeError(f'Potential secret file: {relative}')
  result.append(relative)
 return result

def digest(files):
 h=hashlib.sha256()
 for relative in files:
  if code_file(relative):h.update(str(relative).encode()+b'\0'+(ROOT/relative).read_bytes()+b'\0')
 return h.hexdigest()

def source_zip(target):
 files=source_files();target.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
  for relative in files:
   info=zipfile.ZipInfo(relative.as_posix(),date_time=(2026,11,13,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=(0o100644<<16);archive.writestr(info,(ROOT/relative).read_bytes())
  if archive.testzip():raise RuntimeError('Source zip integrity failure')
 return files

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--source-only',action='store_true');args=parser.parse_args()
 destination=ROOT/'release'/'StackSense26_SohamBanerjee';destination.mkdir(parents=True,exist_ok=True)
 archive=destination/'source'/'source.zip';files=source_zip(archive)
 if args.source_only:print(archive);return
 report=ROOT/'output/pdf/Report_SohamBanerjee.pdf'
 if not report.is_file():raise RuntimeError('Create and verify the report first')
 checks=json.loads((ROOT/'evaluation/report-checks.json').read_text())
 if checks.get('sha256')!=hashlib.sha256(report.read_bytes()).hexdigest() or checks.get('visual_review','pending').startswith('pending') or checks['main_pages']>15 or checks['appendix_pages']>10:raise RuntimeError('Report QA/hash/page-budget gate failed')
 shutil.copyfile(report,destination/report.name);out=destination/'outputs';out.mkdir(exist_ok=True)
 for index in range(1,7):shutil.copyfile(ROOT/f'outputs/P{index}_output.json',out/f'P{index}_output.json')
 readme='''StackSense 0.6.0 - Soham Banerjee, IIIT-Bangalore

Extract source/source.zip, then run npm ci, npm run build, npm start.
Open http://127.0.0.1:3000. Node 22.17+ within 22, or Node 24.

Public results: one ok, one ok_with_warnings, four infeasible due reviewed
external-residency/provider evidence gaps. No-plan 0-0 costs are not estimates.
The report documents actual tests, assumptions, references and AI assistance.

Owner actions remain: review and own the AI-assisted design/research; verify
Drive sharing/access, submit the folder link on Unstop, and freeze the folder
after the stated deadline. This local package has not been submitted online.
''';(destination/'README_SUBMISSION.txt').write_text(readme)
 records=[]
 for file in sorted(destination.rglob('*')):
  if file.is_file() and file.name!='manifest.json':records.append({'path':file.relative_to(destination).as_posix(),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
 metadata={'app_version':'0.6.0','engine_version':'0.6.0','catalog_version':'0.4.0','services_version':'0.6.0','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'runtime_source_sha256':digest(files),'source_file_count':len(files),'source_exclusions':sorted(EXCLUDE),'status':'Local review package; owner review and online submission pending','files':records}
 setup=ROOT/'evaluation/setup.json'
 if setup.exists():
  verified=json.loads(setup.read_text());
  if verified.get('runtime_source_sha256')!=metadata['runtime_source_sha256']:raise RuntimeError('Runtime/test source differs from clean-setup rehearsal; rehearse again')
 (destination/'manifest.json').write_text(json.dumps(metadata,indent=2)+'\n')
 final=ROOT/'release/StackSense26_SohamBanerjee.zip'
 with zipfile.ZipFile(final,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as outer:
  for file in sorted(destination.rglob('*')):
   if file.is_file():outer.write(file,file.relative_to(destination.parent))
  if outer.testzip():raise RuntimeError('Submission zip integrity failure')
 if final.stat().st_size>=1_000_000_000:raise RuntimeError('Submission exceeds 1 GB')
 deliverable=ROOT/'deliverables'/final.name;deliverable.parent.mkdir(exist_ok=True);shutil.copyfile(final,deliverable)
 print(json.dumps({'folder':str(destination),'archive':str(final),'bytes':final.stat().st_size,'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'source_files':len(files),'runtime_source_sha256':metadata['runtime_source_sha256']},indent=2))
if __name__=='__main__':main()
