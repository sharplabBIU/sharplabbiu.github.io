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
  - { src: lab_1.jpg, alt: "Lab members together at a conference" }
  - { src: lab_2.jpg, alt: "Lab celebration with cake" }
  - { src: lab_3.jpg, alt: "Poster presentation at a conference" }
  - { src: lab_4.jpg, alt: "Presenting a poster to visitors at a conference" }
  - { src: lab_5.jpg, alt: "Lab lunch outdoors with pizza" }
  - { src: lab_6.jpg, alt: "Explaining a poster at a conference" }
dog_photos:
  - { src: dina_1.jpg, alt: "Dina, a black curly-haired dog, sitting on the boardwalk at sunset" }
  - { src: dina_2.jpg, alt: "Dina standing on her hind legs, holding paws with a lab member" }
  - { src: dina_3.jpg, alt: "Dina stretched out between a couch and a bench" }
---

<!-- Names grouped by role, centered, with the lab photo collages beside them
     (photos of each person are on their own page) -->
<div class="team-layout">
  <div class="team">
    {% assign minor_started = false %}
    {% for category in page.display_categories %}
      {% assign members = site.projects | where: 'category', category | sort: 'importance' %}
      {% if members.size > 0 %}
        {% if page.minor_categories contains category %}
          {% unless minor_started %}
            <div class="team-gap" aria-hidden="true"></div>
            {% assign minor_started = true %}
          {% endunless %}
          {% assign minor_class = ' team-minor' %}
        {% else %}
          {% assign minor_class = '' %}
        {% endif %}
        <h2 class="team-category{{ minor_class }}" id="{{ category }}">{{ category }}</h2>
        <ul class="team-list{{ minor_class }}">
          {% for member in members %}
            <li>
              <a href="{% if member.redirect %}{{ member.redirect }}{% else %}{{ member.url | relative_url }}{% endif %}">{{ member.title }}</a>
            </li>
          {% endfor %}
        </ul>
      {% endif %}
    {% endfor %}
  </div>

  <div class="team-photos">
    <div class="lab-collage">
      {% for photo in page.lab_photos %}
        <img src="{{ '/assets/img/lab/' | append: photo.src | relative_url }}" alt="{{ photo.alt }}" loading="lazy">
      {% endfor %}
    </div>

    <figure class="dog-collage">
      {% for photo in page.dog_photos %}
        <img src="{{ '/assets/img/lab/' | append: photo.src | relative_url }}" alt="{{ photo.alt }}" loading="lazy">
      {% endfor %}
      <figcaption>Our official lab dog, Dina!</figcaption>
    </figure>
  </div>
</div>
