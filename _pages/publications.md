---
layout: page
permalink: /publications/
title: publications
nav: true
nav_order: 5
---

<!-- _pages/publications.md -->
{% capture publication_count %}{% bibliography_count %}{% endcapture %}
<div class="publications" style="counter-reset: publication {{ publication_count | strip | plus: 1 }}">
  {% bibliography %}
</div>
