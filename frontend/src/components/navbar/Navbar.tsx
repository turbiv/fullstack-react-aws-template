import { Group, Code, ScrollArea } from '@mantine/core';
import {
  IconNotes,
  IconCalendarStats,
  IconGauge,
  IconPresentationAnalytics,
  IconFileAnalytics,
  IconAdjustments,
  IconLock,
  IconMap
} from '@tabler/icons-react';
import NavbarLinksGroup from './NavbarLinksGroup';
import classes from './Navbar.module.css';

const mockdata = [
  { label: 'Map overview', icon: IconMap, link: "/" },
  {
    label: 'Housing List',
    icon: IconNotes,
    link: "/list"
    /*initiallyOpened: true,
    links: [
      { label: 'Testing 1', link: '/' },
      { label: 'Testing 2', link: '/' },
      { label: 'Testing 3', link: '/' },
      { label: 'Testing 4', link: '/' },
    ],*/
  },
  { label: 'Analytics', icon: IconPresentationAnalytics, link: "/analytics" },
];

const Navbar = () => {
  const links = mockdata.map((item) => <NavbarLinksGroup {...item} key={item.label} />);

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Group justify="space-between">
          <Code fw={700}>v1.0.0</Code>
        </Group>
      </div>

      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>
    </nav>
  );
}

export default Navbar;