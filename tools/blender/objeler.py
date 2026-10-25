# Ana sayfadaki 3B kutunun objeleri: oyunlardaki objelerin low-poly modelleri.
# Çalıştırma:  blender -b -P tools/blender/objeler.py -- public/models [onizleme.png]
# Her obje ayrı bir GLB olarak dışa aktarılır (sınırlayıcı küresinin yarıçapı 0.5); ikinci argüman verilirse
# hepsi bir arada render edilip önizleme görseli kaydedilir.

import bpy
import bmesh
import math
import os
import sys
from mathutils import Vector

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(ARGS[0] if ARGS else 'public/models')
PREVIEW = os.path.abspath(ARGS[1]) if len(ARGS) > 1 else None
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


# ---------------------------------------------------------------- yardımcılar

def lin(c):
    # sRGB (0-1) -> doğrusal renk
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


def mat(name, color, rough=0.42, metal=0.0, alpha=1.0, coat=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hexrgb(color), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat:
        b.inputs['Coat Weight'].default_value = coat
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else m.blend_method
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            pass
    return m


def active(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True)
    bpy.context.view_layer.objects.active = o


def put(o, m, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), smooth=False):
    o.data.materials.clear()
    o.data.materials.append(m)
    o.location = loc
    o.rotation_euler = [math.radians(a) for a in rot]
    o.scale = scale
    for p in o.data.polygons:
        p.use_smooth = smooth
    return o


def sphere(m, r=0.5, seg=12, rings=8, **kw):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=r)
    return put(bpy.context.object, m, **kw)


def ico(m, r=0.5, sub=1, **kw):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r)
    return put(bpy.context.object, m, **kw)


def cyl(m, r=0.5, depth=1, verts=12, **kw):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth)
    return put(bpy.context.object, m, **kw)


def cone(m, r1=0.5, r2=0.0, depth=1, verts=12, **kw):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth)
    return put(bpy.context.object, m, **kw)


def cube(m, size=1, **kw):
    bpy.ops.mesh.primitive_cube_add(size=size)
    return put(bpy.context.object, m, **kw)


def prism(m, points, depth, **kw):
    # XY düzlemindeki çokgeni Z ekseninde depth kalınlığında katı bir gövdeye çevirir
    me = bpy.data.meshes.new('prism')
    bm = bmesh.new()
    bot = [bm.verts.new((x, y, -depth / 2)) for x, y in points]
    top = [bm.verts.new((x, y, depth / 2)) for x, y in points]
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    n = len(points)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('prism', me)
    scene.collection.objects.link(o)
    return put(o, m, **kw)


def star_points(R, r, n=5, rot=90):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot) + i * math.pi / n
        rad = R if i % 2 == 0 else r
        pts.append((math.cos(a) * rad, math.sin(a) * rad))
    return pts


def bevel(o, width, seg=1, angle=None):
    md = o.modifiers.new('bevel', 'BEVEL')
    md.width = width
    md.segments = seg
    if angle:
        md.limit_method = 'ANGLE'
        md.angle_limit = math.radians(angle)
    active(o)
    bpy.ops.object.modifier_apply(modifier=md.name)
    return o


def smooth_angle(o, deg=35):
    active(o)
    try:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(deg))
    except Exception:
        for p in o.data.polygons:
            p.use_smooth = True


def join(parts, name):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.name = name
    return o


def normalize(o, radius=0.5):
    # Obje sınırlayıcı küresinin merkezine taşınır ve yarıçapı `radius` olacak şekilde ölçeklenir
    active(o)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    vs = [v.co for v in o.data.vertices]
    lo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    hi = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    c = (lo + hi) / 2
    far = max((v - c).length for v in vs)
    for v in o.data.vertices:
        v.co = (v.co - c) * (radius / far)
    o.location = (0, 0, 0)
    return o


def ellipsoid_front(x, z, a, b, c):
    # Elipsoidin (yarı eksenler a, b, c) ön yüzeyinde (−Y) verilen x, z noktasının y değeri
    k = 1 - (x / a) ** 2 - (z / c) ** 2
    return -b * math.sqrt(max(k, 0))


# ---------------------------------------------------------------- objeler

