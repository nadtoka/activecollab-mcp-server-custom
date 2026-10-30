import axios, { AxiosInstance } from "axios";

export interface ActiveCollabConfig {
  baseUrl: string;
  token: string;
}

export class ActiveCollabClient {
  private client: AxiosInstance;

  constructor(config: ActiveCollabConfig) {
    const cleanUrl = config.baseUrl.replace(/\/+$/, "");
    this.client = axios.create({
      baseURL: `${cleanUrl}/api/v1`,
      headers: {
        "X-Angie-AuthApiToken": config.token,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
  }

  // --- Projects ---
  async listProjects() {
    const res = await this.client.get("/projects");
    return res.data;
  }

  async getProject(projectId: number) {
    const res = await this.client.get(`/projects/${projectId}`);
    return res.data;
  }

  // --- Tasks ---
  async listProjectTasks(projectId: number, page: number = 1) {
    const res = await this.client.get(`/projects/${projectId}/tasks`, {
      params: { page },
    });
    return res.data;
  }

  async getTask(projectId: number, taskId: number) {
    const res = await this.client.get(`/projects/${projectId}/tasks/${taskId}`);
    return res.data;
  }

  async createTask(projectId: number, data: {
    name: string;
    body?: string;
    assignee_id?: number;
    due_on?: string; // YYYY-MM-DD
    task_list_id?: number;
    labels?: string[];
  }) {
    const res = await this.client.post(`/projects/${projectId}/tasks`, data);
    return res.data;
  }

  async completeTask(projectId: number, taskId: number) {
    const res = await this.client.put(`/projects/${projectId}/tasks/${taskId}/complete`);
    return res.data;
  }

  async openTask(projectId: number, taskId: number) {
    const res = await this.client.put(`/projects/${projectId}/tasks/${taskId}/open`);
    return res.data;
  }

  // --- Comments ---
  async addTaskComment(projectId: number, taskId: number, body: string) {
    const res = await this.client.post(`/projects/${projectId}/tasks/${taskId}/comments`, {
      body,
    });
    return res.data;
  }

  // --- Time Records ---
  async listTimeRecords(params?: { from?: string; to?: string; user_id?: number }) {
    const res = await this.client.get("/user-time-records", { params });
    return res.data;
  }

  async addTimeRecord(projectId: number, taskId: number, data: {
    value: number; // hours
    record_date: string; // YYYY-MM-DD
    summary?: string;
    job_type_id?: number;
  }) {
    const res = await this.client.post(`/projects/${projectId}/tasks/${taskId}/time-records`, data);
    return res.data;
  }

  // --- Users ---
  async listUsers() {
    const res = await this.client.get("/users");
    return res.data;
  }
}
