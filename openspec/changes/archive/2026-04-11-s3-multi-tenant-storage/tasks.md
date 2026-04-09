# Tasks: S3 Multi-tenant Storage

## Phase 1: Infrastructure (Terraform)
- [ ] Create `aws_s3_bucket.tenant_storage` (private, versioning off, encryption AES256). [id: 1.1]
- [ ] Configure `aws_s3_bucket_cors_configuration` for frontend access (localhost and dev domains). [id: 1.2]
- [ ] Create `aws_iam_policy.s3_tenant_access` for Lambda with path-prefix restriction `${bucket_arn}/tenants/${tenant_id}/*`. [id: 1.3]

## Phase 2: Backend Implementation (Lambda)
- [ ] Create `lib/lambda/shared/fnS3Manager` with standard layout (`lambda.config.json`, `index.mjs`, `handlers/`). [id: 2.1]
- [ ] Implement `extractTenantId` (canon P1-P4) in `utils/sanitization.mjs`. [id: 2.2]
- [ ] Implement `GET /presigned-url` handler to generate upload/download URLs. [id: 2.3]
- [ ] Implement `GET /files` handler to list files for the tenant. [id: 2.4]
- [ ] Implement `DELETE /files/{key}` handler to remove files. [id: 2.5]

## Phase 3: Verification & Certification
- [ ] Write TDD tests for `fnS3Manager`. [id: 3.1]
- [ ] Deploy and verify with manual upload/download using Postman. [id: 3.2]
- [ ] Generate `EVIDENCE.md` with logs and test results. [id: 3.3]