def coin():
    gold = mat('altin', '#F7B500', rough=0.28, metal=0.35)
    deep = mat('altin-ic', '#F08400', rough=0.35, metal=0.2)
    light = mat('altin-yildiz', '#FFD83A', rough=0.25, metal=0.35)
    body = cyl(gold, r=0.5, depth=0.17, verts=12)
    body.data.materials.append(deep)
    bm = bmesh.new()
    bm.from_mesh(body.data)
    caps = [f for f in bm.faces if abs(f.normal.z) > 0.9]
    # Kapak yüzleri içe doğru basılır; ortada kalan iç yüz koyu altın rengini alır
    bmesh.ops.inset_individual(bm, faces=caps, thickness=0.085, depth=-0.025, use_even_offset=True)
    for f in caps:
        f.material_index = 1
    bm.to_mesh(body.data)
    bm.free()
    bevel(body, 0.014, 1, angle=40)
    stars = [prism(light, star_points(0.27, 0.12), 0.05, loc=(0, 0, s * 0.055)) for s in (1, -1)]
    o = join([body] + stars, 'altin')
    o.rotation_euler = (math.radians(90), 0, 0)
    return o


def coin_x2():
    gold = mat('altin', '#F7B500', rough=0.28, metal=0.35)
    deep = mat('altin-ic', '#F08400', rough=0.35, metal=0.2)
    body = cyl(gold, r=0.5, depth=0.17, verts=12)
    bevel(body, 0.014, 1, angle=40)
    parts = [body]
    for s in (1, -1):
        bpy.ops.object.text_add()
        t = bpy.context.object
        t.data.body = 'x2'
        t.data.align_x = 'CENTER'
        t.data.align_y = 'CENTER'
        t.data.extrude = 0.03
        t.data.size = 0.55
        active(t)
        bpy.ops.object.convert(target='MESH')
        t = bpy.context.object
        put(t, deep, loc=(0, 0, s * 0.095), rot=(0 if s > 0 else 180, 0, 0))
        parts.append(t)
    o = join(parts, 'altin-x2')
    o.rotation_euler = (math.radians(90), 0, 0)
    return o


def star():
    pink = mat('yildiz', '#FF2BD1', rough=0.3, coat=0.4)
    o = prism(pink, star_points(0.5, 0.23), 0.2)
    bevel(o, 0.05, 2)
    smooth_angle(o, 30)
    o.name = 'yildiz'
    o.rotation_euler = (math.radians(90), 0, 0)
    return o


def beach_ball():
    cols = [mat('top-kirmizi', '#E8342C', 0.3, coat=0.5), mat('top-beyaz', '#F5F5F2', 0.3, coat=0.5),
            mat('top-sari', '#FFD21A', 0.3, coat=0.5), mat('top-mavi', '#1F63E8', 0.3, coat=0.5)]
    o = sphere(cols[0], r=0.5, seg=12, rings=8)
    for m in cols[1:]:
        o.data.materials.append(m)
    gores = [0, 1, 2, 1, 3, 1]
    for p in o.data.polygons:
        c = p.center
        if abs(c.z) > 0.44:
            p.material_index = 1
            continue
        a = (math.atan2(c.y, c.x) + math.pi) / (2 * math.pi)
        p.material_index = gores[int(a * 6) % 6]
    o.name = 'plaj-topu'
    return o


def duck():
    yel = mat('ordek', '#FFC514', 0.45)
    wing = mat('ordek-kanat', '#F7A90C', 0.45)
    beak = mat('ordek-gaga', '#FF6A00', 0.4)
    eye = mat('goz', '#141414', 0.25)
    parts = [
        sphere(yel, r=1, seg=12, rings=8, scale=(0.42, 0.6, 0.38)),
        cone(yel, r1=0.2, depth=0.34, verts=6, loc=(0, 0.52, 0.16), rot=(-55, 0, 0)),
        sphere(yel, r=0.28, seg=12, rings=8, loc=(0, -0.34, 0.4)),
        cone(beak, r1=0.13, r2=0.05, depth=0.24, verts=8, loc=(0, -0.62, 0.34), rot=(90, 0, 0), scale=(1.2, 1, 0.55)),
        sphere(wing, r=1, seg=8, rings=6, loc=(0.37, 0.06, 0.05), rot=(0, 0, 0), scale=(0.11, 0.32, 0.2)),
        sphere(wing, r=1, seg=8, rings=6, loc=(-0.37, 0.06, 0.05), scale=(0.11, 0.32, 0.2)),
    ]
    for s in (1, -1):
        parts.append(sphere(eye, r=0.05, seg=8, rings=6, loc=(s * 0.13, -0.56, 0.47)))
    return join(parts, 'ordek')


