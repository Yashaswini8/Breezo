"""Breezo — 8-slide, 16:9 pitch deck. White theme, no gradients, no dark slides."""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.dml import MSO_LINE

WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x0F, 0x17, 0x2A)
BODY = RGBColor(0x47, 0x55, 0x69)
MUTED = RGBColor(0x94, 0xA3, 0xB8)
NAVY = RGBColor(0x1E, 0x3A, 0x8A)
HAIR = RGBColor(0xE2, 0xE8, 0xF0)
TINT = RGBColor(0xF8, 0xFA, 0xFC)

GREEN = RGBColor(0x15, 0x80, 0x3D)
YELLOW = RGBColor(0xCA, 0x8A, 0x04)
ORANGE = RGBColor(0xEA, 0x58, 0x0C)
RED = RGBColor(0xDC, 0x26, 0x26)

AQI = [("Good", GREEN), ("Moderate", YELLOW), ("Sensitive", ORANGE), ("Unhealthy", RED)]

FONT = "Inter"
FALLBACK = "Calibri"

W, H = Inches(13.333), Inches(7.5)
ML = Inches(0.9)
CW = Inches(11.533)

prs = Presentation()
prs.slide_width = W
prs.slide_height = H


def use_font(run, name=FONT):
    """Set the latin typeface; also tag the east-asian/complex fallbacks."""
    run.font.name = name
    rPr = run._r.get_or_add_rPr()
    for tag in ("a:ea", "a:cs"):
        el = rPr.makeelement(
            "{http://schemas.openxmlformats.org/drawingml/2006/main}" + tag.split(":")[1],
            {"typeface": FALLBACK},
        )
        rPr.append(el)


def slide(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = WHITE
    return s


def tbox(s, l, t, w, h):
    tb = s.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    return tf


def line(tf, text, size, color, bold=False, first=False, before=0, after=0,
         align=PP_ALIGN.LEFT, spacing=1.0, italic=False):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.space_before = Pt(before)
    p.space_after = Pt(after)
    p.line_spacing = spacing
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    use_font(r)
    return p


def rect(s, l, t, w, h, fill=WHITE, outline=HAIR, width=1.0, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
         radius=0.05):
    sp = s.shapes.add_shape(shape, l, t, w, h)
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            sp.adjustments[0] = radius
        except Exception:
            pass
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = fill
    if outline is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = outline
        sp.line.width = Pt(width)
    sp.shadow.inherit = False
    tf = sp.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.22)
    tf.margin_top = tf.margin_bottom = Inches(0.14)
    return sp


def hline(s, l, t, w, color=HAIR, width=1.0):
    ln = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, Pt(width))
    ln.fill.solid()
    ln.fill.fore_color.rgb = color
    ln.line.fill.background()
    ln.shadow.inherit = False
    return ln


def header(s, kicker, title):
    rect(s, ML, Inches(0.52), Inches(0.16), Inches(0.16), fill=NAVY, outline=None,
         shape=MSO_SHAPE.OVAL)
    tf = tbox(s, Inches(1.18), Inches(0.45), Inches(10.5), Inches(0.32))
    line(tf, kicker.upper(), 11.5, NAVY, bold=True, first=True)
    tf2 = tbox(s, ML, Inches(0.88), Inches(11.2), Inches(0.8))
    line(tf2, title, 34, INK, bold=True, first=True, spacing=0.95)
    hline(s, ML, Inches(1.82), CW)


def footer(s, n):
    tf = tbox(s, ML, Inches(6.92), Inches(8.0), Inches(0.3))
    line(tf, "Breezo  ·  Breathe easy. Know your air.", 10, MUTED, first=True)
    tf2 = tbox(s, Inches(10.5), Inches(6.92), Inches(1.933), Inches(0.3))
    line(tf2, str(n), 10, MUTED, first=True, align=PP_ALIGN.RIGHT)


def bullets(s, items, top, left=ML, width=CW, size=17, gap=13, dot=NAVY, dark=None):
    """Max four short bullets: navy marker + slate text."""
    y = top
    for it in items:
        d = rect(s, left, y + Inches(0.13), Inches(0.1), Inches(0.1), fill=dot,
                 outline=None, shape=MSO_SHAPE.OVAL)
        tf = tbox(s, left + Inches(0.34), y, width - Inches(0.34), Inches(0.5))
        line(tf, it, size, dark or BODY, first=True, spacing=1.15)
        y += Inches(0.34) + Inches(gap / 72.0)
    return y


def aqi_chips(s, left, top, size=Inches(0.26), gap=Inches(0.42), caption=True):
    x = left
    for label, col in AQI:
        rect(s, x, top, size, size, fill=col, outline=None, radius=0.28)
        x += size + Inches(0.14)
    if caption:
        tf = tbox(s, left, top + Inches(0.36), Inches(4.4), Inches(0.3))
        line(tf, "AQI bands used across the dashboard", 10.5, MUTED, first=True)
    return x


