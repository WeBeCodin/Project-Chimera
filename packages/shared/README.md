# Shared Libraries

Shared TypeScript libraries for Project Chimera monorepo.

## Features

- **TypeScript** types and schemas
- **Zod** validation schemas
- **React hooks** for common functionality
- **Utility functions**
- **API types** and interfaces

## Installation

This package is used internally within the monorepo. Install dependencies:

```bash
npm install
npm run build
```

## Scripts

- `build` - Compile TypeScript
- `dev` - Watch mode for development
- `lint` - Run ESLint
- `type-check` - Run TypeScript type checking

## Exports

### Types
- `User`, `Project`, `Video`, `Job` - Core entity types
- `JobStatus` - Enum for job statuses
- `ApiResponse` - Generic API response type
- `CreateProjectRequest`, `CreateJobRequest` - API request types

### Utils
- `formatFileSize()` - Format bytes to human readable
- `formatDuration()` - Format seconds to HH:MM:SS
- `debounce()` - Debounce function calls
- `generateId()` - Generate random IDs
- `isValidUrl()` - URL validation
- `sleep()` - Promise-based delay

### Hooks
- `useJobPolling()` - Poll job status with interval
- `useLocalStorage()` - Persist state to localStorage
- `useAsync()` - Handle async operations with loading/error states

## Usage

Import in other packages:

```typescript
import { 
  Job, 
  JobStatus, 
  formatDuration, 
  useJobPolling 
} from '@chimera/shared';
```

## Validation

All types include Zod schemas for runtime validation:

```typescript
import { ProjectSchema } from '@chimera/shared';

const validatedProject = ProjectSchema.parse(data);
```