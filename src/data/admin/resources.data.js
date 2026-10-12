/** Admin management copy and demo seeds. */
export const ADMIN_RESOURCES = {
  "tenants": {
    "title": "Tenants",
    "description": "Manage sample workspace records. This demo does not create external accounts.",
    "fields": [
      {
        "key": "name",
        "label": "Workspace name",
        "kind": "text",
        "required": true
      },
      {
        "key": "plan",
        "label": "Plan",
        "kind": "text",
        "required": true
      },
      {
        "key": "owner",
        "label": "Owner",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "p_personal",
        "enabled": true,
        "archived": false,
        "name": "Personal workspace",
        "plan": "Core",
        "owner": "You"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "credentials-policy": {
    "title": "Credentials policy",
    "description": "Maintain demo credential handling policies. Secret values are not stored here.",
    "fields": [
      {
        "key": "name",
        "label": "Policy name",
        "kind": "text",
        "required": true
      },
      {
        "key": "scope",
        "label": "Scope",
        "kind": "text",
        "required": true
      },
      {
        "key": "retention",
        "label": "Retention policy",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "policy_project",
        "enabled": true,
        "archived": false,
        "name": "Project credentials",
        "scope": "Personal workspace",
        "retention": "Keep credential values out of receipts"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "node-registry": {
    "title": "Node registry",
    "description": "Canonical step definitions with persistent review notes. Reviews preserve published definitions.",
    "fields": [
      {
        "key": "name",
        "label": "Step type",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "group",
        "label": "Group",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "ports",
        "label": "Ports",
        "kind": "json",
        "required": true,
        "readOnly": true
      },
      {
        "key": "note",
        "label": "Review note",
        "kind": "textarea",
        "required": false
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": true,
    "enabledLabel": "Reviewed",
    "disabledLabel": "Needs review",
    "statusLabel": "Review",
    "activeLabel": "Reviewed steps"
  },
  "adapters": {
    "title": "Adapters",
    "description": "Sample adapter configurations using the connection categories in Studio.",
    "fields": [
      {
        "key": "name",
        "label": "Adapter",
        "kind": "text",
        "required": true
      },
      {
        "key": "kind",
        "label": "Connection type",
        "kind": "text",
        "required": true
      },
      {
        "key": "scope",
        "label": "Scope",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "oauth",
        "enabled": true,
        "archived": false,
        "name": "OAuth connector",
        "kind": "OAuth",
        "scope": "Project connections"
      },
      {
        "id": "api_key",
        "enabled": true,
        "archived": false,
        "name": "API connector",
        "kind": "API key",
        "scope": "Project connections"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "usage": {
    "title": "Usage",
    "description": "Studio workspace allowance and run count. Notification thresholds are local demo settings.",
    "fields": [
      {
        "key": "name",
        "label": "Allowance",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "used",
        "label": "Used",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "included",
        "label": "Included",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "alertPercent",
        "label": "Notify at (%)",
        "kind": "number",
        "required": true
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": false
  },
  "ai-governance": {
    "title": "AI governance",
    "description": "Local model review rules. The assistant remains a deterministic demo.",
    "fields": [
      {
        "key": "name",
        "label": "Rule",
        "kind": "text",
        "required": true
      },
      {
        "key": "model",
        "label": "Model profile",
        "kind": "text",
        "required": true
      },
      {
        "key": "review",
        "label": "Review instruction",
        "kind": "textarea",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "ai_uncertain",
        "enabled": true,
        "archived": false,
        "name": "Uncertain answers",
        "model": "Careful",
        "review": "Require human review for unsure answers"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "schedules": {
    "title": "Schedules",
    "description": "Studio scheduled flows. Pause or resume admission in the simulated scheduler.",
    "fields": [
      {
        "key": "name",
        "label": "Flow",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "schedule",
        "label": "Schedule",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "nextRun",
        "label": "Next run",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "note",
        "label": "Note",
        "kind": "textarea",
        "required": false
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": true,
    "liveEnabled": true,
    "liveFields": [
      "nextRun"
    ]
  },
  "workers": {
    "title": "Workers",
    "description": "Worker admission follows Health. Disable admission to drain; enable it to resume.",
    "fields": [
      {
        "key": "name",
        "label": "Worker",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "health",
        "label": "Health",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "note",
        "label": "Note",
        "kind": "textarea",
        "required": false
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": true,
    "liveEnabled": true
  },
  "executions": {
    "title": "All executions",
    "description": "Studio receipts across the demo workspace. Review notes are separate from immutable attempts.",
    "fields": [
      {
        "key": "name",
        "label": "Flow",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "result",
        "label": "Result",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "mode",
        "label": "Mode",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "note",
        "label": "Review note",
        "kind": "textarea",
        "required": false
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": true,
    "primaryAction": "retry",
    "enabledLabel": "Reviewed",
    "disabledLabel": "Needs review",
    "statusLabel": "Review",
    "activeLabel": "Reviewed runs"
  },
  "config": {
    "title": "Config",
    "description": "Local operational configuration. Scheduler admission is synchronized with Health.",
    "fields": [
      {
        "key": "name",
        "label": "Setting",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "value",
        "label": "Value",
        "kind": "boolean",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "kind": "text",
        "required": true,
        "readOnly": true
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": false,
    "liveFields": [
      "value"
    ]
  },
  "backups": {
    "title": "Backups",
    "description": "Create and download browser-local snapshots of workflows, receipts and health. Archiving retains snapshots.",
    "fields": [
      {
        "key": "name",
        "label": "Snapshot name",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": false
  }
};
export const ADMIN_RESOURCE_RULES = { maxRows: 10000, workerNames: ["worker-1", "worker-2", "worker-3", "worker-4"], alertPercent: 80 };
