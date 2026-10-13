# Krugersdorp manager / Company Workspaces fix

The "Unassigned" label shown on Company Workspaces was the workspace REGION, not the Store Manager.

This update also fixes the underlying manager-linking behaviour:
- Company Workspaces now resolves a Store Manager from Team / Access assignments.
- Assigning a user the **Store Manager** role with **Power Build Krugersdorp** as their assigned workspace will show that manager on the Krugersdorp workspace.
- Workspace cards now show `Manager: <name>` explicitly.
- A blank/default region is no longer shown as the confusing text `Unassigned` on the card.
- The opened board shows `Region not assigned` separately from `Manager: ...`.

No D1 migration is required.
