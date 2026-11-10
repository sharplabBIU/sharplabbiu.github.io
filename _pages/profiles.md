---
layout: page
title: team
permalink: /team/
description: Our Team
nav: true
nav_order: 3
display_categories: [Director, Post-Doc, PhD, MA, BA, Collaborators, Alumni]
minor_categories: [Collaborators, Alumni] # in smaller type, set apart below the core team
lab_photos:
  - { src: lab_1.jpg, w: 1050, h: 1400, alt: "Lab members together at a conference" }
  - { src: lab_2.jpg, w: 1400, h: 1050, alt: "Lab celebration with cake" }
  - { src: lab_3.jpg, w: 1400, h: 1050, alt: "Poster presentation at a conference" }
  - { src: lab_4.jpg, w: 1400, h: 1050, alt: "Presenting a poster to visitors at a conference" }
  - { src: lab_5.jpg, w: 1400, h: 1330, alt: "Lab lunch outdoors with pizza" }
  - { src: lab_6.jpg, w: 1400, h: 1050, alt: "Explaining a poster at a conference" }
dog_photos: # after the lab photos, as "Lab Mascot"
  - { src: dina_1.jpg, w: 900, h: 1200, alt: "Dina, a black curly-haired dog, sitting on the boardwalk at sunset" }
  - { src: dina_2.jpg, w: 901, h: 1200, alt: "Dina standing on her hind legs, holding paws with a lab member" }
  - { src: dina_3.jpg, w: 1600, h: 899, alt: "Dina stretched out between a couch and a bench" }
---

<!-- Names grouped by role, under a bar with the role's name: each core lab member with a small photo and their bio beside
     it (the photo in the bio itself is hidden here), then Lab Adventures, then collaborators and alumni as a list -->
{% capture lab_adventures %}
  <!-- Lab Adventures: a string of Christmas lights hung down either side of the box (on windows wide enough to have room
       there), "Lab Adventures" written into the left one's cable, with a tiny light for each photo (Dina's too).
       Clicking a light shows its photo above it, and the photo opens large when clicked; on narrower windows the
       lights are a row here, under the heading (assets/js/lab-adventures.js hangs the cable and the lights) -->
  <section class="lab-adventures" aria-labelledby="lab-adventures">
    <h2 class="section-bar" id="lab-adventures">Lab Adventures</h2>
    {% assign photos = page.lab_photos | concat: page.dog_photos %}
    {% assign half = photos.size | plus: 1 | divided_by: 2 %}
    <div class="adventure-lights">
      {% for side in (1..2) %}
        {% if side == 1 %}{% assign skip = 0 %}{% assign take = half %}{% else %}{% assign skip = half %}{% assign take = photos.size %}{% endif %}
        <div class="side-col {% if side == 1 %}side-left{% else %}side-right{% endif %} adventure-col"{% if side == 1 %} data-cable-label="Lab Adventures"{% endif %}>
          {% for photo in photos offset: skip limit: take %}
            {% assign n = forloop.index0 | plus: skip | plus: 1 %}
            {% if n > page.lab_photos.size %}{% assign word = 'Lab Mascot' %}{% assign k = n | minus: page.lab_photos.size %}{% else %}{% assign word = 'Lab Adventure' %}{% assign k = n %}{% endif %}
            <button type="button" class="adv-light adv-glow-{{ n | modulo: 6 }}" data-src="{{ '/assets/img/lab/' | append: photo.src | relative_url }}" data-w="{{ photo.w }}" data-h="{{ photo.h }}" data-alt="{{ photo.alt | escape }}" data-label="{{ word }} {{ k }}" aria-label="Show {{ word }} photo {{ k }}" title="{{ word }}">
              <svg viewBox="-7 -1 14 22" aria-hidden="true"><rect class="bulb-cap" x="-2.8" y="0" width="5.6" height="5.2" rx="1.2" /><path class="bulb-glass" d="M0 4.4 C3.8 6 4.9 10.6 3.6 14.6 C2.7 17.6 1.3 19.4 0 19.4 C-1.3 19.4 -2.7 17.6 -3.6 14.6 C-4.9 10.6 -3.8 6 0 4.4 Z" /><ellipse class="bulb-shine" cx="-1.4" cy="10" rx="0.9" ry="2.6" /></svg>
            </button>
          {% endfor %}
        </div>
      {% endfor %}
    </div>
    <script src="{{ '/assets/js/lab-adventures.js' | relative_url | bust_file_cache }}" defer></script>
  </section>
{% endcapture %}
<div class="team">
  {% assign adventures_shown = false %}
  {% for category in page.display_categories %}
    {% assign members = site.projects | where: 'category', category | sort: 'importance' %}
    {% if members.size > 0 %}
      {% if page.minor_categories contains category %}
        {% unless adventures_shown %}
          {{ lab_adventures }}
          {% assign adventures_shown = true %}
        {% endunless %}
        <h2 class="team-category team-minor section-bar" id="{{ category }}">{{ category }}</h2>
        <ul class="team-list team-minor">
          {% for member in members %}
            <li>
              <a href="{% if member.redirect %}{{ member.redirect }}{% else %}{{ member.url | relative_url }}{% endif %}">{{ member.title }}</a>
            </li>
          {% endfor %}
        </ul>
      {% else %}
        <h2 class="team-category team-core section-bar" id="{{ category }}">{{ category }}</h2>
        <div class="team-members">
          {% for member in members %}
            <div class="member">
              {% if member.img %}
                <img class="member-photo" src="{{ member.img | relative_url }}" alt="{{ member.title }}" loading="lazy">
              {% endif %}
              <div class="member-text">
                <h3 class="member-name">{{ member.title }}</h3>
                <div class="member-bio">{{ member.content }}</div>
              </div>
            </div>
          {% endfor %}
        </div>
      {% endif %}
    {% endif %}
  {% endfor %}
  {% unless adventures_shown %}
    {{ lab_adventures }}
  {% endunless %}
</div>
