---
layout: page
title: news
permalink: /news/
nav: true
nav_order: 2
split: true # boards side by side, in place of the one content box
# Lab news on bulletin boards by theme, each in its own box (with a border of its own colour) that scrolls. Newest first
# on each board. Fields: year; main (the line in bold; linked if url is given); journal (in italics); sub (a second,
# plainer line); impact and acceptance (a journal's impact factor and acceptance rate, shown small; leave either out
# where it is not known)
boards:
  - title: Top publications
    color: "#7fd0ff"
    items:
      - year: 2026
        main: Delaying planning with cognitive maps
        url: https://osf.io/preprints/psyarxiv/8ubct_v1
        journal: Psychological Science (accepted)
        acceptance: 5.9% # Sage Journals, Psychological Science home page; impact factor: not found on the publisher's pages
      - year: 2026
        main: Reinforcement learning and repetitive negative thinking
        url: https://osf.io/preprints/psyarxiv/cu46a_v1
        journal: Clinical Psychological Science (accepted)
        acceptance: 14.3% # Sage Journals, Clinical Psychological Science home page; impact factor: not found on the publisher's pages
      - year: 2026
        main: Anxiety and biased task generalization
        url: https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051
        journal: Topics in Cognitive Science
        impact: 3.3 # Wiley Online Library journal page
        acceptance: 42% # Wiley Online Library journal page
      - year: 2024
        main: Anxiety involves altered planning
        url: https://www.sciencedirect.com/science/article/pii/S1364661324002924
        journal: Trends in Cognitive Sciences
        impact: 20.3 # Cell Press journal page; no acceptance rate published (mostly invited reviews)
      - year: 2024
        main: Forward and backward prediction in planning
        url: https://rdcu.be/dNWDV
        journal: Nature Human Behaviour
        impact: 18.8 # nature.com journal metrics, 2025
        acceptance: 4–6% # the journal's editor, 2022
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
        sub: The lab presented its work
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
      <ul class="board-list">
        {% for item in board.items %}
          <li class="board-item">
            <span class="bi-year">{{ item.year }}</span>
            <div class="bi-body">
              <p class="bi-main">{% if item.url %}<a href="{{ item.url }}" target="_blank" rel="noopener">{{ item.main }}</a>{% else %}{{ item.main }}{% endif %}</p>
              {% if item.journal %}<p class="bi-journal">{{ item.journal }}</p>{% endif %}
              {% if item.sub %}<p class="bi-sub">{{ item.sub }}</p>{% endif %}
              {% if item.impact or item.acceptance %}
                <p class="bi-metrics">
                  {% if item.impact %}<span>Impact factor <b>{{ item.impact }}</b></span>{% endif %}
                  {% if item.acceptance %}<span>Acceptance rate <b>{{ item.acceptance }}</b></span>{% endif %}
                </p>
              {% endif %}
            </div>
          </li>
        {% endfor %}
      </ul>
    </section>
  {% endfor %}
</div>
