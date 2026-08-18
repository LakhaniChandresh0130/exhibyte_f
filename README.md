# Task Management Backend API

This backend provides project-based task management with comments and activity tracking. It is designed for frontend developers to build the task board, detail view, comments panel, and project activity feed.

## Base URL

- Local: http://localhost:5000
- API prefix: /api

## Authentication and role handling

The backend expects the current user context to be available as either:

- req.user.id and req.user.role in the server
- or request headers:
  - x-user-id
  - x-user-role

Supported role values:

- admin
- member
- viewer

Permission rules:

- admin: full access to task/project actions
- member: can read and add comments, create/update tasks
- viewer: read-only access
- non-project users: blocked with 403

## Project access rules

All task and activity endpoints require the requester to belong to the project.

- project owner is treated as admin
- project members are resolved from the project.members array
- if a user is not a member, they get 403 Forbidden

## Task status values

- todo
- in_progress
- in_review
- done

## Priority values

- low
- medium
- high
- urgent

## Endpoints

### 1) Get project tasks

GET /api/projects/:projectId/tasks?page=1&limit=20&status=todo&assigneeId=uuid&search=keyword

Query parameters:

- page: number, default 1
- limit: number, default 20
- status: optional task status filter
- assigneeId: optional assignee filter
- search: optional title search

Response:

{
  "success": true,
  "message": "Tasks fetched successfully",
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "title": "Task title",
        "description": "Task description",
        "status": "todo",
        "priority": "high",
        "assigneeId": "uuid",
        "createdById": "uuid",
        "dueDate": "2026-08-20T00:00:00.000Z",
        "isArchived": false,
        "createdAt": "2026-08-18T12:00:00.000Z",
        "updatedAt": "2026-08-18T12:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}

### 2) Create task

POST /api/projects/:projectId/tasks

Request body:

{
  "title": "Write API docs",
  "description": "Add backend and frontend contract notes",
  "status": "todo",
  "priority": "high",
  "assigneeId": "uuid",
  "dueDate": "2026-08-20T00:00:00.000Z"
}

Response:

{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "title": "Write API docs",
    "description": "Add backend and frontend contract notes",
    "status": "todo",
    "priority": "high",
    "assigneeId": "uuid",
    "createdById": "uuid",
    "dueDate": "2026-08-20T00:00:00.000Z",
    "isArchived": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}

### 3) Get task by id

GET /api/projects/:projectId/tasks/:taskId

Response includes task details and comments:

{
  "success": true,
  "message": "Task fetched successfully",
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "title": "Task title",
    "description": "Task description",
    "status": "in_progress",
    "priority": "medium",
    "assigneeId": "uuid",
    "createdById": "uuid",
    "comments": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "taskId": "uuid",
        "authorId": "uuid",
        "authorName": "John Doe",
        "body": "Looks good. Need review.",
        "createdAt": "2026-08-18T12:30:00.000Z",
        "updatedAt": "2026-08-18T12:30:00.000Z"
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}

### 4) Update task

PATCH /api/projects/:projectId/tasks/:taskId

Allowed fields:

- title
- description
- status
- priority
- assigneeId
- dueDate

Example request:

{
  "status": "in_progress",
  "assigneeId": "uuid",
  "priority": "urgent"
}

Response:

{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "uuid",
    "status": "in_progress",
    "assigneeId": "uuid",
    "updatedAt": "..."
  }
}

### 5) Get task comments

GET /api/projects/:projectId/tasks/:taskId/comments

Response:

{
  "success": true,
  "message": "Comments fetched successfully",
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "taskId": "uuid",
      "authorId": "uuid",
      "authorName": "Alice",
      "body": "I updated the requirement.",
      "createdAt": "2026-08-18T12:32:00.000Z",
      "updatedAt": "2026-08-18T12:32:00.000Z"
    }
  ]
}

### 6) Add task comment

POST /api/projects/:projectId/tasks/:taskId/comments

Request body:

{
  "body": "Task is ready for QA review."
}

Response:

{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "id": "uuid",
    "projectId": "uuid",
    "taskId": "uuid",
    "authorId": "uuid",
    "authorName": "Alice",
    "body": "Task is ready for QA review.",
    "createdAt": "2026-08-18T12:40:00.000Z",
    "updatedAt": "2026-08-18T12:40:00.000Z"
  }
}

Notes:

- viewer cannot post comments
- comments cannot be edited or deleted via API
- comment author, body, and timestamp are returned

### 7) Get task activity

GET /api/projects/:projectId/tasks/:taskId/activity

Response:

{
  "success": true,
  "message": "Task activity fetched successfully",
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "taskId": "uuid",
      "actorId": "uuid",
      "actorName": "John Doe",
      "action": "status_changed",
      "details": {
        "from": "todo",
        "to": "in_progress"
      },
      "createdAt": "2026-08-18T12:45:00.000Z"
    }
  ]
}

### 8) Get project activity

GET /api/projects/:projectId/activity

Returns the latest project activity, newest first.

Supported activity actions:

- task_created
- status_changed
- assignee_changed
- comment_added

## Error response format

Errors follow this structure:

{
  "success": false,
  "status": "fail",
  "message": "Project not found"
}

or

{
  "success": false,
  "status": "fail",
  "message": "{\"title\":[\"title cannot be empty\"]}"
}

Common status codes:

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error

## Frontend usage notes

### Task board UI

- Use GET /api/projects/:projectId/tasks for the main task list
- Include pagination with page and limit
- Use status filter for column views
- Use search query for task search
- Use assigneeId filter for assignee-specific views

### Task detail page

- Use GET /api/projects/:projectId/tasks/:taskId for the task details
- Render comments from the comments array
- Render activity from the activity endpoint

### Comments section

- Show authorName, body, createdAt
- Render newest comments first
- Only show comment input for admin/member users
- viewer should see comments but not the input box

### Activity feed

- Use GET /api/projects/:projectId/activity
- Sort newest first in UI
- Show activity message using action + details

Example mapping:

- task_created => Task created
- status_changed => Status changed from X to Y
- assignee_changed => Assignee changed from X to Y
- comment_added => Comment added

## Important backend contract notes

- comments are read-only; no edit/delete API exists
- task updates and activity logs are wrapped in one transaction
- if task update succeeds but activity write fails, the task update is rolled back
- project members only can access task and activity data
- requests must include valid project membership context

## Example frontend headers for testing

For local development testing, the backend can accept these headers:

- x-user-id: user uuid
- x-user-role: admin | member | viewer

Example:

{
  "x-user-id": "11111111-1111-1111-1111-111111111111",
  "x-user-role": "admin"
}

## Summary

This API is designed for a task board with:

- Kanban-style task listing
- task detail view
- comment support
- activity feed
- role-based access
- pagination, filtering, and search

Frontend developers can use this contract to build the user interface without needing to guess the response shape.

recording url : https://drive.google.com/file/d/1w3GESTDT6s0kc2jcuTgUfilb7anJXMpM/view?usp=sharing
