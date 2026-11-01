# Crops the speaker (box in 0-1000 units: ymin xmin ymax xmax) out of a news photo and removes the background.
import sys
from PIL import Image
src, out, box = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
im = Image.open(src).convert('RGB'); W, H = im.size
y0, x0, y1, x1 = box[0] * H // 1000, box[1] * W // 1000, box[2] * H // 1000, box[3] * W // 1000
im = im.crop((x0, y0, x1, y1))
try:
    from rembg import remove
    im = remove(im)
except Exception as e:
    print('rembg failed:', e)
im.save(out)
