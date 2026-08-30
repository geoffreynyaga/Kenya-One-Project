# Application icons

Generated, not drawn. The source of truth is `brand/ostrich-mark.svg`; this
directory is derived from it and should never be edited by hand.

`brand/icon-master.png` is the 1024px master the generator reads. It is the
mark in ink on the panel colour, inset so the macOS rounded-rect mask does not
clip the beak or the trailing foot. Rebuild it, then the icon set:

```sh
sed 's/currentColor/#16265E/g' brand/ostrich-mark.svg > /tmp/mark-navy.svg
rsvg-convert -w 760 -h 760 /tmp/mark-navy.svg -o /tmp/icon-fg.png
magick -size 1024x1024 xc:'#EEF2F7' /tmp/icon-fg.png -gravity center \
    -composite brand/icon-master.png

cd app && bunx tauri icon ../brand/icon-master.png
```

The substitution is needed because the mark fills with `currentColor` so one
file can serve both themes in the UI. A PNG has no such luxury.

`tauri icon` also writes Android and iOS sets. Those are deleted: this is a
desktop application, and `tauri.conf.json` references neither.
