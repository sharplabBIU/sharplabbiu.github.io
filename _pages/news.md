---
layout: page
title: news
permalink: /news/
nav: true
nav_order: 2
# Papers shown in the corners of the page either side of the box (on windows wide enough to have room there), each a
# picture of its core theme with its journal, linking to the paper: the first two down the left (top, then bottom), the
# other two down the right
featured:
  - journal: Psychological Science
    title: Humans adaptively delay planning using cognitive maps
    note: 2027, accepted
    url: https://osf.io/preprints/psyarxiv/8ubct_v1
    image: delay-planning.svg
    alt: A folded map with a route to a star, a clock at one junction, and an hourglass
    accent: "#2dd4bf"
  - journal: Nature Human Behaviour
    title: Humans adaptively deploy forward and backward prediction
    note: "2024"
    url: https://rdcu.be/dNWDV
    image: forward-backward.svg
    alt: A network of states with prediction sweeping forward from the start and backward from the goal, meeting in the middle
    accent: "#7fd0ff"
  - journal: Topics in Cognitive Science
    title: Anxiety is Associated With Biases in Task Generalization
    note: "2026"
    url: https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051
    image: task-generalization.svg
    alt: A route learned under a storm in one grid, carried over only faintly to a similar grid
    accent: "#ff8fc8"
  - journal: Trends in Cognitive Sciences
    title: Anxiety involves altered planning
    note: "2024"
    url: https://www.sciencedirect.com/science/article/pii/S1364661324002924
    image: anxiety-planning.svg
    alt: A plan fanning out into many branches, with warning signs at their ends and a loop back to re-check
    accent: "#ffb26b"
---

<!-- _pages/news.md: all lab news, newest first (items live in _news/) -->
<h2 class="news-heading">Lab news</h2>
{% include news.liquid %}
{% include paper_features.liquid %}