def rocket():
    white = mat('roket-govde', '#F3F3F0', 0.35, coat=0.3)
    red = mat('roket-kirmizi', '#E5322D', 0.35, coat=0.3)
    blue = mat('roket-mavi', '#1E4FE0', 0.35, coat=0.3)
    glass = mat('roket-cam', '#23C4FF', 0.08, metal=0.1)
    dark = mat('roket-meme', '#3B3C44', 0.4, metal=0.5)
    parts = [
        cyl(white, r=0.22, depth=0.72, verts=10),
        cone(red, r1=0.22, depth=0.4, verts=10, loc=(0, 0, 0.56)),
        cyl(red, r=0.228, depth=0.07, verts=10, loc=(0, 0, -0.26)),
        cyl(white, r=0.12, depth=0.04, verts=12, loc=(0, -0.205, 0.12), rot=(90, 0, 0)),
        cyl(glass, r=0.085, depth=0.05, verts=12, loc=(0, -0.215, 0.12), rot=(90, 0, 0)),
        cone(dark, r1=0.15, r2=0.19, depth=0.12, verts=10, loc=(0, 0, -0.42)),
    ]
    fin = [(0.0, 0.16), (0.0, -0.18), (0.24, -0.34), (0.24, -0.1)]
    for k in range(3):
        f = prism(blue, fin, 0.05)
        f.rotation_euler = (math.radians(90), 0, 0)
        active(f)
        bpy.ops.object.transform_apply(rotation=True)
        f.location = (0.18, 0, -0.12)
        active(f)
        bpy.ops.object.transform_apply(location=True)
        f.rotation_euler = (0, 0, math.radians(90 + k * 120))
        parts.append(f)
    return join(parts, 'roket')


def crown():
    purple = mat('tac', '#7A2CF5', 0.35, coat=0.4)
    gem = mat('tac-tas', '#FFD21A', 0.2, metal=0.2)
    teal = mat('tac-tas-2', '#1FE3B0', 0.15)
    band = cyl(purple, r=0.42, depth=0.3, verts=10)
    bm = bmesh.new()
    bm.from_mesh(band.data)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if abs(f.normal.z) > 0.9], context='FACES_ONLY')
    bm.to_mesh(band.data)
    bm.free()
    md = band.modifiers.new('kalinlik', 'SOLIDIFY')
    md.thickness = 0.07
    active(band)
    bpy.ops.object.modifier_apply(modifier=md.name)
    parts = [band]
    for k in range(5):
        a = math.radians(k * 72 + 90)
        x, y = math.cos(a) * 0.4, math.sin(a) * 0.4
        parts.append(cone(purple, r1=0.13, depth=0.3, verts=4, loc=(x, y, 0.29), rot=(0, 0, k * 72)))
        parts.append(ico(gem, r=0.055, sub=1, loc=(x * 1.02, y * 1.02, 0.46)))
        b = math.radians(k * 72 + 126)
        parts.append(ico(teal, r=0.06, sub=1, loc=(math.cos(b) * 0.46, math.sin(b) * 0.46, 0.0), scale=(1, 1, 1.25)))
    return join(parts, 'tac')


def skateboard():
    top = mat('kaykay-ust', '#FF4A1C', 0.4, coat=0.3)
    under = mat('kaykay-alt', '#FFC21A', 0.4)
    metal = mat('kaykay-trak', '#B9BEC9', 0.3, metal=0.75)
    wheel = mat('kaykay-teker', '#2BD9C9', 0.35)
    # Deck: iki ucu yuvarlak düz bir plaka, uçları yukarı kıvrılır
    pts = []
    L, W, segs = 0.62, 0.21, 8
    for i in range(segs + 1):
        a = -math.pi / 2 + i * math.pi / segs
        pts.append((math.sin(a) * W, L + math.cos(a) * W * 0.95))
    for i in range(segs + 1):
        a = math.pi / 2 + i * math.pi / segs
        pts.append((math.sin(a) * W, -L + math.cos(a) * W * 0.95))
    deck = prism(top, pts, 0.045)
    deck.data.materials.append(under)
    me = deck.data
    bm = bmesh.new()
    bm.from_mesh(me)
    for f in bm.faces:
        if f.normal.z < 0.5:
            f.material_index = 1
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.y - e.verts[1].co.y) > 0.3], cuts=8)
    for v in bm.verts:
        d = abs(v.co.y) - 0.5
        if d > 0:
            v.co.z += d * d * 2.2
    bm.to_mesh(me)
    bm.free()
    bevel(deck, 0.01, 1, angle=50)
    parts = [deck]
    for s in (1, -1):
        y = s * 0.47
        parts.append(cube(metal, size=1, loc=(0, y, -0.05), scale=(0.12, 0.07, 0.05)))
        parts.append(cyl(metal, r=0.022, depth=0.4, verts=8, loc=(0, y, -0.095), rot=(0, 90, 0)))
        for sx in (1, -1):
            parts.append(cyl(wheel, r=0.07, depth=0.07, verts=12, loc=(sx * 0.2, y, -0.095), rot=(0, 90, 0), smooth=True))
    return join(parts, 'kaykay')


