import { createBrowserRouter } from "react-router";
import SplashScreen from "./components/SplashScreen";
import ProjectsScreen from "./components/ProjectsScreen";
import EditorScreen from "./components/EditorScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SplashScreen,
  },
  {
    path: "/projects",
    Component: ProjectsScreen,
  },
  {
    path: "/editor/:projectId",
    Component: EditorScreen,
  },
]);
