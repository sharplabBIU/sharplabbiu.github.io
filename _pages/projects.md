---
layout: page
title: projects
permalink: /projects/
nav: true
nav_order: 4
---

<!-- Research areas: icon + title, a summary paragraph, then a collage of main-finding figures and related diagrams -->
<div class="research-areas">
  <div class="research-area">
    <div class="research-header">
      <i class="fa-solid fa-hourglass-half research-icon" aria-hidden="true"></i>
      <h2 class="research-title">Delayed Planning</h2>
    </div>
    <p>
      Planning is powerful but costly, so knowing when to plan matters as much as knowing how. We study the meta-control computations that decide
      when to start planning. In two preregistered studies, people learned to defer planning until it was needed, guided by a cognitive map of the
      task rather than by trial and error (<a href="https://osf.io/preprints/psyarxiv/8ubct_v1">Sharp &amp; Eldar</a>). Ongoing work extends this to
      healthy aging and anxiety.
    </p>
    <div class="project-collage">
      <figure class="paper-fig wide">
        <img src="/assets/img/projects/delayed_planning_control.png" alt="Control choices across planning depths compared with the optimal policy" data-zoomable>
        <figcaption>
          People learn to delay planning until it is needed: their control choices follow the optimal pattern across planning depths
          (<a href="https://osf.io/preprints/psyarxiv/8ubct_v1">Sharp &amp; Eldar</a>).
        </figcaption>
      </figure>
      <div class="graphic-tile"><img src="/assets/img/border/decision-tree.svg" alt="Decision tree"></div>
      <div class="graphic-tile"><img src="/assets/img/border/bellman.svg" alt="Bellman equations for state values"></div>
      <figure class="paper-fig wide">
        <img src="/assets/img/projects/nhb_forward_backward.png" alt="Evidence of backward prediction in a divergent environment and forward prediction in a convergent one" data-zoomable>
        <figcaption>
          People favor backward prediction in divergent environments and forward prediction in convergent ones
          (<a href="https://doi.org/10.1038/s41562-024-01930-8">Sharp &amp; Eldar, <em>Nature Human Behaviour</em> 2024</a>).
        </figcaption>
      </figure>
      <div class="graphic-tile"><img src="/assets/img/border/cognitive-map.svg" alt="Cognitive map with a planned route"></div>
    </div>
  </div>

  <div class="research-area">
    <div class="research-header">
      <i class="fa-solid fa-clock-rotate-left research-icon" aria-hidden="true"></i>
      <h2 class="research-title">Offline Learning</h2>
    </div>
    <p>
      We learn quickly from few experiences partly through <a href="https://arxiv.org/pdf/2005.01643">offline learning</a>: using memories and a
      model of the world to simulate actions and outcomes, for example between decisions or during rest. Because it relies on internal models, offline
      learning can also bias how we value actions. We study when it helps, when it misleads, and how it relates to psychopathology.
    </p>
    <div class="project-collage">
      <div class="graphic-tile"><img src="/assets/img/border/dyna.svg" alt="Dyna architecture: acting, direct RL, model learning and planning"></div>
      <div class="graphic-tile"><img src="/assets/img/border/sr-matrix.svg" alt="Successor representation matrix"></div>
      <div class="graphic-tile"><img src="/assets/img/border/q-learning.svg" alt="Q-learning update"></div>
    </div>
  </div>

  <div class="research-area">
    <div class="research-header">
      <i class="fa-solid fa-map-location-dot research-icon" aria-hidden="true"></i>
      <h2 class="research-title">Task Misconstrual in Anxiety</h2>
    </div>
    <p>
      Planning relies on an internal model of the task. We propose that anxiety distorts these models, leading to excessive planning, re-checking of
      decisions already made, and poor generalization (<a href="https://www.sciencedirect.com/science/article/pii/S1364661324002924">Sharp,
      <em>Trends in Cognitive Sciences</em></a>). Recent work links anxiety to biased task generalization (<a
      href="https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051">Schiff &amp; Sharp, <em>Topics in Cognitive Science</em></a>) and worry to
      excessive model-based revaluation.
    </p>
    <div class="project-collage">
      <figure class="paper-fig">
        <img src="/assets/img/projects/topics_worry_undergeneralization.png" alt="Worry score against undergeneralization in threat contexts" data-zoomable>
        <figcaption>
          Higher worry predicts undergeneralizing actions learned under social threat
          (<a href="https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051">Schiff &amp; Sharp, <em>Topics in Cognitive Science</em> 2026</a>).
        </figcaption>
      </figure>
      <div class="graphic-tile"><img src="/assets/img/border/task-representation.svg" alt="Task representation inferred from prior knowledge and instructions"></div>
      <figure class="paper-fig">
        <img src="/assets/img/projects/elife_goal_perseveration.png" alt="Goal perseveration weights for reward and punishment" data-zoomable>
        <figcaption>
          People perseverate on punishment-avoidance goals: goal perseveration is stronger for punishment than for reward
          (<a href="https://doi.org/10.7554/eLife.74402">Sharp et al., <em>eLife</em> 2022</a>).
        </figcaption>
      </figure>
      <div class="graphic-tile"><img src="/assets/img/border/bayes.svg" alt="Bayesian updating from prior to posterior"></div>
    </div>
  </div>
</div>
