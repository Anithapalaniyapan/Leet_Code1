import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * Tab configuration for the Academic Director Dashboard
 */
export const tabs = [
  {
    id: 0,
    label: "My Profile",
    icon: <PersonIcon />
  },
  {
    id: 1,
    label: "Manage Meetings",
    icon: <EventIcon />
  },
  {
    id: 2,
    label: "Manage Questions",
    icon: <QuestionAnswerIcon />
  },
  {
    id: 3,
    label: "Analytics",
    icon: <BarChartIcon />
  },
  {
    id: 4,
    label: "Reports",
    icon: <DescriptionIcon />
  },
  {
    id: 5,
    label: "View Schedule",
    icon: <VisibilityIcon />
  },
  {
    id: 6,
    label: "Minutes of Meetings",
    icon: <AssignmentIcon />
  }
]; 