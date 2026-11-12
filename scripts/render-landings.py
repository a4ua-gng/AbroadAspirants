"""Render six stylised 3D landmark approaches with Pillow and FFmpeg."""
import math
import random
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

WIDTH, HEIGHT = 768, 432
FPS, FRAMES = 20, 76
DESTINATIONS = {
    'tokyo': ((245, 134, 183), (77, 159, 237)),
    'london': ((217, 173, 249), (59, 191, 217)),
    'paris': ((250, 145, 197), (131, 110, 227)),
    'berlin': ((177, 155, 243), (86, 183, 218)),
    'new-york': ((143, 193, 255), (238, 140, 199)),
    'singapore': ((127, 243, 228), (132, 139, 250)),
}
ROOT = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'cities'


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def scale(v, amount):
    return tuple(x * amount for x in v)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0])


def unit(v):
    return scale(v, 1 / math.sqrt(dot(v, v)))


def tint(a, b, amount):
    return tuple(round(x * (1 - amount) + y * amount) for x, y in zip(a, b))


class Model:
    def __init__(self):
        self.faces = []
        self.lines = []

    def face(self, points, color, outline=None):
        self.faces.append((points, color, outline))

    def box(self, x, y, z, width, depth, height, color, outline=None):
        p = [(x + dx * width / 2, y + dy * depth / 2, z + dz * height)
             for dz in (0, 1) for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        for indices, light in [
            ((0,1,5,4), .14), ((1,2,6,5), -.14), ((2,3,7,6), -.30),
            ((3,0,4,7), -.04), ((4,5,6,7), .32),
        ]:
            target = (215, 226, 249) if light > 0 else (6, 11, 30)
            self.face([p[i] for i in indices], tint(color, target, abs(light)), outline)

    def pyramid(self, x, y, z, size, height, color):
        a = (x, y, z + height)
        p = [(x - size, y - size, z), (x + size, y - size, z),
             (x + size, y + size, z), (x - size, y + size, z)]
        for i in range(4):
            self.face([p[i], p[(i + 1) % 4], a], tint(color, (11,15,36), i * .12), color)

    def line(self, a, b, color, width=1):
        self.lines.append((a, b, color, width))

    def cylinder(self, x, y, z, radius, height, color, n=12):
        lower = [(x + radius * math.cos(i * math.tau/n), y + radius * math.sin(i * math.tau/n), z) for i in range(n)]
        upper = [add(p, (0, 0, height)) for p in lower]
        for i in range(n):
            j = (i + 1) % n
            shade = (.35 + .35 * math.cos(i * math.tau / n))
            self.face([lower[i], lower[j], upper[j], upper[i]], tint(color, (12,19,48), shade))
        self.face(upper, tint(color, (225,237,255), .30))

    def disc(self, x, y, z, radius, color, side='front'):
        points = []
        for i in range(28):
            a = i * math.tau / 28
            u, v = radius * math.sin(a), radius * math.cos(a)
            points.append((x + u, y, z + v) if side == 'front' else (x, y + u, z + v))
        self.face(points, color)


def cityscape(model, key, accent, cold):
    rng = random.Random(key)
    ground, road = (23, 32, 68), (14, 23, 51)
    model.face([(-26,-23,0),(26,-23,0),(26,31,0),(-26,31,0)], ground)
    for i in range(-21, 25, 3):
        model.face([(i-.21,-24,.006),(i+.21,-24,.006),(i+.21,31,.006),(i-.21,31,.006)], road)
        model.line((i,-24,.01), (i,31,.01), tint(ground,cold,.38))
    for i in range(-21, 30, 3):
        model.face([(-26,i-.20,.008),(26,i-.20,.008),(26,i+.20,.008),(-26,i+.20,.008)], road)
    for gx in range(-20, 22, 3):
        for gy in range(-16, 28, 3):
            x, y = gx + rng.uniform(-.35,.35), gy + rng.uniform(-.35,.35)
            if abs(x) < 4.7 and -7 < y < 6:
                continue
            if key in ('new-york','singapore') and -4.4 < y < 1.7:
                continue
            h = rng.uniform(.38, 3.2) * (1.2 if key == 'new-york' else .78)
            w, d = rng.uniform(.65, 1.7), rng.uniform(.65, 1.65)
            color = tint((31,40,84), cold, rng.uniform(.02,.23))
            model.box(x,y,0,w,d,h,color)
            for story in range(1, min(9, int(h/.27)) + 1):
                for col in (-.28, 0, .28):
                    if rng.random() < .42:
                        continue
                    xx, yy, z = x + col * w, y - d / 2 - .008, story * .23
                    lum = tint(cold, accent, rng.random() * .75)
                    model.face([(xx-.034,yy,z),(xx+.034,yy,z),(xx+.034,yy,z+.054),(xx-.034,yy,z+.054)], lum)
    if key in ('singapore','new-york'):
        model.face([(-26,-4.5,.02),(26,-4.5,.02),(26,1.65,.02),(-26,1.65,.02)], (17,39,77))
        for i in range(32):
            y = rng.uniform(-4.4,1.6)
            x = rng.uniform(-23,23)
            model.line((x,y,.025),(x+rng.uniform(.3,2.2),y,.025),tint((17,39,77),cold,.26))
    else:
        model.box(0,0,0,7.4,6.6,.095,(39,51,92),tint(ground,cold,.28))


def lattice_tower(m, key, accent, cold):
    levels = [(0.12,1.52),(1.3,1.03),(2.1,.72),(3.5,.41),(4.72,.22),(5.82,.09)]
    if key == 'tokyo':
        levels = [(.12,1.42),(1.25,.98),(2.52,.54),(3.67,.34),(5,.16),(5.45,.09)]
    corners = [(-1,-1),(1,-1),(1,1),(-1,1)]
    for k, ((z0,r0),(z1,r1)) in enumerate(zip(levels, levels[1:])):
        base = [(a*r0,b*r0,z0) for a,b in corners]
        upper = [(a*r1,b*r1,z1) for a,b in corners]
        for i in range(4):
            j = (i+1)%4
            m.line(base[i],upper[i],accent,4)
            m.line(base[i],base[j],cold,2)
            m.line(upper[i],upper[j],accent,2)
            m.line(base[i],upper[j],accent,2 if k < 3 else 1)
            m.line(base[j],upper[i],accent,2 if k < 3 else 1)
        if k in (1,3):
            m.box(0,0,z1-.08,r1*2.2,r1*2.2,.16,tint(accent,(49,45,91),.24),accent)
    if key == 'paris':
        for j in range(18):
            t0, t1 = j * math.pi/18, (j + 1) * math.pi/18
            m.line((1.48*math.cos(t0),-1.52,.18+.93*math.sin(t0)),
                   (1.48*math.cos(t1),-1.52,.18+.93*math.sin(t1)),accent,3)
    z = levels[-1][0]
    m.cylinder(0,0,z,.048,.65,accent,8)
    m.line((0,0,z+.65),(0,0,z+.86),cold,2)


def westminster(m, accent, cold):
    stone = tint(accent,(182,165,119),.65)
    m.box(0,0,.1,1.22,1.22,3.87,stone,accent)
    for x in (-.57,.57):
        for y in (-.57,.57):
            m.box(x,y,.10,.10,.10,4.02,tint(stone,accent,.32))
            m.pyramid(x,y,4.1,.10,.26,accent)
    m.box(0,0,3.62,1.36,1.36,.15,stone,accent)
    m.box(0,0,3.80,1.13,1.13,.70,stone,accent)
    m.pyramid(0,0,4.51,.67,1.12,tint(stone,cold,.38))
    m.line((0,0,5.6),(0,0,5.87),accent,2)
    for y, side in [(-.621,'front'),(.621,'back')]:
        m.disc(0,y,4.14,.285,(251,229,175))
        m.line((0,y-.009,4.14),(0,y-.009,4.33),(37,42,78),2)
        m.line((0,y-.01,4.14),(.12,y-.01,4.09),(37,42,78),2)
    m.disc(.622,0,4.14,.285,(251,229,175),'side')
    m.line((.631,0,4.14),(.631,0,4.33),(37,42,78),2)
    m.box(2.38,.26,.10,3.3,1.35,1.43,stone)
    for x in (1,1.75,2.55,3.30,3.9):
        m.pyramid(x,.28,1.51,.19,.38,accent)
        m.line((x,-.43,.6),(x,-.43,1.13),cold,3)


def gate(m, accent, cold):
    stone = tint(accent,(208,195,162),.72)
    for x in (-2.5,-1.5,-.5,.5,1.5,2.5):
        for y in (-.7,.7):
            m.box(x,y,.12,.57,.57,.15,stone)
            m.cylinder(x,y,.27,.22,2.55,stone)
            m.box(x,y,2.82,.51,.51,.12,accent)
    m.box(0,0,2.94,5.9,2.03,.45,stone,accent)
    m.box(0,0,3.39,5.55,1.86,.23,stone)
    m.box(0,0,3.62,1.66,1.25,.22,stone,accent)
    for x in (-.55,-.18,.18,.55):
        m.box(x,.08,3.86,.22,.53,.27,tint(cold,(32,87,92),.44))
        m.box(x,-.12,4.08,.11,.18,.23,cold)
    m.box(0,.16,3.86,.21,.3,.57,cold)
    m.line((0,.16,4.32),(0,.16,4.73),accent,2)


def bridge(m, accent, cold):
    stone = tint(accent,(130,139,157),.57)
    m.box(0,-1.45,1.04,9.1,1.00,.16,stone,accent)
    for x in (-2.25,2.25):
        for y in (-1.9,-1.0):
            m.box(x,y,.12,.43,.43,3.51,stone,accent)
            m.pyramid(x,y,3.61,.24,.32,accent)
        m.box(x,-1.45,2.85,.39,1.14,.63,stone,accent)
    for y in (-1.96,-.94):
        for j in range(42):
            a, b = j / 42, (j + 1) / 42
            def z(t):
                x = (t - .5) * 9
                return 1.15 + 2.4 * (abs(abs(x) - 2.25)/2.25 - 1)**2
            xa, xb = (a-.5)*9, (b-.5)*9
            m.line((xa,y,z(a)),(xb,y,z(b)),cold,2)
            if j % 2 == 0:
                m.line((xa,y,1.18),(xa,y,z(a)),accent,1)


def marina(m, accent, cold):
    glass = tint(cold,(36,81,139),.56)
    for x in (-1.48,0,1.48):
        m.box(x,.82,.15,.82,1.30,3.86,glass,accent)
        m.box(x-.14,.82,.23,.68,1.22,3.73,tint(glass,accent,.23))
        for i in range(1,13):
            z = .23 + i * .26
            m.line((x-.35,.16,z),(x+.4,.16,z),tint(accent,cold,.4))
    ends = [(-2.42,.25),(1.99,.25),(2.74,.65),(2.58,1.14),(1.87,1.55),(-2.23,1.51),(-2.61,1.07)]
    m.face([(x,y,4.28) for x,y in ends],accent,cold)
    for j,(x,y) in enumerate(ends):
        xx,yy=ends[(j+1)%len(ends)]
        m.face([(x,y,4.02),(xx,yy,4.02),(xx,yy,4.28),(x,y,4.28)],glass,cold)
    m.face([(-1.82,.46,4.29),(1.78,.46,4.29),(1.78,.68,4.29),(-1.82,.68,4.29)],cold)


def background(accent, cold):
    image = Image.new('RGB',(WIDTH,HEIGHT))
    pen = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        p = y / HEIGHT
        shade = tint((8,11,33),(29,46,91),min(1,p*1.65))
        glow = math.exp(-((p-.56)/.24)**2) * .34
        pen.line((0,y,WIDTH,y),fill=tint(shade,tint(accent,cold,.59),glow))
    rng = random.Random(73)
    for _ in range(185):
        x,y=rng.randrange(WIDTH),rng.randrange(int(HEIGHT*.61))
        pen.point((x,y),fill=tint((25,32,65), (226,237,255), rng.uniform(.18,.68)))
    for i in range(10):
        y = 182 + i*10
        pen.line((0,y,WIDTH,y), fill=tint((35,49,91),accent,.13))
    return image


def render_frame(model, bg, t, accent, cold):
    turn = -.47 + t * .85
    distance = 24 - t * 11
    eye = (distance * math.sin(turn), -distance * math.cos(turn), 9 - t * 4.6)
    forward = unit(sub((0,0,1.9 + t*.20),eye))
    right = unit(cross(forward,(0,0,1)))
    up = cross(right,forward)

    def project(point):
        delta = sub(point,eye)
        depth = dot(delta,forward)
        if depth < .3:
            return None
        return (WIDTH*.52 + dot(delta,right)*745/depth,
                HEIGHT*.53 - dot(delta,up)*745/depth, depth)

    frame = bg.copy()
    pen = ImageDraw.Draw(frame)
    drawn = []
    for points,color,outline in model.faces:
        projected = [project(p) for p in points]
        if any(p is None for p in projected):
            continue
        dist = sum(p[2] for p in projected) / len(points)
        xy = [(round(p[0]),round(p[1])) for p in projected]
        if max(x for x,y in xy)<0 or min(x for x,y in xy)>WIDTH or max(y for x,y in xy)<0 or min(y for x,y in xy)>HEIGHT:
            continue
        drawn.append((dist,xy,color,outline,0))
    for a,b,color,width in model.lines:
        pa,pb=project(a),project(b)
        if pa and pb:
            drawn.append(((pa[2]+pb[2])/2,[pa[:2],pb[:2]],color,None,width))
    fog=(43,54,100)
    for dist,points,color,outline,width in sorted(drawn,key=lambda item:item[0],reverse=True):
        shade=tint(color,fog,min(.82,max(0,(dist-14)/42)))
        if width:
            pen.line(points,fill=shade,width=max(1, round(width*19/max(12,dist))))
        else:
            pen.polygon(points,fill=shade,outline=outline)
    return frame


def render(key):
    accent,cold=DESTINATIONS[key]
    ROOT.mkdir(parents=True,exist_ok=True)
    model=Model()
    cityscape(model,key,accent,cold)
    {'tokyo':lambda: lattice_tower(model,key,accent,cold),
     'paris':lambda: lattice_tower(model,key,accent,cold),
     'london':lambda: westminster(model,accent,cold),
     'berlin':lambda: gate(model,accent,cold),
     'new-york':lambda: bridge(model,accent,cold),
     'singapore':lambda: marina(model,accent,cold)}[key]()
    bg=background(accent,cold)
    clip=ROOT / f'{key}.mp4'
    cmd=['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24',
         '-video_size',f'{WIDTH}x{HEIGHT}','-framerate',str(FPS),'-i','pipe:0',
         '-an','-vf','scale=672:378','-c:v','libx264','-threads','2','-preset','slow','-crf','30','-g','20',
         '-pix_fmt','yuv420p','-movflags','+faststart',str(clip)]
    with subprocess.Popen(cmd,stdin=subprocess.PIPE) as encoder:
        for n in range(FRAMES):
            t=n/(FRAMES-1)
            eased=t*t*(3-2*t)
            image=render_frame(model,bg,eased,accent,cold)
            if n==46:
                image.save(ROOT / f'{key}-render.webp','WEBP',quality=83)
            encoder.stdin.write(image.tobytes())
        encoder.stdin.close()
        if encoder.wait():
            raise RuntimeError(f'FFmpeg could not encode {key}')
    print(f'{key}: {clip.stat().st_size} bytes',flush=True)


if __name__ == '__main__':
    for destination in sys.argv[1:] or DESTINATIONS:
        render(destination)