# ---------------------------------------------------------------- slide 1
s1 = slide(prs)
rect(s1, ML, Inches(1.9), Inches(0.5), Inches(0.09), fill=NAVY, outline=None,
     shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.5)

tf = tbox(s1, ML, Inches(2.2), Inches(11.5), Inches(1.5))
line(tf, "Breezo", 82, INK, bold=True, first=True, spacing=0.9)

tf = tbox(s1, ML, Inches(3.75), Inches(11.5), Inches(0.6))
line(tf, "Breathe easy. Know your air.", 30, NAVY, first=True)

hline(s1, ML, Inches(4.62), Inches(3.2), color=HAIR)

tf = tbox(s1, ML, Inches(4.86), Inches(9.0), Inches(0.4))
line(tf, "Track: Clean Air & Climate Resilience", 17, BODY, first=True)

aqi_chips(s1, ML, Inches(5.72))
footer(s1, 1)

# ---------------------------------------------------------------- slide 2
s2 = slide(prs)
header(s2, "The problem", "The air is unsafe long before anyone notices")
bullets(s2, [
    "Air pollution and heat waves quietly harm millions every year.",
    "Most people cannot tell when the air is unsafe for them.",
    "Forecasts are missing, regional, or buried in jargon.",
    "Advice is generic, and ignores who is most at risk.",
], Inches(2.2), width=Inches(6.9))

card = rect(s2, Inches(8.3), Inches(2.2), Inches(4.13), Inches(2.5), fill=TINT)
tf = card.text_frame
line(tf, "2 of 3", 40, RED, bold=True, first=True, spacing=0.9)
line(tf, "people breathe air that exceeds WHO safe limits.", 14, BODY, before=8, spacing=1.15)
line(tf, "Indoor and outdoor workers get the least warning.", 12, MUTED, before=8, spacing=1.15)

footer(s2, 2)

# ---------------------------------------------------------------- slide 3
s3 = slide(prs)
header(s3, "Our solution", "One dashboard, three answers")
bullets(s3, [
    "Live AQI for your city, right now.",
    "A 72-hour forecast, not a yearly average.",
    "Advice tuned to who you are.",
], Inches(2.15), width=Inches(11.0), size=18, gap=10)

cards = [
    ("Live AQI", "Colour-coded air quality with PM2.5, PM10, NO2 and O3.", GREEN),
    ("72-hour forecast", "See the clean hours and the polluted ones ahead.", YELLOW),
    ("Personalised advice", "Four rules-based tips for your profile.", NAVY),
]
cw, gap = Inches(3.71), Inches(0.2)
for i, (t, d, col) in enumerate(cards):
    x = ML + i * (cw + gap)
    c = rect(s3, x, Inches(3.85), cw, Inches(2.05))
    hline(s3, x, Inches(3.85), cw, color=col, width=3)
    tf = c.text_frame
    tf.margin_top = Inches(0.3)
    line(tf, t, 18, INK, bold=True, first=True)
    line(tf, d, 13.5, BODY, before=9, spacing=1.2)

footer(s3, 3)

# ---------------------------------------------------------------- slide 4
s4 = slide(prs)
header(s4, "Key features", "What the prototype does")
bullets(s4, [
    "Live AQI plus PM2.5, PM10, NO2 and O3 readings.",
    "72-hour forecast marking the best and worst hours to go out.",
    "Personalised tips for child, elderly, asthma, athlete and general profiles.",
    "Climate risk score and a red health alert above AQI 150.",
], Inches(2.25), width=Inches(7.4), size=17, gap=17)

aqi_chips(s4, Inches(8.6), Inches(2.45))
c = rect(s4, Inches(8.4), Inches(3.3), Inches(4.03), Inches(2.0), fill=TINT)
tf = c.text_frame
line(tf, "No API keys", 17, INK, bold=True, first=True)
line(tf, "Free Open-Meteo data only. No backend, no paid service, no AI calls in the app.",
     13.5, BODY, before=8, spacing=1.2)

footer(s4, 4)

# ---------------------------------------------------------------- slide 5
s5 = slide(prs)
header(s5, "How it works", "Four steps, fully client-side")

steps = [
    ("1", "City search", "Type a city, pick from suggestions", NAVY),
    ("2", "Live data", "Air quality and weather for that city", GREEN),
    ("3", "Rule-based analysis", "AQI band, risk score, profile rules", YELLOW),
    ("4", "Output", "Forecast chart, tips and alerts", ORANGE),
]
bw, bgap = Inches(2.45), Inches(0.44)
startx = ML + (CW - (4 * bw + 3 * bgap)) / 2
y = Inches(2.6)
for i, (num, t, d, col) in enumerate(steps):
    x = startx + i * (bw + bgap)
    c = rect(s5, x, y, bw, Inches(1.95))
    hline(s5, x, y, bw, color=col, width=3)
    badge = rect(s5, x + Inches(0.22), y + Inches(0.28), Inches(0.42), Inches(0.42),
                 fill=col, outline=None, shape=MSO_SHAPE.OVAL)
    btf = badge.text_frame
    btf.margin_left = btf.margin_right = btf.margin_top = btf.margin_bottom = 0
    btf.vertical_anchor = MSO_ANCHOR.MIDDLE
    line(btf, num, 14, WHITE, bold=True, first=True, align=PP_ALIGN.CENTER)
    tf = c.text_frame
    tf.margin_top = Inches(0.86)
    line(tf, t, 16.5, INK, bold=True, first=True, spacing=1.0)
    line(tf, d, 12.5, BODY, before=7, spacing=1.15)
    if i < 3:
        ax = x + bw + Inches(0.08)
        a = rect(s5, ax, y + Inches(0.86), Inches(0.28), Inches(0.22),
                 fill=HAIR, outline=None, shape=MSO_SHAPE.RIGHT_ARROW)

