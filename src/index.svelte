<script>
  import { onMount } from "svelte";

  export let x = 0.5;
  export let y = 0.5;
  export let width = 96;
  export let height = 96;

  const margin = 20;
  const pupil_x_min = margin;
  const pupil_x_max = width - margin;
  const pupil_y_min = margin;
  const pupil_y_max = height - margin;
  const pupil_x_delta = pupil_x_max - pupil_x_min;
  const pupil_y_delta = pupil_y_max - pupil_y_min;

  $: pupil_x = pupil_x_min + x * pupil_x_delta;
  $: pupil_y = pupil_y_min + y * pupil_y_delta;
</script>

<!-- This work fine even linter shows an error. -->
<svelte:options tag="googly-eyes" />
<svg
  version="1.1"
  id="Layer_1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  x="0px"
  y="0px"
  width="{width}px"
  height="{height}px"
  viewBox="0 0 96 96"
  enable-background="new 0 0 96 96"
  xml:space="preserve">
  <mask id="myMask">
    <circle fill="white" cx="48" cy="48" r="46" />
  </mask>
  <circle
    class="ball"
    fill="#FFFFFF"
    stroke="#000000"
    stroke-miterlimit="10"
    cx="48"
    cy="48"
    r="46" />
  <circle
    class="iris"
    fill="#487908"
    cx={pupil_x}
    cy={pupil_y}
    r="28"
    mask="url(#myMask)" />
  <circle
    class="pupil"
    fill="#000000"
    cx={pupil_x}
    cy={pupil_y}
    r="24"
    mask="url(#myMask)" />
</svg>
