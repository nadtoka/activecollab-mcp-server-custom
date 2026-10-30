import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { ActiveCollabClient } from "./client.js";

dotenv.config();

const baseUrl = process.env.ACTIVECOLLAB_URL || "https://app.activecollab.com";
const token = process.env.ACTIVECOLLAB_TOKEN || "";
const transportMode = (process.env.MCP_TRANSPORT || "sse").toLowerCase();
const port = parseInt(process.env.PORT || "3000", 10);

if (!token && transportMode === "stdio") {
  console.error("Warning: ACTIVECOLLAB_TOKEN is not provided in environment!");
}

const acClient = new ActiveCollabClient({ baseUrl, token });

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "activecollab-mcp-server",
    version: "1.0.0",
  });

  // 1. Tool: List Projects
  server.tool(
    "activecollab_list_projects",
    "List all accessible ActiveCollab projects",
    {},
    async () => {
      try {
        const projects = await acClient.listProjects();
        return {
          content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching projects: ${error.message}` }],
        };
      }
    }
  );

  // 2. Tool: Get Project Details
  server.tool(
    "activecollab_get_project",
    "Get detailed information about a specific project by its ID",
    {
      projectId: z.number().describe("Project ID in ActiveCollab"),
    },
    async ({ projectId }) => {
      try {
        const project = await acClient.getProject(projectId);
        return {
          content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching project ${projectId}: ${error.message}` }],
        };
      }
    }
  );

  // 3. Tool: List Project Tasks
  server.tool(
    "activecollab_list_tasks",
    "List open tasks in a given ActiveCollab project",
    {
      projectId: z.number().describe("Project ID"),
      page: z.number().optional().describe("Pagination page number (default: 1)"),
    },
    async ({ projectId, page }) => {
      try {
        const tasks = await acClient.listProjectTasks(projectId, page || 1);
        return {
          content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching tasks for project ${projectId}: ${error.message}` }],
        };
      }
    }
  );

  // 4. Tool: Get Task Details
  server.tool(
    "activecollab_get_task",
    "Get detailed information about a specific task, including subtasks and comments",
    {
      projectId: z.number().describe("Project ID"),
      taskId: z.number().describe("Task ID or task number in project"),
    },
    async ({ projectId, taskId }) => {
      try {
        const task = await acClient.getTask(projectId, taskId);
        return {
          content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error fetching task: ${error.message}` }],
        };
      }
    }
  );

  // 5. Tool: Create Task
  server.tool(
    "activecollab_create_task",
    "Create a new task in an ActiveCollab project",
    {
      projectId: z.number().describe("Project ID"),
      name: z.string().describe("Task title / summary"),
      body: z.string().optional().describe("Detailed description / body in HTML or markdown"),
      due_on: z.string().optional().describe("Due date formatted as YYYY-MM-DD"),
      assignee_id: z.number().optional().describe("User ID of the assignee"),
      task_list_id: z.number().optional().describe("Task list ID within the project"),
      labels: z.array(z.string()).optional().describe("Array of label strings to attach"),
    },
    async ({ projectId, name, body, due_on, assignee_id, task_list_id, labels }) => {
      try {
        const created = await acClient.createTask(projectId, {
          name,
          body,
          due_on,
          assignee_id,
          task_list_id,
          labels,
        });
        return {
          content: [
            {
              type: "text",
              text: `Task successfully created! ID: ${created.single?.id || "unknown"}\nDetails: ${JSON.stringify(created, null, 2)}`,
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create task: ${error.message}` }],
        };
      }
    }
  );

  // 6. Tool: Complete Task
  server.tool(
    "activecollab_complete_task",
    "Mark a task as completed",
    {
      projectId: z.number().describe("Project ID"),
      taskId: z.number().describe("Task ID"),
    },
    async ({ projectId, taskId }) => {
      try {
        const res = await acClient.completeTask(projectId, taskId);
        return {
          content: [{ type: "text", text: `Task #${taskId} marked as completed.\n${JSON.stringify(res, null, 2)}` }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to complete task #${taskId}: ${error.message}` }],
        };
      }
    }
  );

  // 7. Tool: Add Task Comment
  server.tool(
    "activecollab_add_comment",
    "Add a comment to an existing task",
    {
      projectId: z.number().describe("Project ID"),
      taskId: z.number().describe("Task ID"),
      body: z.string().describe("Content of the comment"),
    },
    async ({ projectId, taskId, body }) => {
      try {
        const res = await acClient.addTaskComment(projectId, taskId, body);
        return {
          content: [{ type: "text", text: `Comment added to task #${taskId}.\n${JSON.stringify(res, null, 2)}` }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to post comment: ${error.message}` }],
        };
      }
    }
  );

  // 8. Tool: Log Time / Add Time Record
  server.tool(
    "activecollab_add_time_record",
    "Log worked hours on a specific task",
    {
      projectId: z.number().describe("Project ID"),
      taskId: z.number().describe("Task ID"),
      value: z.number().describe("Number of hours (e.g. 1.5)"),
      record_date: z.string().describe("Date of time record (YYYY-MM-DD)"),
      summary: z.string().optional().describe("Summary of the work performed"),
    },
    async ({ projectId, taskId, value, record_date, summary }) => {
      try {
        const res = await acClient.addTimeRecord(projectId, taskId, {
          value,
          record_date,
          summary,
        });
        return {
          content: [{ type: "text", text: `Time record added: ${value}h on ${record_date}.\n${JSON.stringify(res, null, 2)}` }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to add time record: ${error.message}` }],
        };
      }
    }
  );

  // 9. Tool: List Users
  server.tool(
    "activecollab_list_users",
    "List team members / users registered in ActiveCollab",
    {},
    async () => {
      try {
        const users = await acClient.listUsers();
        return {
          content: [{ type: "text", text: JSON.stringify(users, null, 2) }],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list users: ${error.message}` }],
        };
      }
    }
  );

  return server;
}

// Transport Runner
async function main() {
  const mcpServer = createMcpServer();

  if (transportMode === "stdio") {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error("ActiveCollab MCP Server running on Stdio");
  } else {
    // Remote HTTP / SSE mode for Kubernetes & remote AI clients
    const app = express();
    app.use(cors());

    // Health check endpoint for K8s Liveness/Readiness probes
    app.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok", service: "activecollab-mcp-server" });
    });

    let sseTransport: SSEServerTransport | null = null;

    app.get("/sse", async (req, res) => {
      console.log("New SSE client connected to /sse");
      sseTransport = new SSEServerTransport("/messages", res);
      await mcpServer.connect(sseTransport);
    });

    app.post("/messages", async (req, res) => {
      if (!sseTransport) {
        res.status(400).send("No active SSE session found");
        return;
      }
      await sseTransport.handlePostMessage(req, res);
    });

    app.listen(port, () => {
      console.log(`ActiveCollab MCP Server (HTTP/SSE) running on port ${port}`);
      console.log(`Endpoints:`);
      console.log(`  - Healthcheck: http://0.0.0.0:${port}/health`);
      console.log(`  - MCP SSE:     http://0.0.0.0:${port}/sse`);
      console.log(`  - MCP Post:    http://0.0.0.0:${port}/messages`);
    });
  }
}

main().catch((err) => {
  console.error("Fatal error starting ActiveCollab MCP Server:", err);
  process.exit(1);
});