def blob(name, body_color, **features):
    # Snack Pack karakterleri: yuvarlak, parlak bir gövde ve yüz
    a, b, c = 0.5, 0.46, 0.42
    body = mat(f'{name}-govde', body_color, 0.32, coat=0.5)
    eye = mat('blob-goz', '#1A1A1E', 0.2)
    blush = mat('blob-yanak', '#FF8FB1', 0.45)
    o = sphere(body, r=1, seg=32, rings=16, scale=(a, b, c), smooth=True)
    active(o)
    bpy.ops.object.transform_apply(scale=True)
    for v in o.data.vertices:
        if v.co.z < -0.28:
            v.co.z = -0.28 + (v.co.z + 0.28) * 0.35
    parts = [o]
    for s in (1, -1):
        x, z = s * 0.14, 0.07
        parts.append(sphere(eye, r=1, seg=12, rings=8, loc=(x, ellipsoid_front(x, z, a, b, c) + 0.012, z), scale=(0.035, 0.02, 0.05), smooth=True))
        x, z = s * 0.25, -0.04
        parts.append(sphere(blush, r=1, seg=12, rings=8, loc=(x, ellipsoid_front(x, z, a, b, c) + 0.012, z), scale=(0.065, 0.02, 0.035), smooth=True))
    for f in features.get('extra', lambda: [])():
        parts.append(f)
    return join(parts, name)


def bunny():
    ear = mat('tavsan-govde', '#EEF0FF', 0.32, coat=0.5)
    inner = mat('tavsan-kulak', '#FFA3C4', 0.4)
    def extra():
        out = []
        for s in (1, -1):
            out.append(sphere(ear, r=1, seg=16, rings=10, loc=(s * 0.15, 0.02, 0.5), rot=(0, s * 14, 0), scale=(0.085, 0.055, 0.27), smooth=True))
            out.append(sphere(inner, r=1, seg=12, rings=8, loc=(s * 0.16, -0.03, 0.5), rot=(0, s * 14, 0), scale=(0.045, 0.02, 0.19), smooth=True))
        return out
    return blob('tavsan', '#EEF0FF', extra=extra)


def panda():
    black = mat('panda-siyah', '#1E1E22', 0.35, coat=0.3)
    shine = mat('panda-goz', '#FFFFFF', 0.2)
    a, b, c = 0.5, 0.46, 0.42
    def extra():
        out = []
        for s in (1, -1):
            out.append(sphere(black, r=0.11, seg=16, rings=10, loc=(s * 0.28, 0.02, 0.33), smooth=True))
            x, z = s * 0.15, 0.08
            out.append(sphere(black, r=1, seg=16, rings=10, loc=(x, ellipsoid_front(x, z, a, b, c) + 0.005, z), rot=(0, s * 25, 0), scale=(0.09, 0.03, 0.115), smooth=True))
            out.append(sphere(shine, r=0.022, seg=8, rings=6, loc=(x - s * 0.015, ellipsoid_front(x, z, a, b, c) - 0.022, z + 0.025)))
        return out
    return blob('panda', '#F6F4EE', extra=extra)


