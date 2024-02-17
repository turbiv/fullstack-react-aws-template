import React from "react";
import ReactDOM from "react-dom/client";
import {MantineProvider} from "@mantine/core";
import MainRouter from "./MainRouter";
import "./index.css"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme={"dark"}>
      <MainRouter/>
    </MantineProvider>
  </React.StrictMode>
);
