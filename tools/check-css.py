"""Catch classes used in the HTML that no CSS rule defines — the failure mode
that silently unstyled the welcome page and produced no console error."""
import re, glob, sys
css = open('assets/css/styles.css').read()
css_classes = set(re.findall(r'\.([A-Za-z_][\w-]*)', re.sub(r'/\*.*?\*/', '', css, flags=re.S)))
IGNORE = {'is-open','is-visible','is-stuck','js-form'}          # toggled by script
orphans = {}
for f in sorted(glob.glob('*.html')):
    html = re.sub(r'<!--.*?-->', '', open(f).read(), flags=re.S)
    for attr in re.findall(r'class="([^"]+)"', html):
        for cls in attr.split():
            if cls not in css_classes and cls not in IGNORE:
                orphans.setdefault(cls, set()).add(f)
if orphans:
    print('UNSTYLED CLASSES:')
    for cls, files in sorted(orphans.items()):
        print(f'  .{cls:28s} used in {", ".join(sorted(files))}')
    sys.exit(1)
print(f'OK — every class used across {len(glob.glob("*.html"))} pages has a CSS rule.')
