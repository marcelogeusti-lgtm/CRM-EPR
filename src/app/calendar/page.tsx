import React from 'react';
import CalendarClient from './calendar-client';
import { getTasks } from '../actions/calendar';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const result = await getTasks();
  const tasks = result.success && result.data ? result.data : [];

  return (
    <CalendarClient initialTasks={tasks} />
  );
}
