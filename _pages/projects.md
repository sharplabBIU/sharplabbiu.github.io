---
layout: page
title: projects
permalink: /projects/
nav: true
nav_order: 4
---

<!-- Research areas: icon + title, a summary paragraph, then a collage: one key figure from each relevant paper first,
     followed by a single small combined diagram and equation, in one row -->
<div class="research-areas">
  <div class="research-area">
    <div class="research-header">
      <i class="fa-solid fa-gauge-high research-icon" aria-hidden="true"></i>
      <h2 class="research-title">Planning Efficiency</h2>
    </div>
    <p>
      Planning is powerful but costly, so efficient decision makers must decide when and how to plan. One route is timing: in two preregistered
      studies, people learned to defer planning until it was needed, guided by a cognitive map of the task rather than by trial and error
      (<a href="https://osf.io/preprints/psyarxiv/8ubct_v1">Sharp &amp; Eldar</a>). Another route is direction: people adaptively plan forward from
      where they are or backward from their goals, choosing whichever predictive representation is more efficient in a given environment
      (<a href="https://doi.org/10.1038/s41562-024-01930-8">Sharp &amp; Eldar, <em>Nature Human Behaviour</em></a>). Ongoing work extends this to
      healthy aging and anxiety.
    </p>
    <div class="project-collage">
      <figure class="paper-fig" style="--ar: 3.51; max-width: 1071px">
        <img src="/assets/img/projects/delayed_planning_control.png" alt="Control choices across planning depths compared with the optimal policy" data-zoomable>
        <figcaption>
          People learn to delay planning until it is needed: their control choices follow the optimal pattern across planning depths
          (<a href="https://osf.io/preprints/psyarxiv/8ubct_v1">Sharp &amp; Eldar</a>).
        </figcaption>
      </figure>
      <figure class="paper-fig" style="--ar: 4.98; max-width: 1512px">
        <img src="/assets/img/projects/nhb_forward_backward.png" alt="Evidence of backward prediction in a divergent environment and forward prediction in a convergent one" data-zoomable>
        <figcaption>
          People favor backward prediction in divergent environments and forward prediction in convergent ones
          (<a href="https://doi.org/10.1038/s41562-024-01930-8">Sharp &amp; Eldar, <em>Nature Human Behaviour</em> 2024</a>).
        </figcaption>
      </figure>
      <div class="graphic-tile">
        <img src="/assets/img/diagrams/planning-efficiency.svg" alt="Decision tree with the planned route to the goal and the Bellman optimality equation">
      </div>
    </div>
  </div>

  <div class="research-area">
    <div class="research-header">
      <i class="fa-solid fa-clock-rotate-left research-icon" aria-hidden="true"></i>
      <h2 class="research-title">Offline Learning</h2>
    </div>
    <p>
      We learn quickly from few experiences partly through <a href="https://arxiv.org/pdf/2005.01643">offline learning</a>: using memories and a
      model of the world to simulate actions and outcomes, for example between decisions or during rest. In work in progress presented at the 2026
      Computational Psychiatry Conference (Best Poster Award), we asked how the few seconds between choices shape learning. Rather than consolidating
      what was just learned, longer inter-trial intervals made people more likely to abandon an option that had just paid off, across four studies
      including two preregistered replications, as if the wait were a cost charged to that choice (Yadid, Linkovski &amp; Sharp, in preparation).
    </p>
    <div class="project-collage">
      <figure class="paper-fig" style="--ar: 0.78; max-width: 252px">
        <img src="/assets/img/projects/iti_switching.png" alt="Probability of switching after a 1 s or 4 s inter-trial interval, after a win and after a loss" data-zoomable>
        <figcaption>
          After a win, people switch more often following a 4 s than a 1 s inter-trial interval (preregistered study, n = 439; Yadid, Linkovski
          &amp; Sharp, in preparation).
        </figcaption>
      </figure>
      <div class="graphic-tile">
        <img src="/assets/img/diagrams/offline-learning.svg" alt="Dyna architecture with the planning update from simulated experience">
      </div>
    </div>
  </div>

  <div class="research-area">
    <div class="research-header">
      <i class="fa-solid fa-map-location-dot research-icon" aria-hidden="true"></i>
      <h2 class="research-title">Task Construal in Anxiety</h2>
    </div>
    <p>
      Planning relies on an internal model, or construal, of the task. We propose that anxiety distorts these construals, leading to excessive
      planning, re-checking of decisions already made, and poor generalization
      (<a href="https://www.sciencedirect.com/science/article/pii/S1364661324002924">Sharp, <em>Trends in Cognitive Sciences</em></a>). Recent work
      shows that worry predicts undergeneralizing actions learned under threat
      (<a href="https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051">Schiff &amp; Sharp, <em>Topics in Cognitive Science</em></a>), that people
      keep pursuing punishment-avoidance goals the task no longer requires (<a href="https://doi.org/10.7554/eLife.74402">Sharp et al.,
      <em>eLife</em></a>), and that worry is linked to excessive model-based revaluation.
    </p>
    <div class="project-collage">
      <figure class="paper-fig" style="--ar: 1.74; max-width: 540px">
        <img src="/assets/img/projects/topics_worry_undergeneralization.png" alt="Worry score against undergeneralization in threat contexts" data-zoomable>
        <figcaption>
          Higher worry predicts undergeneralizing actions learned under social threat
          (<a href="https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051">Schiff &amp; Sharp, <em>Topics in Cognitive Science</em> 2026</a>).
        </figcaption>
      </figure>
      <figure class="paper-fig" style="--ar: 1.55; max-width: 483px">
        <img src="/assets/img/projects/elife_goal_perseveration.png" alt="Goal perseveration weights for reward and punishment" data-zoomable>
        <figcaption>
          People perseverate on punishment-avoidance goals: goal perseveration is stronger for punishment than for reward
          (<a href="https://doi.org/10.7554/eLife.74402">Sharp et al., <em>eLife</em> 2022</a>).
        </figcaption>
      </figure>
      <div class="graphic-tile">
        <img src="/assets/img/diagrams/task-representation.svg" alt="Task representation inferred from prior knowledge and task instructions">
      </div>
    </div>
  </div>
</div>
