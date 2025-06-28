import { router } from './Router';
import ElementUI from '../nodeApp/static/lib/vuejs/element-ui'

Vue.use(VueRouter);
Vue.use(ElementUI);

new Vue({
  el: '#app',
  router,
});