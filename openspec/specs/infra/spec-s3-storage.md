---
id: "0.2.1"
module: "INFRA"
change: "s3-multi-tenant-storage"
title: "Multi-tenant S3 Storage Configuration"
status: "APPROVED"
author: "OpenCode"
created: "2026-04-09"
updated: "2026-04-09"
---

# Feature: Multi-tenant S3 Storage
As a tenant user, I want to upload and retrieve files (images, documents) securely and isolated from other tenants.

## Scenario: Secure Multi-tenant Isolation
- **Given** a valid JWT with `tenant_id`
- **When** I request a pre-signed URL for uploading a file
- **Then** the URL should point to a path prefix `tenants/{tenant_id}/`
- **And** the bucket should have policies preventing cross-tenant access

## Endpoints
- **GET** `/api/v1/storage/presigned-url`
  - Body: `{ "fileName": "image.jpg", "fileType": "image/jpeg", "action": "upload" }`
  - Response: `{ "url": "https://bucket.s3.amazonaws.com/tenants/{tenant_id}/image.jpg?..." }`
- **GET** `/api/v1/storage/files`
  - Response: `[{ "key": "tenants/{tenant_id}/file1.png", "url": "..." }]`
- **DELETE** `/api/v1/storage/files/{key}`
  - Path param: `key` (must start with `tenants/{tenant_id}/`)
  - Response: `{ "success": true, "message": "File deleted" }`

## Infrastructure Requirements
- **Bucket Name**: `gooderp-tenant-storage-${var.environment}`
- **Permissions**: Private, KMS/AES256 encryption, CORS enabled for frontend.
- **Tenant Prefix**: `tenants/{tenant_id}/`
