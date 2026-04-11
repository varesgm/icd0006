// src/stores/counter.ts
import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useApiKeyStore = defineStore("apikey", () => {
  // ref() → state
  const apikey = ref<string>("");

  const setApiKey = (key: string): boolean => {
    if (isLoggedIn()) {
      console.log("Already logged in");
      return false;
    }
    if (key.length < 10) {
      console.log("API key is too short");
      return false;
    }
    if (key === "") {
      console.log("API key cannot be empty");
      return false;
    }
    console.log("Logged in with API key: " + key);
    apikey.value = key;
    localStorage.setItem("apikey", key);
    return true;
  }


  const getApiKey = () => {
    if (apikey.value === "") {
      const storedKey = localStorage.getItem("apikey");
      if (storedKey) {
        apikey.value = storedKey;
      }
    }
    return apikey.value;
  }

  const isLoggedIn = () => {
    if (apikey.value === "") {
      const storedKey = localStorage.getItem("apikey");
      if (storedKey) {
        apikey.value = storedKey;
      }
    }
    return apikey.value !== "";
  };

  const clearApiKey = () => {
    console.log("Logged out");
    apikey.value = "";
    localStorage.removeItem("apikey");
  }

  return { setApiKey, getApiKey, isLoggedIn, clearApiKey };
});