---
layout: page
title: optimally-delayed planning
img: assets/img/3step_task.png
importance: 1
category: work
---

## Study synopsis

The purpose of the following study was to design a cognitive task with optimal starting points for planning in order to model how we infer when to initiate planning. In the task, participants learned the cognitive map displayed below by randomly starting at a specific image (e.g., car) and being instructed to take a specific action (left or right). This action deterministically transitioned them to a subsequent image, reflected in the black arrows. Participants learned these 1-step transitions and were quizzed on them. They were told they could then use this knowledge to plan and win money in a later phase of the task. Note, all variations of this experiment presented here are pilot studies (Study 1 with time pressure n=14; Study 2 without time pressure n=16; Study 3 n=10).

![im1]({{ '/assets/img/4steptask.png' | prepend: site.baseurl }} "4stepTask")

## Planning depth determines when to start planning

Participants were told that they would always start by deciding between the images at the top of the map -- here the trident or the planet. Their decision was based on an instructed reward they could plan for. For example, they could be told 400 points is hiding behind the image of the snorkel, and they can plan to get to the snorkel from the very first decision. As you see below, if the reward is at the snorkel, they NEED to start planning from their 1st of 4 decisions, because if they don't choose the planet, they cannot arrive at the snorkel. Therefore, the snorkel has a planning depth of 4, requiring all 4 decisions to be planned out starting from the very first decision. When participants took an action, they arrived at a new image determined by the map structure, and could continue executing a plan or initiating a new plan.

![im2]({{ '/assets/img/snorkel.png' | prepend: site.baseurl }} "snorkel")

Each goal had a different planning depth, such as the tophat which had a planning depth of 2 and only required planning to begin at the 3rd decision.

![im2]({{ '/assets/img/tophat.png' | prepend: site.baseurl }} "tophat")

## How we incentivized delayed planning

For each of the 4 decisions participants faced during a planning trial, they were given the option to have the computer randomly choose their action for them, which would gift them 100 points. Thus, if they didn't need to plan at a given stage, they could give up control and win points for doing so. The predicted pattern for giving up control optimally, which is based on when you need to initiate planning, is depicted below. As an example, if the planning depth is 3, you should give up control at the very first decision because you only need to plan at the second decision. **Importantly** because we thought it may take participants a number of trials with a given goal to infer when to initiate planning, we had participants plan for each goal 20 separate times. Goals were instructed in random order.

![im2]({{ '/assets/img/perfect_4step.png' | prepend: site.baseurl }} "perfect_4step")

## Failure to delay planning under time pressure

Remarkably, when participants were under time pressure, which in our task meant that the longer the took the less points they could get, they failed to delay planning when they should.

![im2]({{ '/assets/img/failure_timepressure.png' | prepend: site.baseurl }} "failure_timepressure")

## Worriers fail to plan under time pressure

Perhaps even more interesting, for subjects the reported they worried frequently, they failed to plan successfully at all under these stressful conditions. Here we measured if participants arrived at the instructed goal.

![im2]({{ '/assets/img/worriers_fail.png' | prepend: site.baseurl }} "worriers_fail")

## Humans infer when to start planning

When we removed time pressure, we saw individuals in general successfully inferred when to initiate planning.

![im2]({{ '/assets/img/success_4step.png' | prepend: site.baseurl }} "success_4step")

## Replicating and extending our finding

We found that participants who failed to delay planning when they should, however, did so because they had a more difficult time planning in general. Specifically, they couldn't recall all the different routes of the cognitive map. We thus created a simpler 3-decision task where we ensured all participants knew how to plan every route throughout the map. Here's a picture of the new map they had to learn below. Note we didn't have them plan for the houses, as it had the same planning depth as microphone.

![im2]({{ '/assets/img/3step_task.png' | prepend: site.baseurl }} "3step_task")

## Again they infer when to start planning

Again participants inferred when to initiate planning. Below you see the average behavior, which resembles closely predictions for when subjects should intiation planning.

![im2]({{ '/assets/img/success_3step.png' | prepend: site.baseurl }} "success_3step")

## Inference to intiate planning is _rapid_

We inspected how particiapnts delayed control for each goal over time, since they had 20 opportunities to plan for each possible goal. Note, for most particiapnts, their decision to initiate planning at a given timepoint does not change that much over these 20 trials. This suggests humans can **rapidly** infer when to initiate planning. What you see below is every subject that successfully delayed planning (60% of subjects) performance on the task as a function of both the goal depth, and time (number of trials).

![im2]({{ '/assets/img/optimal_delay_subject_goal_time_delay.png' | prepend: site.baseurl }} "optimal_delay_subject_goal_time_delay")

## Delayed control = delayed planning

When participants gave up control at certain early decisions, it remains a question as to whether they **actually delay their planning**. To rule this out, we need evidence that participants indeed had spent more time at the decision point where they had to initiate planning, since planning takes time! To estimate whether this occurred, we modelled participants' reaction time as a function of several causes of more or less reaction time. Specifically, we used a hierarchical Bayesian regression to explain RT as a function of the following variables. Note below, variable 1 test our main hypothesis that subjects in fact delayed planning:

1. Optimally delayed planning (Initiate planning optimally if there’s behavioral evidence they also gave up control at that time).
2. Trial number (people got faster over time, suggesting some form of learning)
3. Depth of planning for each goal (this ended up not being predictive)
4. Decision point (more time for first decision)
5. Goal-switch (more time when switching to a new goal)
6. Later trials requiring planning (excluding optimal starting points)

As you can see, Variable 1 was highly significant in the predicted direction. The timepoint at which individuals should start planning did indeed have greater reaction time than all other timepoints.

![im2]({{ '/assets/img/RT_3step.png' | prepend: site.baseurl }} "RT_3step")

## Chronic worry is associated with impaired inference to delay planning

A motivating clinical hypothesis that we investigated is whether individuals that worry frequently plan too much. Intuitively we know such individuals are constantly planning how to avoid dangerous futures even when it isn't helpful to do so, given how exhausting planning can be. We show here the first experimental evidence that chronic worry is associated with over-planning (specifically, a failure to optimally delaying planning). We created a continuous score, shown on the y-axis of the graph below, which quantifies the degree to which participants delayed control when they should and engaged control when they should. The correlation (_r_ = -0.63) replicates a correlation we found above in the more complicated 4-decision task.

![im2]({{ '/assets/img/worry_correlation.png' | prepend: site.baseurl }} "worry_correlation")
