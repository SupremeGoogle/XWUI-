/** Compact Studio management resources. Copy and seeds are served by studioApi. */
export const STUDIO_RESOURCES = {
  "agents": {
    "title": "Agents",
    "description": "Configure local assistant profiles and instructions. Model responses remain simulated.",
    "fields": [
      {
        "key": "name",
        "label": "Name",
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
        "key": "instructions",
        "label": "Instructions",
        "kind": "textarea",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "agent_support",
        "enabled": true,
        "archived": false,
        "name": "Support triage",
        "model": "Demo reasoning model",
        "instructions": "Classify incoming questions and route uncertain answers for review."
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "tables": {
    "title": "Tables",
    "description": "Define table schemas and edit sample rows as JSON. No external database is connected.",
    "fields": [
      {
        "key": "name",
        "label": "Table name",
        "kind": "text",
        "required": true
      },
      {
        "key": "columns",
        "label": "Columns",
        "kind": "json",
        "required": true
      },
      {
        "key": "records",
        "label": "Rows",
        "kind": "json",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "table_orders",
        "enabled": true,
        "archived": false,
        "name": "Orders",
        "columns": "[\"order_id\",\"total\",\"status\"]",
        "records": "[{\"order_id\":\"o_5581\",\"total\":740,\"status\":\"received\"}]"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "forms": {
    "title": "Forms",
    "description": "Define input forms and their target flow. Submission delivery is simulated.",
    "fields": [
      {
        "key": "name",
        "label": "Form name",
        "kind": "text",
        "required": true
      },
      {
        "key": "fields",
        "label": "Fields",
        "kind": "json",
        "required": true
      },
      {
        "key": "flowId",
        "label": "Target flow ID",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "form_leads",
        "enabled": true,
        "archived": false,
        "name": "Lead intake",
        "fields": "[\"name\",\"email\",\"message\"]",
        "flowId": "flow_lead_intake"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "variables": {
    "title": "Variables",
    "description": "Store non-secret values used when preparing step parameters. Credentials belong in Connections.",
    "fields": [
      {
        "key": "name",
        "label": "Variable name",
        "kind": "text",
        "required": true
      },
      {
        "key": "value",
        "label": "Value",
        "kind": "text",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "var_order_limit",
        "enabled": true,
        "archived": false,
        "name": "order_threshold",
        "value": "500",
        "description": "Threshold used by the order condition"
      },
      {
        "id": "var_currency",
        "enabled": true,
        "archived": false,
        "name": "order_currency",
        "value": "USD",
        "description": "Currency in the sample order payload"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "mcp": {
    "title": "MCP servers",
    "description": "Manage demo MCP server registrations. No requests or credentials are sent to these endpoints.",
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "kind": "text",
        "required": true
      },
      {
        "key": "endpoint",
        "label": "Endpoint",
        "kind": "https",
        "required": true
      },
      {
        "key": "tools",
        "label": "Tools",
        "kind": "json",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "mcp_catalog",
        "enabled": true,
        "archived": false,
        "name": "Catalog tools",
        "endpoint": "https://tools.example.com/mcp",
        "tools": "[\"search_catalog\",\"get_record\"]"
      }
    ],
    "allowCreate": true,
    "allowArchive": true,
    "allowToggle": true
  },
  "templates": {
    "title": "Templates",
    "description": "Choose a sample workflow template, create its draft, or edit local template descriptions.",
    "fields": [
      {
        "key": "name",
        "label": "Name",
        "kind": "text",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": true,
    "primaryAction": "template"
  },
  "insights": {
    "title": "Insights",
    "description": "Run summaries from the Studio ledger. Enable the summaries you want to keep in this local view.",
    "fields": [
      {
        "key": "name",
        "label": "Metric",
        "kind": "text",
        "required": true
      },
      {
        "key": "value",
        "label": "Value",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "description",
        "label": "Description",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": true
  },
  "settings": {
    "title": "Settings",
    "description": "Workspace preferences for this browser. Run modes remain explicit in the demo controls.",
    "fields": [
      {
        "key": "name",
        "label": "Preference",
        "kind": "text",
        "required": true,
        "readOnly": true
      },
      {
        "key": "value",
        "label": "Value",
        "kind": "text",
        "required": true
      },
      {
        "key": "description",
        "label": "Description",
        "kind": "text",
        "required": true
      }
    ],
    "rows": [
      {
        "id": "pref_execution",
        "enabled": true,
        "archived": false,
        "name": "Default run mode",
        "value": "test",
        "description": "Preferred mode for new workflows"
      },
      {
        "id": "pref_retention",
        "enabled": true,
        "archived": false,
        "name": "Receipt retention",
        "value": "30 days",
        "description": "Local demonstration preference"
      }
    ],
    "allowCreate": false,
    "allowArchive": false,
    "allowToggle": true
  }
};
