---
layout: page
permalink: /publications/
title: publications
nav: true
nav_order: 5
---

<!-- _pages/publications.md: preprints (unnumbered) followed by publications numbered counting down -->
<div class="publications">
  <h2 id="preprints">Preprints</h2>
  <div class="preprints">
    {% bibliography --file preprints %}
  </div>

  <h2 id="peer-reviewed">Publications</h2>
  {% capture publication_count %}{% bibliography_count %}{% endcapture %}
  <div style="counter-reset: publication {{ publication_count | strip | plus: 1 }}">
    {% bibliography %}
  </div>
</div>
