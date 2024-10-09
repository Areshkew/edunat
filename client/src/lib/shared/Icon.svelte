<script lang="ts">
  import "@material-design-icons/font/index.css";
  export let size: number;
  export let color: string = "#B66D2F";
  export let icon: string;
  export let title: string = "";
</script>

<span {title} class="material-icons" style="font-size: {size}px; color: {color}">{icon}</span>

<style>
  .material-icons {
    -webkit-user-select: none;
    user-select: none;
    transition: color 0.3s ease;
  }
</style>
