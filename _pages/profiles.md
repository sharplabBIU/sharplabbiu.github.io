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

<!-- Names grouped by role: each core lab member with a small photo and their bio beside it (the photo in the bio itself
     is hidden here); collaborators and alumni as a list. The lab photos are a thin album on the far right -->
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
  </div>

  <!-- Photo album: a vertical strip that scrolls a photo at a time, or flips with the arrows -->
  <div class="team-album" role="region" aria-label="Lab photo album">
    <button type="button" class="album-btn album-prev" aria-label="Previous photo">&#9650;</button>
    <div class="album-strip" tabindex="0">
      {% for photo in page.lab_photos %}
        <figure class="album-item">
          <img src="{{ '/assets/img/lab/' | append: photo.src | relative_url }}" alt="{{ photo.alt }}" loading="lazy">
        </figure>
      {% endfor %}
      {% for photo in page.dog_photos %}
        <figure class="album-item">
          <img src="{{ '/assets/img/lab/' | append: photo.src | relative_url }}" alt="{{ photo.alt }}" loading="lazy">
          <figcaption>Our official lab dog, Dina!</figcaption>
        </figure>
      {% endfor %}
    </div>
    <button type="button" class="album-btn album-next" aria-label="Next photo">&#9660;</button>
  </div>
</div>

<script src="{{ '/assets/js/team-album.js' | relative_url | bust_file_cache }}" defer></script>
