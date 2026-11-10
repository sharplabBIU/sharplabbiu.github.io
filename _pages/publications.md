---
layout: page
permalink: /publications/
title: papers
nav: true
nav_order: 5
split: true # two boxes, side by side, in place of the one content box
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
