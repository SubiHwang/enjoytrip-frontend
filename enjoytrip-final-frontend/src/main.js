import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/styles/fonts.css' /* 폰트 import */

import App from "./App.vue";
import router from "./router";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Bootstrap CSS import
import 'bootstrap/dist/css/bootstrap.min.css'

// Bootstrap JS import
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)

app.use(createPinia());
app.use(router);

app.mount("#app");
