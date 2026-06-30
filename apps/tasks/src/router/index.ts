import { createRouter, createWebHistory } from 'vue-router'
import ProjectListView from '@/views/ProjectListView.vue'
import ProjectDetailView from '@/views/ProjectDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/projects', name: 'projects', component: ProjectListView },
    {
      path: '/projects/:projectID',
      name: 'project-detail',
      component: ProjectDetailView,
      children: [
        {
          path: 'tasks/:taskID',
          name: 'task-detail',
          component: () => import('@/components/tasks/TaskDetailSheet.vue'),
        },
      ],
    },
  ],
})

export default router
