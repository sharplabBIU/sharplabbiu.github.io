---
layout: page
permalink: /publications/
title: papers
nav: true
nav_order: 5
split: true # two boxes, side by side, in place of the one content box
# Our newest papers, shown either side of the boxes (on windows wide enough to have room there), each a picture of its
# core theme with its journal, linking to the paper: the first half on the left, the rest on the right
featured:
  - journal: Psychological Science
    title: Humans adaptively delay planning using cognitive maps
    note: 2027, accepted
    url: https://osf.io/preprints/psyarxiv/8ubct_v1
    image: delay-planning.svg
    alt: A folded map with a route to a star, a clock at one junction, and an hourglass
    accent: "#2dd4bf"
  - journal: Clinical Psychological Science
    title: Unravelling Repetitive Negative Thinking With Reinforcement Learning
    note: 2026, accepted
    url: https://osf.io/preprints/psyarxiv/cu46a_v1
    image: repetitive-thinking.svg
    alt: A head with a loop of negative thoughts going round inside it, and a raining thought cloud with a spiral
    accent: "#c39bff"
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
  - journal: JMIR
    title: "Safety and Efficacy of Modular Digital Psychotherapy for Social Anxiety: Randomized Controlled Trial"
    note: "2025"
    url: https://www.jmir.org/2025/1/e64138
    image: digital-therapy.svg
    alt: A phone with therapy modules and a chat, people together, a shield with a tick, and falling symptom bars
    accent: "#5df0a4"
  - journal: Trends in Cognitive Sciences
    title: Anxiety involves altered planning
    note: "2024"
    url: https://www.sciencedirect.com/science/article/pii/S1364661324002924
    image: anxiety-planning.svg
    alt: A plan fanning out into many branches, with warning signs at their ends and a loop back to re-check
    accent: "#ffb26b"
---

<!-- _pages/publications.md: the published papers (numbered, counting down) on the left and the preprints (unnumbered) on
the right, in two boxes side by side, each scrolling on its own -->
<div class="publications papers-split">
  <section class="paper-box" aria-labelledby="peer-reviewed">
    <h2 class="section-bar" id="peer-reviewed">Published</h2>
    {% capture publication_count %}{% bibliography_count %}{% endcapture %}
    <div style="counter-reset: publication {{ publication_count | strip | plus: 1 }}">
      {% bibliography %}
    </div>
  </section>

  <section class="paper-box preprints" aria-labelledby="preprints">
    <h2 class="section-bar" id="preprints">Preprints</h2>
    {% bibliography --file preprints %}
  </section>
</div>

<!-- Our newest papers, either side of the boxes -->
{% assign half = page.featured.size | plus: 1 | divided_by: 2 %}
{% for side in (1..2) %}
  <aside class="side-col side-only {% if side == 1 %}side-left{% else %}side-right{% endif %} paper-features" aria-label="Our newest papers">
    {% if side == 1 %}{% assign skip = 0 %}{% assign take = half %}{% else %}{% assign skip = half %}{% assign take = page.featured.size %}{% endif %}
    {% for paper in page.featured offset: skip limit: take %}
      <a class="paper-feature" href="{{ paper.url }}" target="_blank" rel="noopener" style="--pf-accent: {{ paper.accent }}" title="{{ paper.title | escape }}">
        <img src="{{ '/assets/img/papers/' | append: paper.image | relative_url }}" width="320" height="180" alt="{{ paper.alt | escape }}">
        <span class="pf-journal"><span>{{ paper.journal }}</span><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
        <span class="pf-title">{{ paper.title }}</span>
        <span class="pf-note">{{ paper.note }}</span>
      </a>
    {% endfor %}
  </aside>
{% endfor %}
