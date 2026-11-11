---
layout: page
title: news
permalink: /news/
nav: true
nav_order: 2
split: true # boards side by side, in place of the one content box
# Lab news on bulletin boards by theme, each in its own box (with a border of its own colour) that scrolls. Newest first
# on each board. Fields: year; main (the line in bold; linked if url is given); journal (in italics); sub (a second,
# plainer line). A board with latest_only: true shows only its items from its most recent year
boards:
  - title: Top publications
    color: "#7fd0ff"
    items:
      - year: 2026
        main: Delaying planning with cognitive maps
        url: https://osf.io/preprints/psyarxiv/8ubct_v1
        journal: Psychological Science (accepted)
      - year: 2026
        main: Reinforcement learning and repetitive negative thinking
        url: https://osf.io/preprints/psyarxiv/cu46a_v1
        journal: Clinical Psychological Science (accepted)
      - year: 2026
        main: Anxiety and biased task generalization
        url: https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051
        journal: Topics in Cognitive Science
      - year: 2024
        main: Anxiety involves altered planning
        url: https://www.sciencedirect.com/science/article/pii/S1364661324002924
        journal: Trends in Cognitive Sciences
      - year: 2024
        main: Forward and backward prediction in planning
        url: https://rdcu.be/dNWDV
        journal: Nature Human Behaviour
  - title: Awards and grants
    color: "#ffd36e"
    items:
      - year: 2026
        main: Best Poster Award
        sub: Noa Yadid, Computational Psychiatry Conference (Yale)
      - year: 2026
        main: NeuroBridges summer school, fully funded
        sub: Dafna Yavetz, selected to attend (Cluny, France)
      - year: 2025
        main: Research grant (about $1 million)
        sub: The lab, on the computations of efficient and inefficient planning in health and psychopathology
      - year: 2024
        main: Azrieli Faculty Fellowship
        sub: Paul Sharp
  - title: New members
    color: "#5df0a4"
    latest_only: true # only the newest year's members show
    items:
      - year: 2026
        main: Daniel Toledano
        sub: Postdoctoral researcher, from Tel Aviv University
      - year: 2026
        main: Diana Vrubel
        sub: PhD student, from HSE University, Moscow
      - year: 2026
        main: Noam Gil-Adi
        sub: PhD student, from Ben-Gurion University
      - year: 2025
        main: Dafna Yavetz
        sub: MA student, from Princeton University
      - year: 2025
        main: Noa Yadid
        sub: MA student, from Bar-Ilan University
      - year: 2025
        main: Adi Pizanti
        sub: MA student, from the Academic College of Tel Aviv–Jaffa
  - title: Talks and conferences
    color: "#ff9fb0"
    items:
      - year: 2026
        main: Computational Psychiatry Conference, Yale
        sub: Adi Pizanti gave a poster spotlight talk
      - year: 2025
        main: Symposium chair, Computational Psychiatry Conference
        sub: Paul Sharp, on cognitive map biases in psychopathology
---

<!-- _pages/news.md: the lab news, on bulletin boards by theme (page.boards above), side by side in place of the one content
box; each board scrolls on its own -->
<div class="news-boards">
  {% for board in page.boards %}
    <section class="news-board" style="--board: {{ board.color }}" aria-labelledby="board-{{ forloop.index }}">
      <h2 class="section-bar" id="board-{{ forloop.index }}">{{ board.title }}</h2>
      {% assign items = board.items %}
      {% if board.latest_only %}
        {% assign latest = board.items | map: 'year' | sort | last %}
        {% assign items = board.items | where: 'year', latest %}
      {% endif %}
      <ul class="board-list">
        {% for item in items %}
          <li class="board-item">
            <span class="bi-year">{{ item.year }}</span>
            <div class="bi-body">
              <p class="bi-main">{% if item.url %}<a href="{{ item.url }}" target="_blank" rel="noopener">{{ item.main }}</a>{% else %}{{ item.main }}{% endif %}</p>
              {% if item.journal %}<p class="bi-journal">{{ item.journal }}</p>{% endif %}
              {% if item.sub %}<p class="bi-sub">{{ item.sub }}</p>{% endif %}
            </div>
          </li>
        {% endfor %}
      </ul>
    </section>
  {% endfor %}
</div>
