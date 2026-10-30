# ActiveCollab MCP Server

Model Context Protocol (MCP) Server for [ActiveCollab](https://activecollab.com).

This MCP server connects AI assistants (Claude Desktop, Cursor, Langdock, custom agents) directly to ActiveCollab workspaces via both local **Stdio** and remote **HTTP / SSE** transports.

---

## 🛠 Available MCP Tools

* `activecollab_list_projects` — List all accessible ActiveCollab projects.
* `activecollab_get_project` — Get detailed project information by ID.
* `activecollab_list_tasks` — List open tasks in a given project.
* `activecollab_get_task` — Get task details, subtasks, and discussions.
* `activecollab_create_task` — Create a new task with assignees, due date, task list, and labels.
* `activecollab_complete_task` — Mark a task as completed.
* `activecollab_add_comment` — Add comments/feedback to a task.
* `activecollab_add_time_record` — Log billable/non-billable hours on tasks.
* `activecollab_list_users` — List workspace members and IDs.

---

## 🚀 Quickstart (Local Desktop / Claude)

### 1. Installation & Build

```bash
git clone https://github.com/nadtoka/activecollab-mcp-server-custom.git
cd activecollab-mcp-server-custom
npm install
npm run build
```

### 2. Configure Token
ActiveCollab API uses a user-prefixed token: `<USER_ID>-<TOKEN_STRING>`.
Obtain your token in **Apps & Integrations → API Tokens**.

Copy `.env.example` to `.env`:
```env
ACTIVECOLLAB_URL=https://app.activecollab.com/YOUR_ACCOUNT_ID
ACTIVECOLLAB_TOKEN=10-your_token_string_here
MCP_TRANSPORT=stdio
```

### 3. Claude Desktop Configuration
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "activecollab": {
      "command": "node",
      "args": ["/path/to/activecollab-mcp-server-custom/dist/index.js"],
      "env": {
        "ACTIVECOLLAB_URL": "https://app.activecollab.com/YOUR_ACCOUNT_ID",
        "ACTIVECOLLAB_TOKEN": "YOUR_USER_ID-YOUR_TOKEN_STRING",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

---

## ☁️ Deployment (Kubernetes / Remote SSE)

The server also runs as a persistent HTTP/SSE daemon for remote agents or Kubernetes workloads:

```bash
MCP_TRANSPORT=sse PORT=3000 npm start
```

Endpoints provided:
- **SSE Stream:** `/sse`
- **Messages:** `/messages`
- **Healthcheck:** `/health`

Pre-configured Kubernetes manifests are available in [`k8s/`](./k8s/).

---

## 📄 License
MIT
