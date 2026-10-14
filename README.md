# IELTS Reading Practice

An interactive version of the **IELTS Academic Reading Pattern Walkthrough**. The text is the same as the PDF, and so is the look. You answer each question on the page, and the answer and the reason are folded directly underneath until you tap them.

**Open it:** https://shuvo4321-ally.github.io/ielts-reading-practice/

## What's inside

It is one continuous page. The Contents on the cover jumps to any part or pattern.

| Part | What it is |
|---|---|
| **1 Technique** | How to read the passage, what to mark, the five steps for every question, paraphrase, and the words that decide the answer. |
| **2 Full test** | Three passages and 40 questions, laid out like the exam. There is an optional 60-minute timer. "Mark the test" gives your score out of 40, an indicative Academic band and a list of questions to review. |
| **3 Patterns** | 24 question patterns (TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN, headings, matching, multiple choice, completion, diagrams). Each one has the technique, a passage, the questions, and a "same pattern next time" box. |

## Using it

- **Answering:** TRUE/FALSE/NOT GIVEN and YES/NO/NOT GIVEN questions have three buttons. Multiple choice has letter buttons. Headings, matching and completion questions have a box to type in.
- **Checking:** open **Show answer** under a question to see whether you were right, the correct answer and the reason.
- **Marking:** typed answers are marked the way an examiner marks them. British and American spellings are both accepted, but a misspelled word is wrong. A near miss is pointed out.
- **Answer highlights:** **Show highlights** on a passage marks the answer (yellow), the trap (pink) and the paraphrase (green). The three test passages show them after you mark the test. Hover a highlight to see which question it belongs to.
- **Your own highlighter:** select any words in a passage and pick yellow, green, pink or blue, as in the computer-based test. Tap a highlight to remove it, or use **Clear my highlights**. Your highlights are saved too.
- **Saving:** your answers are saved in this browser only. Nothing is sent anywhere.

## Rebuilding the page

`index.html` is generated from the files in `src/`:

```bash
cd src
python build.py
```

The build needs Python with `beautifulsoup4`. It checks that every one of the 119 answers can be read and that the full test is numbered exactly 1 to 40. If any check fails, the page is not written.

| File | Contents |
|---|---|
| `src/content.html` | The walkthrough text (the same source as the PDF) |
| `src/build.py` | Adds the answer controls, folds, highlights, Contents, timer and marking |
| `src/exam_highlights.py` | The answer, trap and paraphrase lines for the 40 test questions |
| `src/style.css` | Page styles |
| `src/app.js` | Marking, saved answers, both kinds of highlight, timer and score |

## Note

All passages and questions here are original practice material written for this project. They are not official IELTS papers. IELTS is a registered trademark of the British Council, IDP: IELTS Australia and Cambridge University Press & Assessment, which are not connected with this project.
