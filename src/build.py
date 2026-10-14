"""Turn the Reading Pattern Walkthrough (content.html, the same source as the PDF) into the interactive page.

The text is not rewritten. The build only:
  - splits the book into white "pages" (cover, each part opener, each pattern),
  - adds an answer control to every question and folds the answer + reason directly under it,
  - folds the "What you should get" boxes and hides passage highlights behind a switch,
  - adds the Contents, the optional 60-minute timer and "Mark the test" for the full test.
It stops with a list of problems if any answer cannot be read or the test is not numbered 1-40.
"""
import html, json, os, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag, Comment

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "index.html")
problems = []

soup = BeautifulSoup(open(os.path.join(HERE, "content.html"), encoding="utf-8").read(), "html.parser")
body = soup.body


def frag(markup):
    return BeautifulSoup(markup, "html.parser")


def text(el):
    return re.sub(r"\s+", " ", el.get_text(" ")).replace(" ", " ").strip()


# ---------------------------------------------------------------- 1. inline styles: PDF units -> screen px
PT, MM = 17 / 10.7, 17 / 10.7 * 72 / 25.4   # body 10.7pt in the PDF = 17px on screen
for el in soup.find_all(style=True):
    el["style"] = re.sub(r"(\d+(?:\.\d+)?)(pt|mm)",
                         lambda m: f"{float(m.group(1)) * (PT if m.group(2) == 'pt' else MM):.1f}px", el["style"])

# ---------------------------------------------------------------- 2. split the book into sheets
sheets, cur = [], None
for node in list(body.children):
    if isinstance(node, Comment):
        node.extract(); continue
    if isinstance(node, NavigableString):
        if node.strip() == "":
            node.extract(); continue
    if isinstance(node, Tag) and set(node.get("class", [])) & {"cover", "part", "pat"}:
        cur = soup.new_tag("div", attrs={"class": "sheetpage"})
        sheets.append(cur)
    node.extract()
    cur.append(node)
for sh in sheets:
    body.append(sh)

part_no, pat_sheets = 0, []
for sh in sheets:
    first = sh.find(True)
    cls = first.get("class", [])
    if "cover" in cls:
        sh["id"] = "start"
    elif "part" in cls:
        part_no += 1; sh["id"] = f"part-{part_no}"
    else:
        num = text(first.select_one(".pnum"))
        sh["id"] = "pat-" + (num.split()[-1] if num.startswith("PATTERN") else "final")
        pat_sheets.append(sh)
if part_no != 3:
    problems.append(f"expected 3 parts, found {part_no}")
part2 = soup.find(id="part-2")

# ---------------------------------------------------------------- 3. answers
qas = soup.select(".qa")
TF = {"TRUE", "FALSE", "NOT GIVEN", "YES", "NO"}


def accepted(raw):
    """Return (kind, list of accepted answers)."""
    a = raw.replace("—", "—").replace("–", "–").strip()
    if a in TF:
        return "tf", [a]
    m = re.fullmatch(r"([A-H])\s*—\s*.+", a)
    if m:
        return "letter", [m.group(1)]
    if re.fullmatch(r"[A-H]|[ivx]+", a):
        return "letter", [a]
    m = re.fullmatch(r"([A-H]) and ([A-H])", a)
    if m:
        return "two", [m.group(1), m.group(2)]
    alts = []
    for alt in [x.strip() for x in a.split("/")]:
        m = re.fullmatch(r"\(([^)]+)\)\s*(.+)", alt)
        alts += [m.group(2), m.group(1) + " " + m.group(2)] if m else [alt]
    if not all(alts):
        return None, []
    return "text", alts


infos = []
for qa in qas:
    qn = text(qa.select_one(".qn"))
    ans = text(qa.select_one(".ansv"))
    kind, acc = accepted(ans)
    if not kind:
        problems.append(f"{qn}: cannot read answer {ans!r}")
        continue
    exam = not qn.startswith("Q")
    num = int(re.match(r"Q?(\d+)", qn).group(1))
    infos.append(dict(el=qa, qn=qn, num=num, exam=exam, kind=kind, acc=acc, id=("T" if exam else "P") + str(num)))

exam_nums = sorted(i["num"] for i in infos if i["exam"])
if exam_nums != list(range(1, 41)):
    problems.append(f"full test is not numbered exactly 1-40: {exam_nums}")
ids = [i["id"] for i in infos]
if len(ids) != len(set(ids)):
    problems.append("duplicate question numbers")


def tf_set(info):
    """TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN, read from the nearest TF-type neighbour in the same section."""
    if info["acc"][0] in ("YES", "NO"):
        return "yn"
    if info["acc"][0] in ("TRUE", "FALSE"):
        return "tf"
    sec = info["el"].find_parent(class_="sheetpage")
    ptype = sec.select_one(".ptype")
    if ptype:
        return "yn" if "Yes" in text(ptype) else "tf"
    best = min((o for o in infos if o["exam"] == info["exam"] and o["kind"] == "tf" and o["acc"][0] != "NOT GIVEN"),
               key=lambda o: abs(o["num"] - info["num"]))
    return "yn" if best["acc"][0] in ("YES", "NO") else "tf"


