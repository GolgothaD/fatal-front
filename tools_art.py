# Pixelates generated art into 90s-style backgrounds (box downscale, palette quantize, light ordered dither)
from PIL import Image, ImageEnhance
import numpy as np, sys
B=np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]])/16-0.5
def pix(src,dst,h,colors=48,crop=None,sat=1.15,dither=10,con=1.08):
    im=Image.open(src).convert('RGB')
    if crop: im=im.crop(crop)
    w=round(im.width*h/im.height)
    im=im.resize((w,h),Image.BOX)
    im=ImageEnhance.Color(im).enhance(sat); im=ImageEnhance.Contrast(im).enhance(con)
    a=np.asarray(im).astype(float)
    a+=B[np.arange(h)[:,None]%4,np.arange(w)[None,:]%4][...,None]*dither
    im=Image.fromarray(np.clip(a,0,255).astype('uint8'))
    im=im.quantize(colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB')
    im.save(dst,optimize=True); print(dst,im.size)
S='src_art/'
# stage far layers: 240 tall. crop away baked-in foreground ground strip at the bottom of the z-image ones
pix(S+'jungle.webp','art/bg1.png',240,crop=(0,0,1280,505))
pix(S+'dam.webp','art/bg2.png',240,crop=(0,0,1280,470))
pix(S+'city.webp','art/bg3.png',240,crop=(0,0,1280,500))
pix(S+'snow.jpg','art/bg4.png',240)
pix(S+'lab.jpg','art/bg5.png',240)
pix(S+'sky.jpg','art/bg6.png',240)
pix(S+'throne.jpg','art/bg7.png',240)
pix(S+'title.jpg','art/title.png',240,colors=64,dither=8)
