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
dog_photos:
  - { src: dina_1.jpg, w: 900, h: 1200, alt: "Dina, a black curly-haired dog, sitting on the boardwalk at sunset" }
  - { src: dina_2.jpg, w: 901, h: 1200, alt: "Dina standing on her hind legs, holding paws with a lab member" }
  - { src: dina_3.jpg, w: 1600, h: 899, alt: "Dina stretched out between a couch and a bench" }
---

<!-- Names grouped by role: each core lab member with a small photo and their bio beside it (the photo in the bio itself
     is hidden here), then the Lab Adventures photo collage, then collaborators and alumni as a list -->
{% capture lab_adventures %}
  <section class="lab-adventures" aria-labelledby="lab-adventures">
    <h2 id="lab-adventures">Lab Adventures</h2>
    <!-- Each photo's flex share is its aspect ratio, so the photos in a row line up at one height -->
    <div class="adventures-row">
      {% for photo in page.lab_photos %}
        {% assign ratio = photo.w | times: 1.0 | divided_by: photo.h %}
        <img src="{{ '/assets/img/lab/' | append: photo.src | relative_url }}" width="{{ photo.w }}" height="{{ photo.h }}" alt="{{ photo.alt }}" loading="lazy" style="flex: {{ ratio }} 1 {{ ratio | times: 240 | round }}px">
      {% endfor %}
    </div>
    <figure class="adventures-dog">
      <div class="adventures-row">
        {% for photo in page.dog_photos %}
          {% assign ratio = photo.w | times: 1.0 | divided_by: photo.h %}
          <img src="{{ '/assets/img/lab/' | append: photo.src | relative_url }}" width="{{ photo.w }}" height="{{ photo.h }}" alt="{{ photo.alt }}" loading="lazy" style="flex: {{ ratio }} 1 {{ ratio | times: 240 | round }}px">
        {% endfor %}
      </div>
      <figcaption>Our official lab dog, Dina!</figcaption>
    </figure>
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
        <h2 class="team-category team-minor" id="{{ category }}">{{ category }}</h2>
        <ul class="team-list team-minor">
          {% for member in members %}
            <li>
              <a href="{% if member.redirect %}{{ member.redirect }}{% else %}{{ member.url | relative_url }}{% endif %}">{{ member.title }}</a>
            </li>
          {% endfor %}
        </ul>
      {% else %}
        <h2 class="team-category team-core" id="{{ category }}">{{ category }}</h2>
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
