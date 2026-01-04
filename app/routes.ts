import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("dashboard/:id", "routes/task-detail.tsx"),
  route("tasks", "routes/tasks.tsx"),
  route("create-task", "routes/create-task.tsx"),
  route("edit-task/:id", "routes/edit-task.$id.tsx"),
  route("settings", "routes/settings.tsx"),
  route("profile/:username", "routes/profile.tsx"),
  route("explore", "routes/explore.tsx"),
] satisfies RouteConfig;
