from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "public" / "fonts"
FONT_DIR.mkdir(parents=True, exist_ok=True)

sources = list((ROOT / "src").rglob("*.ts")) + list((ROOT / "src").rglob("*.tsx")) + list((ROOT / "src").rglob("*.css"))
sources.append(ROOT / "index.html")
text = "\n".join(path.read_text(encoding="utf-8") for path in sources)
extra = "，。！？：；“”‘’、…—·「」《》〈〉（）【】￥°±×÷✳↗⌘↵∨／"
characters = "".join(dict.fromkeys(text + extra))
text_file = FONT_DIR / "site-characters.txt"
text_file.write_text(characters, encoding="utf-8")

fonts = [
    (Path(r"C:\Windows\Fonts\NotoSerifSC-VF.ttf"), FONT_DIR / "noto-serif-sc.woff2"),
    (Path(r"C:\Windows\Fonts\NotoSansSC-VF.ttf"), FONT_DIR / "noto-sans-sc.woff2"),
]

for source, target in fonts:
    if not source.exists():
        print(f"Missing font: {source}", file=sys.stderr)
        sys.exit(1)
    command = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(source),
        f"--text-file={text_file}",
        "--flavor=woff2",
        "--layout-features=*",
        "--no-hinting",
        "--desubroutinize",
        f"--output-file={target}",
    ]
    subprocess.run(command, check=True)
    print(f"{target.name}: {target.stat().st_size / 1024:.1f} KB, {len(characters)} glyph candidates")
