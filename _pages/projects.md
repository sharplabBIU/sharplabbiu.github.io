---
layout: page
title: projects
permalink: /projects/
nav: true
nav_order: 4
---

<!-- Research areas: a diagram + equation beside the title and summary, then key figures from the papers below,
     each in an identical rectangular frame -->
<div class="research-areas">
  <div class="research-area content-card" id="planning-efficiency">
    <div class="research-intro">
      <div class="research-diagram">
        <img src="/assets/img/diagrams/planning-efficiency.svg" alt="Decision tree with the planned route to the goal and the Bellman optimality equation">
      </div>
      <div class="research-text">
        <h2 class="research-title">Planning Efficiency</h2>
        <p>
          Planning is powerful but costly, so efficient decision makers must decide when and how to plan. One route is timing: in two
          preregistered studies, people learned to defer planning until it was needed, guided by a cognitive map of the task rather than by trial
          and error (<a href="https://osf.io/preprints/psyarxiv/8ubct_v1">Sharp &amp; Eldar</a>). Another route is direction: people adaptively
          plan forward from where they are or backward from their goals, choosing whichever predictive representation is more efficient in a given
          environment (<a href="https://doi.org/10.1038/s41562-024-01930-8">Sharp &amp; Eldar, <em>Nature Human Behaviour</em></a>). Ongoing work
          extends this to healthy aging and anxiety.
        </p>
      </div>
    </div>
    <div class="project-figures">
      <figure class="paper-fig">
        <div class="fig-frame">
          <img src="/assets/img/projects/planning_delayed.png" alt="Optimal and observed control choices across planning depths" data-zoomable>
        </div>
        <figcaption>
          People learn to delay planning until it is needed: their control choices (right) follow the optimal pattern (left) across planning
          depths (<a href="https://osf.io/preprints/psyarxiv/8ubct_v1">Sharp &amp; Eldar</a>).
        </figcaption>
      </figure>
      <figure class="paper-fig">
        <div class="fig-frame">
          <img src="/assets/img/projects/planning_forward_backward.png" alt="Evidence of backward prediction in a divergent environment and forward prediction in a convergent one" data-zoomable>
        </div>
        <figcaption>
          People favor backward prediction in divergent environments (top) and forward prediction in convergent ones (bottom)
          (<a href="https://doi.org/10.1038/s41562-024-01930-8">Sharp &amp; Eldar, <em>Nature Human Behaviour</em> 2024</a>).
        </figcaption>
      </figure>
    </div>
  </div>

  <div class="research-area content-card" id="offline-learning">
    <div class="research-intro">
      <div class="research-diagram">
        <img src="/assets/img/diagrams/offline-learning.svg" alt="Dyna architecture with the planning update from simulated experience">
      </div>
      <div class="research-text">
        <h2 class="research-title">Offline Learning</h2>
        <p>
          We learn quickly from few experiences partly through <a href="https://arxiv.org/pdf/2005.01643">offline learning</a>: using memories and
          a model of the world to simulate actions and outcomes, for example between decisions or during rest. In work in progress presented at the
          2026 Computational Psychiatry Conference (Best Poster Award), we asked how the few seconds between choices shape learning. Rather than
          consolidating what was just learned, longer inter-trial intervals made people more likely to abandon an option that had just paid off,
          across four studies including two preregistered replications, as if the wait were a cost charged to that choice (Yadid, Linkovski &amp;
          Sharp, in preparation).
        </p>
      </div>
    </div>
    <div class="project-figures">
      <figure class="paper-fig">
        <div class="fig-frame">
          <img src="/assets/img/projects/offline_iti_effect.png" alt="Probability of switching after a 1 s or 4 s inter-trial interval, after a win and after a loss, in two studies" data-zoomable>
        </div>
        <figcaption>
          After a win, people switch more often following a 4 s than a 1 s inter-trial interval, in Study 1 (left, n = 96) and the preregistered
          replication (right, n = 439) (Yadid, Linkovski &amp; Sharp, in preparation).
        </figcaption>
      </figure>
      <figure class="paper-fig">
        <div class="fig-frame">
          <img src="/assets/img/projects/offline_iti_generalization.png" alt="Switching by the interval before the choice in an independent dataset" data-zoomable>
        </div>
        <figcaption>
          The effect generalizes to an independent dataset with jittered intervals (Tomov et al., 2020): switching rises with the interval before
          the choice (Yadid, Linkovski &amp; Sharp, in preparation).
        </figcaption>
      </figure>
    </div>
  </div>

  <div class="research-area content-card" id="task-misconstrual">
    <div class="research-intro">
      <div class="research-diagram">
        <img src="/assets/img/diagrams/task-representation.svg" alt="Task representation inferred from prior knowledge and task instructions">
      </div>
      <div class="research-text">
        <h2 class="research-title">Task (Mis)construal</h2>
        <p>
          Planning relies on an internal model, or construal, of the task. We propose that anxiety distorts these construals, leading to excessive
          planning, re-checking of decisions already made, and poor generalization
          (<a href="https://www.sciencedirect.com/science/article/pii/S1364661324002924">Sharp, <em>Trends in Cognitive Sciences</em></a>). Recent
          work shows that worry predicts undergeneralizing actions learned under threat
          (<a href="https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051">Schiff &amp; Sharp, <em>Topics in Cognitive Science</em></a>), that
          people keep pursuing punishment-avoidance goals the task no longer requires (<a href="https://doi.org/10.7554/eLife.74402">Sharp et al.,
          <em>eLife</em></a>), and that worry is linked to excessive model-based revaluation.
        </p>
      </div>
    </div>
    <div class="project-figures">
      <figure class="paper-fig">
        <div class="fig-frame">
          <img src="/assets/img/projects/topics_worry_undergeneralization.png" alt="Worry score against undergeneralization in threat contexts" data-zoomable>
        </div>
        <figcaption>
          Higher worry predicts undergeneralizing actions learned under social threat
          (<a href="https://onlinelibrary.wiley.com/doi/full/10.1111/tops.70051">Schiff &amp; Sharp, <em>Topics in Cognitive Science</em> 2026</a>).
        </figcaption>
      </figure>
      <figure class="paper-fig">
        <div class="fig-frame">
          <img src="/assets/img/projects/elife_goal_perseveration.png" alt="Goal perseveration weights for reward and punishment" data-zoomable>
        </div>
        <figcaption>
          People perseverate on punishment-avoidance goals: goal perseveration is stronger for punishment than for reward
          (<a href="https://doi.org/10.7554/eLife.74402">Sharp et al., <em>eLife</em> 2022</a>).
        </figcaption>
      </figure>
    </div>
  </div>
</div>