def pig():
    snout = mat('domuz-burun', '#E2339F', 0.35, coat=0.4)
    dark = mat('domuz-delik', '#7A1450', 0.4)
    ear = mat('domuz-govde', '#FF5CC8', 0.32, coat=0.5)
    a, b, c = 0.5, 0.46, 0.42
    def extra():
        out = []
        y = ellipsoid_front(0, -0.05, a, b, c)
        out.append(cyl(snout, r=0.11, depth=0.07, verts=16, loc=(0, y - 0.01, -0.05), rot=(90, 0, 0), scale=(1.25, 1, 0.9), smooth=True))
        for s in (1, -1):
            out.append(sphere(dark, r=1, seg=8, rings=6, loc=(s * 0.045, y - 0.045, -0.05), scale=(0.022, 0.012, 0.035)))
            out.append(cone(ear, r1=0.1, depth=0.18, verts=8, loc=(s * 0.25, 0.0, 0.36), rot=(0, s * 30, 0), smooth=True))
        return out
    return blob('domuz', '#FF5CC8', extra=extra)


def tube():
    glass = mat('tup-cam', '#DDF3FF', 0.05, alpha=0.32)
    liquid = mat('tup-sivi', '#FF2E44', 0.2, coat=0.6)
    cap = mat('tup-kapak', '#FF2E44', 0.3, coat=0.4)
    parts = [
        cyl(glass, r=0.15, depth=0.86, verts=20, loc=(0, 0, 0.02), smooth=True),
        sphere(glass, r=0.15, seg=20, rings=10, loc=(0, 0, -0.41), smooth=True),
        cyl(liquid, r=0.128, depth=0.5, verts=20, loc=(0, 0, -0.16), smooth=True),
        sphere(liquid, r=0.128, seg=20, rings=10, loc=(0, 0, -0.41), smooth=True),
        cyl(cap, r=0.19, depth=0.1, verts=20, loc=(0, 0, 0.47), smooth=True),
    ]
    o = join(parts, 'tup')
    o.rotation_euler = (0, math.radians(15), 0)
    return o


def owl_block():
    purple = mat('kup-mor', '#B84DFF', 0.32, coat=0.5)
    white = mat('kup-goz', '#FFFFFF', 0.25)
    eye = mat('blob-goz', '#1A1A1E', 0.2)
    beak = mat('kup-gaga', '#FF9A1F', 0.35)
    body = cube(purple, size=0.8)
    bevel(body, 0.12, 3)
    smooth_angle(body, 30)
    parts = [body]
    for s in (1, -1):
        parts.append(cyl(white, r=0.14, depth=0.04, verts=20, loc=(s * 0.17, -0.405, 0.1), rot=(90, 0, 0), smooth=True))
        parts.append(cyl(eye, r=0.065, depth=0.04, verts=16, loc=(s * 0.15, -0.425, 0.09), rot=(90, 0, 0), smooth=True))
    parts.append(cone(beak, r1=0.08, depth=0.14, verts=4, loc=(0, -0.43, -0.08), rot=(90, 45, 0), scale=(1, 1, 1)))
    return join(parts, 'kup-baykus')


MODELS = [coin, coin_x2, star, beach_ball, duck, rocket, crown, skateboard, bunny, panda, pig, tube, owl_block]

built = []
for fn in MODELS:
    o = fn()
    normalize(o)
    built.append(o)
    active(o)
    path = os.path.join(OUT, f'{o.name}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print(f'OK {o.name} -> {path} ({tris} tris)')


# ---------------------------------------------------------------- önizleme

if PREVIEW:
    cols = 5
    for i, o in enumerate(built):
        o.location = ((i % cols) * 1.25 - (cols - 1) * 0.625, 0, -(i // cols) * 1.25 + 1.25)
        o.rotation_euler = (math.radians(-18), math.radians(12), math.radians(-28))
    world = bpy.data.worlds.new('dunya')
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (*hexrgb('#E9E7F2'), 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    bpy.ops.object.light_add(type='AREA', location=(-2.5, -4, 5))
    key = bpy.context.object
    key.data.energy = 1400
    key.data.size = 5
    key.rotation_euler = (math.radians(40), 0, math.radians(-30))
    bpy.ops.object.light_add(type='SUN', location=(3, -2, 4))
    bpy.context.object.data.energy = 1.6
    bpy.context.object.rotation_euler = (math.radians(50), math.radians(20), math.radians(40))
    bpy.ops.object.camera_add(location=(0, -9, 0.2), rotation=(math.radians(90), 0, 0))
    cam = bpy.context.object
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 6.6
    scene.camera = cam
    scene.view_settings.view_transform = 'Standard'
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1500
    scene.render.resolution_y = 1000
    scene.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
    print('PREVIEW', PREVIEW)
