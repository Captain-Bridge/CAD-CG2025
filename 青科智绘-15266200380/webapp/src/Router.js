const Index = () =>  import ('./views/Index.vue');

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/index',
    },
    {
      path: '/index',
      name: 'index',
      component: Index
    }
  ],
});

export { router };