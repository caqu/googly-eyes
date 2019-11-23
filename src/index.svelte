<script>
  import { onMount } from "svelte";

  let pupil_x = 36;
  const pupil_x_min = 20;
  const pupil_x_max = 70;
  const pupil_x_delta = pupil_x_max - pupil_x_min;
  let pupil_y = 36;
  const pupil_y_min = 20;
  const pupil_y_max = 70;
  const pupil_y_delta = pupil_x_max - pupil_x_min;

  export let onTouchMove = function(event) {
    // Iterate through the list of touch points that changed
    // since the last event and print each touch point's identifier.
    // for (var i = 0; i < event.changedTouches.length; i++) {
    //   console.log(
    //     "changedTouches[" +
    //       i +
    //       "].identifier = " +
    //       event.changedTouches[i].clientX
    //   );
    // }
    set_pupil(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
  };
  export let onMouseMove = function(event) {
    set_pupil(event.clientX, event.clientY);
  };
  function set_pupil(x, y) {
    pupil_x = pupil_x_min + (x / window.innerWidth) * pupil_x_delta;
    pupil_y = pupil_y_min + (y / window.innerHeight) * pupil_y_delta;
  }
  onMount(function handleMount() {
    let a = window.addEventListener("touchmove", onTouchMove);
    let b = window.addEventListener("mousemove", onMouseMove);
    return function handleUnmount() {
      window.addEventListener(a);
      window.addEventListener(b);
    };
  });
</script>

<!-- <script context="module"> -->
  <!-- // Stuff here runs once even if component is invoked many times. -->
<!-- </script> -->
<!-- This work fine even linter shows an error. -->
<svelte:options tag="googly-eyes" />
<!-- <svelte:options tag={null} /> -->

<svg
  version="1.1"
  id="Layer_1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  x="0px"
  y="0px"
  width="96px"
  height="96px"
  viewBox="0 0 96 96"
  enable-background="new 0 0 96 96"
  xml:space="preserve">
  <mask id="myMask">
    <circle fill="white" cx="48" cy="48" r="46" />
  </mask>
  <circle
    fill="#FFFF80"
    stroke="#000000"
    stroke-miterlimit="10"
    cx="48"
    cy="48"
    r="46" />
  <circle cx={pupil_x} cy={pupil_y} r="24" mask="url(#myMask)" />
</svg>
