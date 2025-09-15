<template>
  <footer class="app-footer">
    <div class="footer-content">
      <a href="https://github.com/ytomo/vial-keyboard-image" target="_blank" class="github-link">
        GitHub
      </a>
      <span class="copyright">© 2025 Vial Keyboard Image Generator</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.app-footer {
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  margin-top: auto;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media (max-width: 768px) {
      padding: 8px 15px;
    }
  }

  .github-link {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;

    &:hover {
      text-decoration: underline;
    }
  }

  .copyright {
    color: #6c757d;
    font-size: 14px;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
}
</style>