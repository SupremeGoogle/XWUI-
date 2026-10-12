/** Admin copy, seed records and mock rules. */
export const adminHealthData = {
  health: {
    recoveredLog:
      'storage    responding\nscheduler  heartbeat received\nworkers    admission state checked\nqueue      draining',
    title: 'Health',
    headline: '{attention} of {total} checks need attention',
    healthy: 'All {total} checks are answering',
    description:
      'Storage has not answered for 3 minutes. Runs that need stored data fail with "storage unavailable". Check the storage service first, then press Check again.',
    recovered: 'All checks respond. The sample storage service has recovered.',
    check: 'Check again',
    checked: 'System checks refreshed.',
    topology: {
      title: 'Topology',
      hint: 'live',
      storageLabel: 'Storage',
      schedulerLabel: 'Scheduler',
      tiles: [
        { label: 'API', tone: 'cyan', x: 60, y: 127, z: 40 },
        { label: 'Workers', tone: 'green', x: 220, y: 37, z: 40 },
        { label: 'Scheduler', tone: 'amber', x: 220, y: 217, z: 40 },
        {
          label: 'Storage',
          tone: 'red',
          x: 380,
          y: 127,
          z: 40,
          attention: true,
        },
      ],
    },
    uptimeTitle: 'Last 30 days',
    legend: [
      { label: 'Normal', variant: 'success' },
      { label: 'Degraded', variant: 'warning' },
      { label: 'Down', variant: 'error' },
    ],
    log: '12:05:02  storage    no answer, attempt 6\n12:04:41  scheduler  heartbeat late: 94 s\n12:02:09  storage    last good answer\n11:58:40  worker-3   heartbeat ok',
    actions: {
      pause: 'Pause all schedules',
      paused: 'Schedules paused',
      drain: 'Drain a worker',
      drained: 'Worker drained',
      hint: 'Both ask for a confirmation that names what will stop.',
      pauseTitle: 'Pause all schedules?',
      pauseBody:
        'All active schedules in Personal workspace will stop creating runs. Runs already in flight will continue.',
      drainTitle: 'Drain worker-3?',
      drainBody:
        'worker-3 will stop accepting new runs. Its current runs will finish before it is drained.',
      pauseSuccess: 'All schedules paused.',
      drainSuccess: 'worker-3 drained.',
      worker: 'worker-3',
    },
  },
  healthSeed: {
    id: 'system',
    checkCount: 0,
    checkedAt: null,
    schedulesPaused: false,
    drainedWorkers: [],
    checks: [
      {
        id: 'storage',
        title: 'Storage seam',
        age: '8 s ago',
        variant: 'error',
        tone: 'red',
        status: 'Unreachable',
        description: 'No answer for 3 minutes. Last good answer 12:02.',
      },
      {
        id: 'scheduler',
        title: 'Scheduler',
        age: '5 s ago',
        variant: 'warning',
        tone: 'amber',
        status: 'Late heartbeat',
        description: 'Last heartbeat 94 s ago. Due schedules may start late.',
      },
      {
        id: 'api',
        title: 'API',
        age: '8 s ago',
        variant: 'success',
        tone: 'cyan',
        status: 'Answering',
        description: '/xwflow/v1 responds.',
      },
      {
        id: 'workers',
        title: 'Workers',
        age: '8 s ago',
        variant: 'success',
        tone: 'green',
        status: 'All heartbeating',
        description: '4 of 4 workers, 2 runs in flight.',
      },
      {
        id: 'queue',
        title: 'Queue',
        age: '8 s ago',
        variant: 'success',
        tone: 'violet',
        status: 'Draining',
        description: '12 waiting, oldest 3 s.',
      },
      {
        id: 'updates',
        title: 'Live updates',
        age: '8 s ago',
        variant: 'success',
        tone: 'pink',
        status: 'Connected',
        description: 'WebSocket producer, 3 subscribers.',
      },
    ],
    uptime: [
      {
        label: 'API',
        days: Array.from({ length: 30 }, (_, i) =>
          i === 16 ? 'warning' : 'success',
        ),
      },
      {
        label: 'Scheduler',
        days: Array.from({ length: 30 }, (_, i) =>
          i > 27 ? 'warning' : 'success',
        ),
      },
      {
        label: 'Storage',
        days: Array.from({ length: 30 }, (_, i) =>
          i === 29 ? 'error' : 'success',
        ),
      },
    ],
  },
  healthResults: {
    age: 'just now',
    storage: {
      status: 'Answering',
      description: 'Storage responds. Stored-data runs can resume.',
      variant: 'success',
      tone: 'green',
    },
    scheduler: {
      status: 'On time',
      description: 'Heartbeat received. Due schedules start on time.',
      variant: 'success',
      tone: 'green',
    },
    pausedScheduler: {
      status: 'Paused',
      description: 'All schedules are paused by an operator.',
      variant: 'neutral',
      tone: 'violet',
    },
    drainedWorkers: {
      status: '3 accepting runs',
      description: 'worker-3 drained; the other 3 workers are accepting runs.',
    },
  },

};
