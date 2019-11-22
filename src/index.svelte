<script context="module">
  // Stuff here runs once even if component is invoked many times.
</script>

<script>
  import { onMount } from "svelte";

  export let onMouseMove = function(args) {
    console.log(...args);
  };
  onMount(function handleMount() {
    let a = window.addEventListener("mousemove", onMouseMove);
    return function handleUnmount() {
      window.addEventListener(a);
    };
  });
</script>

<svelte:options tag="googly-eyes" />

<svg
  version="1.1"
  id="Layer_1"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  x="0px"
  y="0px"
  width="95.253px"
  height="95.253px"
  viewBox="0 0 95.253 95.253"
  enable-background="new 0 0 95.253 95.253"
  xml:space="preserve">
  <circle
    fill="#FFFFFF"
    stroke="#000000"
    stroke-miterlimit="10"
    cx="47.626"
    cy="47.626"
    r="47.126" />
  <circle cx="29.235" cy="36.132" r="18.391" />
</svg>
