from pathlib import Path
import json,zipfile
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'extension/manifest.json').read_text())['version']
out=root/'dist'/f'qr-workbench-{version}.zip'
out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as archive:
 for file in sorted((root/'extension').rglob('*')):
  if file.is_file(): archive.write(file,file.relative_to(root/'extension'))
print(out)
