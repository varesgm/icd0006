<script setup lang="ts">
  import { useApiKeyStore } from '../stores/apikey-store.ts';
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  const router = useRouter();
  const apiKeyStore = useApiKeyStore();
  const apiKey = ref("2ebb01df-3c67-4157-8baf-9ef91234d66c");
  const message = ref("");

  function login() {
    const result = apiKeyStore.setApiKey(apiKey.value);
    if (result) {
      router.push({name: 'Main' });
    } else {
      message.value = "Invalid API Key";
    }
  }

  onMounted(() => {
    console.log("LoginView mounted");
    if (apiKeyStore.isLoggedIn()) {
      router.push({name: 'Main' });
    }
  });

</script>

<template>
  <div class="text-center">
    <div v-if="message" class="alert alert-danger" role="alert">
      {{ message }}
    </div>
    <main class="form-signin">
      <form @submit.prevent="login">
        <h1 class="h3 mb-3 fw-normal">Please sign in</h1>
      <div class="form-floating">
        <input type="text" class="form-control" id="floatingInput" placeholder="guid" value="2ebb01df-3c67-4157-8baf-9ef91234d66c" 
        v-model="apiKey">
        <label for="floatingInput">API Key</label>
      </div>
      <br>
      <button class="w-100 btn btn-lg btn-primary" type="submit">Sign in</button>
      </form>
    </main>
  </div>
</template>

<style scoped>

body {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
  -ms-flex-align: center;
  -ms-flex-pack: center;
  -webkit-box-align: center;
  align-items: center;
  -webkit-box-pack: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
}

.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: 0 auto;
}
.form-signin .form-control {
  position: relative;
  box-sizing: border-box;
  height: auto;
  padding: 10px;
  font-size: 16px;
}
.form-signin .form-control:focus {
  z-index: 2;
}
.form-signin input[type="text"] {
  margin-bottom: -1px;
}
</style>
