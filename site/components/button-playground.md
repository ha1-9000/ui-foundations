---
layout: layouts/docs.njk
title: Button Playground
description: Interaktives Vanilla-Beispiel mit Live-Props fuer den Button.
navTitle: Button Playground
order: 20
permalink: /components/button-playground/
templateEngineOverride: njk
playground:
  id: button-playground
  queryPrefix: button
  runtime: vanilla
  renderer: button
  controls:
    - kind: text
      name: label
      label: Label
      default: Book now
      source: children
    - kind: select
      name: variant
      label: Variant
      query: true
      default: solid
      options:
        - solid
        - outline
        - ghost
    - kind: select
      name: state
      label: State
      default: default
      source: meta
      options:
        - default
        - hover
        - active
        - focus
        - disabled
    - kind: select
      name: type
      label: Type
      default: button
      options:
        - button
        - submit
        - reset
---

{% from "macros/playground.njk" import playground as uiPlayground %}

{{ uiPlayground(playground) }}
