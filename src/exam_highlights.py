"""Answer / trap / paraphrase highlights for the three full-test passages (Part 2).

Each entry: (passage number, class, exact phrase from the passage, question numbers it belongs to).
  hA = the words that give the answer   hT = the trap   hP = the paraphrase link
build.py checks that every phrase occurs exactly once in its passage, so a typo stops the build.
They stay hidden until the reader presses "Show highlights" or marks the test.
"""
EXAM_HL = [
    # ---- Passage 1: Bamboo (Questions 1-13)
    (1, "hA", "emerges from the ground at close to its final diameter", [1]),
    (1, "hA", "After that it never grows again. It only hardens", [1]),
    (1, "hA", "Cutters normally take culms of between three and six years", [2]),
    (1, "hA", "contain too much starch", [6]),
    (1, "hA", "the underground rhizome system is untouched", [7]),
    (1, "hA", "Traditional practice dealt with this by leaching", [8]),
    (1, "hP", "washed the soluble sugars out of them", [8]),
    (1, "hT", "Modern producers more often use borax solutions", [3]),
    (1, "hA", "Its tensile strength along the grain exceeds that of mild steel by weight", [9]),
    (1, "hA", "the anatomy that makes it strong lengthwise makes it weak across the grain", [4]),
    (1, "hP", "It splits readily", [10]),
    (1, "hA", "traditional joints tie rather than nail", [10]),
    (1, "hA", "The event of 2006 was anticipated and prepared for", [5]),
    (1, "hT", "earlier ones had caused famine", [5]),
    (1, "hP", "almost none of this appears in forestry statistics", [11]),
    (1, "hA", "bamboo is classified as a non-timber forest product", [11]),
    (1, "hP", "much of that advantage disappears", [12]),
    (1, "hA", "if the material is shipped halfway around the world", [12]),
    (1, "hA", "within a few hundred kilometres of where it stands", [13]),

    # ---- Passage 2: The rise and fall of the department store (Questions 14-26)
    (2, "hP", "rebuilt it around three ideas that were then unusual", [14]),
    (2, "hA", "a customer could come in, look, and leave again without buying anything", [22]),
    (2, "hA", "Each of these abolished something", [14]),
    (2, "hA", "accidentally created a public interior in which she could spend an afternoon unaccompanied and unremarked", [15]),
    (2, "hT", "who studied Boucicaut's operation closely", [15, 23]),
    (2, "hA", "called the store a machine for selling", [23]),
    (2, "hA", "The buildings were designed to be looked at", [16]),
    (2, "hT", "The escalator, introduced for practical reasons", [16]),
    (2, "hA", "A department store made a low margin on each item and depended entirely on volume", [17]),
    (2, "hA", "above all, public transport", [17, 24]),
    (2, "hT", "the crowd stopped arriving by tram and started arriving by road", [18]),
    (2, "hA", "The shopping mall was the direct answer", [18]),
    (2, "hA", "signing a large store as an anchor tenant on favourable terms", [25]),
    (2, "hA", "they removed the last advantage the stores had, which was selection", [19]),
    (2, "hT", "Retail analyst Dana Telford has argued", [21]),
    (2, "hA", "no amount of cost-cutting could have answered this", [19]),
    (2, "hA", "the problem was one of over-expansion which the internet merely exposed", [21]),
    (2, "hA", "The stores that have done best are the ones that stopped trying to sell everything and became something other than shops", [20]),
    (2, "hA", "the food hall", [26]),
    (2, "hT", "the restaurants", [26]),

    # ---- Passage 3: Why we forget (Questions 27-40)
    (3, "hA", "The language gives it away", [40]),
    (3, "hA", "the curve was read, for the next century, as a picture of decay", [27, 31]),
    (3, "hA", "That reading is now looking doubtful", [27]),
    (3, "hP", "forgetting turns out to be expensive", [35]),
    (3, "hA", "not a passive fading but an active, energy-consuming process", [32]),
    (3, "hA", "If the brain is spending resources to forget, forgetting is doing something for it", [35]),
    (3, "hA", "keeping memory useful rather than complete", [33]),
    (3, "hA", "If you park in a different space each morning", [38]),
    (3, "hA", "yesterday's forty locations are interference to be cleared", [38]),
    (3, "hA", "a memory system that retained everything would not be a better memory system. It would be a worse one", [28]),
    (3, "hT", "It is tempting to envy them", [29]),
    (3, "hA", "the ability is oddly narrow", [36]),
    (3, "hA", "it does not extend to learning vocabulary or passing examinations", [29, 36]),
    (3, "hT", "which has risen throughout the waking hours", [34]),
    (3, "hA", "is scaled back down", [34]),
    (3, "hT", "the important traces are not made louder so much as everything else is made quieter", [37]),
    (3, "hA", "Whether the two processes are genuinely separate or two descriptions of a single mechanism is still argued about", [37]),
    (3, "hA", "None of this means that forgetting is always benign, and the argument is easy to push too far", [39]),
    (3, "hA", "Very little attention has gone to what a learner should be encouraged to let go", [30]),
    (3, "hA", "That seems to me the more interesting problem, and it has barely been looked at", [30]),
]
