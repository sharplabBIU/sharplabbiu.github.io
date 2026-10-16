---
layout: page
title: team
permalink: /team/
description: Our Team
nav: true
display_categories: [Director, Post-Doc, PhD, MA, BA, Collaborators, Alumni]
---

<!-- Names only, grouped by role; photos appear on each person's own page -->
<div class="team">
  {% for category in page.display_categories %}
    {% assign members = site.projects | where: 'category', category | sort: 'importance' %}
    {% if members.size > 0 %}
      <h2 class="team-category" id="{{ category }}">{{ category }}</h2>
      <ul class="team-list">
        {% for member in members %}
          <li>
            <a href="{% if member.redirect %}{{ member.redirect }}{% else %}{{ member.url | relative_url }}{% endif %}">{{ member.title }}</a>
          </li>
        {% endfor %}
      </ul>
    {% endif %}
  {% endfor %}
</div>