tf = tbox(s5, ML, Inches(5.15), CW, Inches(0.4))
line(tf, "Every tip is a plain rule in code — no model, no key, no data leaves the browser.",
     14, MUTED, first=True, align=PP_ALIGN.CENTER)

footer(s5, 5)

# ---------------------------------------------------------------- slide 6
s6 = slide(prs)
header(s6, "Live demo", "See it running")

ph = rect(s6, Inches(1.85), Inches(2.15), Inches(9.6), Inches(3.6), fill=TINT, outline=HAIR,
          width=1.5, radius=0.02)
ph.line.dash_style = MSO_LINE.DASH
tf = ph.text_frame
tf.vertical_anchor = MSO_ANCHOR.MIDDLE
line(tf, "Insert app screenshot here", 26, MUTED, bold=True, first=True, align=PP_ALIGN.CENTER)
line(tf, "Breezo dashboard — white theme, navbar city search, AQI card, pollutant cards, "
         "72-hour chart and the tips panel", 13, MUTED, before=12, align=PP_ALIGN.CENTER,
     spacing=1.2)

tf = tbox(s6, ML, Inches(6.0), CW, Inches(0.4))
line(tf, "Live dashboard for Chennai, Delhi and Bengaluru", 16, NAVY, bold=True, first=True,
     align=PP_ALIGN.CENTER)

footer(s6, 6)

# ---------------------------------------------------------------- slide 7
s7 = slide(prs)
header(s7, "Impact", "Who it helps, and what changes")
bullets(s7, [
    "Children, the elderly and people with asthma can act early.",
    "Families avoid the worst outdoor hours instead of guessing.",
    "Communities become more resilient to pollution and heat stress.",
    "Open data means any city, any school, any volunteer group can use it.",
], Inches(2.2), width=Inches(7.3), size=17, gap=17)

c = rect(s7, Inches(8.4), Inches(2.2), Inches(4.03), Inches(2.6), fill=TINT)
tf = c.text_frame
line(tf, "Equity first", 17, INK, bold=True, first=True)
line(tf, "A red banner appears above AQI 150 so the warning cannot be missed, and the same "
         "rules speak to every profile in plain language.", 13.5, BODY, before=8, spacing=1.2)
aqi_chips(s7, Inches(8.4), Inches(5.0), caption=False)

footer(s7, 7)

# ---------------------------------------------------------------- slide 8
s8 = slide(prs)
header(s8, "Tech and future scope", "Built to be extended")

tf = tbox(s8, ML, Inches(2.1), Inches(11.0), Inches(0.3))
line(tf, "BUILT WITH", 11, MUTED, bold=True, first=True)
tech = ["React", "Tailwind CSS", "Recharts", "Open-Meteo open data"]
x = ML
for t in tech:
    w = Inches(0.32 + 0.105 * len(t))
    c = rect(s8, x, Inches(2.45), w, Inches(0.46), fill=WHITE, outline=HAIR)
    ctf = c.text_frame
    ctf.vertical_anchor = MSO_ANCHOR.MIDDLE
    line(ctf, t, 13.5, NAVY, bold=True, first=True, align=PP_ALIGN.CENTER)
    x += w + Inches(0.16)

tf = tbox(s8, ML, Inches(3.3), Inches(11.0), Inches(0.3))
line(tf, "NEXT", 11, MUTED, bold=True, first=True)
bullets(s8, [
    "Mobile push alerts when AQI crosses a threshold.",
    "Local language support for regional readability.",
    "Integration with low-cost local sensor networks.",
    "School and city-level dashboards.",
], Inches(3.65), width=Inches(7.6), size=16, gap=13)

c = rect(s8, Inches(8.6), Inches(3.6), Inches(3.83), Inches(2.2), fill=TINT)
tf = c.text_frame
line(tf, "Thank you", 32, INK, bold=True, first=True, spacing=0.95)
line(tf, "Breathe easy. Know your air.", 14, NAVY, before=10)
line(tf, "Questions welcome.", 12.5, MUTED, before=6)

footer(s8, 8)

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Breezo_Presentation.pptx")
prs.save(out)
print("SAVED:", out)
print("slides:", len(prs.slides.__iter__.__self__._sldIdLst))
