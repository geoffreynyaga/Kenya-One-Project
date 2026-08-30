# Application icons

Generated, not drawn. The source of truth is `brand/ostrich-mark.svg`; this
directory is derived from it and should never be edited by hand.

`brand/icon-master.png` is the 1024px master the generator reads. macOS does
not round an application icon for you: whatever square you hand it is the
square that sits in the Dock. So the master draws the rounded plate itself, on
Apple's grid — an 824px body centred in a 1024px canvas, corner radius 185,
with the rest transparent.

```sh
sed 's/currentColor/#16265E/g' brand/ostrich-mark.svg > /tmp/mark-navy.svg
rsvg-convert -w 560 -h 560 /tmp/mark-navy.svg -o /tmp/icon-fg.png
magick -size 1024x1024 xc:none -fill '#EEF2F7' \
    -draw "roundrectangle 100,100 924,924 185,185" /tmp/plate.png
magick /tmp/plate.png /tmp/icon-fg.png -gravity center -composite \
    brand/icon-master.png

cd app && bunx tauri icon ../brand/icon-master.png
```

The substitution is needed because the mark fills with `currentColor` so one
file can serve both themes in the UI. A PNG has no such luxury.

`tauri icon` also writes Android and iOS sets. Those are deleted: this is a
desktop application, and `tauri.conf.json` references neither.