for info in infos:
    qa, qid = info["el"], info["id"]
    qa["data-q"] = qid
    qa["data-kind"] = info["kind"]
    qa["data-acc"] = json.dumps(info["acc"])
    qa["id"] = "q-" + qid
    qq = qa.select_one(".qq")
    opts = qq.select(".opts > div")
    letters = [m.group(1) for d in opts for m in [re.match(r"\s*([A-H])\b", text(d))] if m]
    if info["kind"] == "tf":
        words = ["YES", "NO", "NOT GIVEN"] if tf_set(info) == "yn" else ["TRUE", "FALSE", "NOT GIVEN"]
        ctl = "".join(f'<button type="button" class="ch" data-v="{w}">{w}</button>' for w in words)
    elif info["kind"] in ("letter", "two") and letters:
        qa["data-pick"] = "2" if info["kind"] == "two" else "1"
        ctl = "".join(f'<button type="button" class="ch" data-v="{l}">{l}</button>' for l in letters)
        if info["kind"] == "two":
            ctl += '<span class="hint">Choose TWO letters.</span>'
    elif info["kind"] in ("letter", "two"):
        roman = re.fullmatch(r"[ivx]+", info["acc"][0]) is not None
        ph = "i, ii, iii…" if roman else ("two letters" if info["kind"] == "two" else "letter")
        ctl = f'<input class="ain short" type="text" autocomplete="off" spellcheck="false" placeholder="{ph}" aria-label="Answer {html.escape(info["qn"])}">'
    else:
        ctl = f'<input class="ain" type="text" autocomplete="off" spellcheck="false" placeholder="your answer" aria-label="Answer {html.escape(info["qn"])}">'
    qq.insert_after(frag(f'<div class="qctl"><span class="lbl">Your answer</span>{ctl}<span class="hint" data-hint></span></div>'))
    ab, ww = qa.select_one(".ab"), qa.select_one(".ww")
    det = frag('<details class="afold"><summary><span class="peek">Show answer</span><span class="res"></span></summary>'
               '<p class="yours" hidden></p></details>').details
    ab.extract(); ww.extract()
    det.append(ab); det.append(ww)
    qa.append(det)

# ---------------------------------------------------------------- 4. fold "what you should get", highlight switches
for box in soup.select(".box.get"):
    lab = box.select_one(".lab")
    label = text(lab) if lab else "What you should get"
    if lab:
        lab.extract()
    det = frag(f'<details class="fold get box"><summary>{html.escape(label)} <span class="hint">open after you answer</span></summary>'
               '<div class="foldbody"></div></details>').details
    for c in list(box.children):
        det.select_one(".foldbody").append(c.extract())
    box.replace_with(det)

LEGEND = ('<span class="legend"><span class="hA">answer</span><span class="hT">trap</span><span class="hP">paraphrase</span></span>')
for psg in soup.select(".psg"):
    if not psg.select(".hA, .hT, .hP"):
        continue
    psg["class"] = psg.get("class", []) + ["hl-off"]
    row = frag(f'<div class="hlrow"><button type="button" class="ghost sm" data-hl>Show highlights</button>{LEGEND}</div>').div
    lab = psg.select_one(".lab")
    if lab:
        lab.insert_after(row)
    else:
        psg.insert(0, row)

# ---------------------------------------------------------------- 5. full test: passages, answer sheets, timer, marking
exam_psgs = [d for d in part2.select(".psg") if "background:#fff" in d.get("style", "")]
if len(exam_psgs) != 3:
    problems.append(f"expected 3 exam passages, found {len(exam_psgs)}")
for i, d in enumerate(exam_psgs, 1):
    d["id"] = f"passage-{i}"
n = 0
for h in part2.find_all("h2"):
    if "the answers, with the reason" in text(h).lower():
        n += 1
        h.string = f"Passage {n}: your answer sheet"
        h.insert_after(frag('<p class="small">Answer each question here, as you would on the answer sheet. '
                            'The answer and the reason are folded directly underneath. Leave them closed if you are sitting it as a test.</p>'))
try_box = next((b for b in part2.select(".box.tech") if "Try it first" in text(b)), None)
timer_ui = ('<div class="actions" id="timerbar"><button type="button" class="primary sm" id="timer-start">Start the 60-minute timer</button>'
            '<span class="small">Optional. It keeps counting if you scroll, reload or close the page.</span></div>')
if try_box:
    try_box.append(frag(timer_ui))
else:
    problems.append("full test: 'Try it first' box not found")
mark_ui = ('<div id="marking"><h2 id="result-head">Mark the test</h2><p>When you have answered all three passages, mark the paper. '
           'Questions 1&ndash;40 score one mark each.</p><div id="markarea"></div></div>')
first_same = part2.select_one(".box.same")
(first_same.insert_before if first_same else part2.append)(frag(mark_ui))

