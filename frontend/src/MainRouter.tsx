import React, {useEffect, useState} from 'react';
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Link
} from "react-router-dom";

import '@mantine/dates/styles.css';
import "@mantine/core/styles.css";
import '@mantine/charts/styles.css';
import "mantine-datatable/styles.css"
import {AppShell, AppShellNavbar, Burger} from "@mantine/core";
import { useDisclosure } from '@mantine/hooks';
import Navbar from "./components/navbar/Navbar";


const MainRouter = () => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      navbar={{
        width: 220,
        breakpoint: 'sm',
        collapsed: {mobile: !opened}
      }}
      padding={"md"}>

      <AppShell.Header>
        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="sm"
          size="sm"
        />
      </AppShell.Header>

      <AppShellNavbar>
        <Burger
          opened={opened}
          onClick={toggle}
          hiddenFrom="sm"
          size="sm"
        />
          <Navbar/>
      </AppShellNavbar>

      <AppShell.Main>
        <Router>
          <Routes>
            <Route path="/" element={<div>Test</div>}/>
          </Routes>
        </Router>
      </AppShell.Main>
    </AppShell>

  );
}

export default MainRouter;