# per-pattern buttons
for sh in pat_sheets:
    if not sh.select(".qa"):
        continue
    pid = sh["id"]
    bar = frag(f'<div class="actions"><button type="button" class="ghost sm" data-showall="{pid}">Show all answers</button>'
               f'<button type="button" class="ghost sm" data-clear="{pid}">Clear my answers</button></div>')
    last = sh.select(".qa")[-1]
    last.insert_after(bar)

# ---------------------------------------------------------------- 6. cover text + contents
cover = soup.select_one(".cover")
cover.select_one(".sub").string = "24 patterns · a complete 40-question test · every answer explained where it happens"
ul = cover.find("ul")
ul.clear()
ul.append(frag(
    "<li>This is a walkthrough, not just a mock test. Answer each question on the page: the answer and the reason are "
    "<b>folded directly underneath</b>, closed until you tap them.</li>"
    "<li>Each pattern shows you the technique and the passage, then the questions. Press <b>Show highlights</b> on a passage "
    "to see the important parts marked: <span class=\"hA\">the answer</span>, <span class=\"hT\">the trap</span>, "
    "<span class=\"hP\">the paraphrase</span>. What you should take from it is folded too.</li>"
    "<li><b>Part 1</b> is the reading technique. <b>Part 2</b> is a complete reading test: three passages, 40 questions, laid out "
    "exactly as in the exam, with an optional 60-minute timer and a band score. <b>Part 3</b> is the 24 patterns. "
    "It is all one page: scroll through it like the book, or jump from the Contents below.</li>"
    "<li>All passages are original, written for this book. Your answers are saved in this browser only.</li>"))


def toc_row(href, n, t, cc="", st_id=""):
    st = f'<span class="st" id="{st_id}"></span>' if st_id else '<span class="st"></span>'
    return (f'<a href="#{href}"><span class="n">{n}</span><span class="t">{t}'
            + (f' <span class="cc">· {cc}</span>' if cc else "") + f'</span>{st}</a>')


rows = ['<div class="grp">Part 1 · Reading technique</div>']
p1 = soup.find(id="part-1")
for i, h in enumerate(p1.find_all("h2"), 1):
    h["id"] = f"tech-{i}"
    title = re.sub(r"^\d+\.\s*", "", text(h))
    rows.append(toc_row(h["id"], f"1.{i}", html.escape(title)))
rows.append('<div class="grp">Part 2 · A complete reading test</div>')
for i, d in enumerate(exam_psgs, 1):
    title = next((text(p) for p in d.find_all("p") if "text-align:center" in p.get("style", "")), "")
    rng = ["1–13", "14–26", "27–40"][i - 1]
    rows.append(toc_row(f"passage-{i}", f"PASSAGE {i}", html.escape(title), f"Questions {rng}", f"toc-psg-{i}"))
rows.append(toc_row("result-head", "SCORE", "Mark the test", "score out of 40 and band", "toc-score"))
rows.append('<div class="grp">Part 3 · The 24 patterns</div>')
for sh in pat_sheets:
    num, title = text(sh.select_one(".pnum")), text(sh.select_one(".pat-title"))
    ptype = sh.select_one(".ptype")
    rows.append(toc_row(sh["id"], html.escape(num), html.escape(title), html.escape(text(ptype)) if ptype else "",
                        "toc-" + sh["id"] if sh.select(".qa") else ""))
cover.parent.append(frag('<div class="toc" id="contents"><h2>Contents</h2>' + "".join(rows) + "</div>"))

# wide tables scroll inside their own box on phones
for t in soup.find_all("table"):
    if not t.find_parent(class_="tablewrap"):
        t.wrap(soup.new_tag("div", attrs={"class": "tablewrap"}))

# ---------------------------------------------------------------- 7. write
if problems:
    print("PROBLEMS:")
    for p in problems:
        print("  -", p)
    sys.exit(1)

css = open(os.path.join(HERE, "style.css"), encoding="utf-8").read()
js = open(os.path.join(HERE, "app.js"), encoding="utf-8").read()
page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta name="description" content="IELTS Academic Reading practice: technique, a full 40-question test and 24 question patterns, with every answer explained.">\n'
        '<title>IELTS Reading Lab</title>\n<style>\n' + css + '</style>\n</head>\n<body>\n<main id="view">\n'
        + "\n".join(str(s) for s in sheets) +
        '\n</main>\n<div class="timer" id="timer" hidden><span class="tl">Test time</span><span class="tt" id="timer-t">60:00</span>'
        '<button type="button" class="ghost sm" id="timer-stop">Stop</button></div>\n'
        '<a class="totop" id="totop" href="#contents" hidden>↑ Contents</a>\n<script>\n' + js + '\n</script>\n</body>\n</html>\n')
open(OUT, "w", encoding="utf-8").write(page)
kinds = {}
for i in infos:
    kinds[i["kind"]] = kinds.get(i["kind"], 0) + 1
print(f"OK  {len(infos)} questions ({len(exam_nums)} in the full test, {len(infos) - len(exam_nums)} in the patterns) {kinds}")
print(f"OK  {len(sheets)} pages, {len(pat_sheets)} pattern pages · page written: {len(page) // 1024} KB")
