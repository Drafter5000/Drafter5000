# Design Document: Multi-Article Workflow

## Overview

This design transforms the existing onboarding flow into a flexible multi-article styles system. Users can create, manage, and delete multiple article styles, each with unique writing samples, subjects, and delivery preferences. The system maintains data synchronization between PostgreSQL and Google Sheets, ensuring consistency across both storage systems.

The architecture follows a clean component-based approach with small, reusable components, RESTful API routes, and proper separation of concerns.

## Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js App Router"
        Dashboard[Dashboard Page]
        StylesList[Article Styles List]
        StyleForm[Style Generation Form]
        ArticlesList[My Articles Section]
    end

    subgraph "API Routes"
        StylesAPI[/api/article-styles]
        ArticlesAPI[/api/articles]
    end

    subgraph "Services"
        StyleService[Article Style Service]
        SyncService[Sheets Sync Service]
    end

    subgraph "Data Layer"
        Supabase[(PostgreSQL)]
        Sheets[(Google Sheets)]
    end

    Dashboard --> StylesList
    Dashboard --> ArticlesList
    StylesList --> StylesAPI
    StyleForm --> StylesAPI
    ArticlesList --> ArticlesAPI

    StylesAPI --> StyleService
    StyleService --> Supabase
    StyleService --> SyncService
    SyncService --> Sheets
```

## Components and Interfaces

### Frontend Components

#### Page Components

- `app/articles/generate/step-1/page.tsx` - Style samples input form
- `app/articles/generate/step-2/page.tsx` - Subjects selection form
- `app/articles/generate/step-3/page.tsx` - Delivery settings form
- `app/articles/styles/page.tsx` - Article styles list view
- `app/articles/styles/[id]/page.tsx` - Style detail view
- `app/articles/styles/[id]/edit/page.tsx` - Style edit view

#### Reusable Components (in `/components/articles/`)

- `style-card.tsx` - Individual style card display
- `style-list.tsx` - Grid/list of style cards
- `style-form-step1.tsx` - Style samples form component
- `style-form-step2.tsx` - Subjects form component
- `style-form-step3.tsx` - Delivery settings form component
- `article-card.tsx` - Individual article card display
- `article-list.tsx` - Grid/list of article cards
- `empty-state.tsx` - Reusable empty state component
- `delete-dialog.tsx` - Confirmation dialog for deletion

### API Routes

```typescript
// Article Styles CRUD
GET    /api/article-styles          - List all styles for user
POST   /api/article-styles          - Create new style
GET    /api/article-styles/[id]     - Get single style
PUT    /api/article-styles/[id]     - Update style
DELETE /api/article-styles/[id]     - Delete style

// Step-based creation (for wizard flow)
POST   /api/article-styles/step-1   - Save step 1 data (style samples)
POST   /api/article-styles/step-2   - Save step 2 data (subjects)
POST   /api/article-styles/step-3   - Complete style creation
```

### Service Interfaces

```typescript
interface ArticleStyleService {
  list(userId: string): Promise<ArticleStyle[]>;
  get(id: string, userId: string): Promise<ArticleStyle | null>;
  create(data: CreateArticleStyleInput): Promise<ArticleStyle>;
  update(id: string, data: UpdateArticleStyleInput): Promise<ArticleStyle>;
  delete(id: string, userId: string): Promise<void>;
  syncToSheets(style: ArticleStyle): Promise<void>;
  deleteFromSheets(styleId: string): Promise<void>;
}
```

## Data Models

### Database Schema Changes

```sql
-- New article_styles table (replaces onboarding_data for style management)
CREATE TABLE IF NOT EXISTS article_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  style_samples TEXT[] DEFAULT '{}',
  subjects TEXT[] DEFAULT '{}',
  email TEXT,
  display_name TEXT,
  preferred_language TEXT DEFAULT 'en',
  delivery_days TEXT[] DEFAULT '{}',
  sheets_config_id TEXT,
  sheets_row_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Update articles table to reference article_styles
ALTER TABLE articles ADD COLUMN style_id UUID REFERENCES article_styles(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_article_styles_user_id ON article_styles(user_id);
CREATE INDEX idx_article_styles_created_at ON article_styles(created_at DESC);
CREATE INDEX idx_articles_style_id ON articles(style_id);
```

### TypeScript Types

```typescript
interface ArticleStyle {
  id: string;
  user_id: string;
  name: string;
  style_samples: string[];
  subjects: string[];
  email: string | null;
  display_name: string | null;
  preferred_language: string;
  delivery_days: string[];
  sheets_config_id: string | null;
  sheets_row_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateArticleStyleInput {
  user_id: string;
  name: string;
  style_samples: string[];
  subjects: string[];
  email?: string;
  display_name?: string;
  preferred_language?: string;
  delivery_days?: string[];
}

interface UpdateArticleStyleInput {
  name?: string;
  style_samples?: string[];
  subjects?: string[];
  email?: string;
  display_name?: string;
  preferred_language?: string;
  delivery_days?: string[];
  is_active?: boolean;
}

interface ArticleWithStyle extends Article {
  style_name: string | null;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Based on the prework analysis, the following properties have been identified after eliminating redundancy:

### Property 1: Article Style Creation Persistence

_For any_ valid article style data (with at least one style sample and one subject), creating the style SHALL result in a new record in the database with a unique identifier that can be retrieved.
**Validates: Requirements 1.4**

### Property 2: Article Style Display Completeness

_For any_ article style, when rendered in the UI, the output SHALL contain the style name, language, delivery days count, and creation date.
**Validates: Requirements 2.2**

### Property 3: Edit Form Pre-population

_For any_ existing article style, when loaded into the edit form, all form fields SHALL be pre-populated with the style's current data values.
**Validates: Requirements 3.1**

### Property 4: Update Persistence

_For any_ valid update to an article style (modifying samples, subjects, or delivery settings), the updated data SHALL be persisted to the database and the `updated_at` timestamp SHALL be greater than the previous value.
**Validates: Requirements 3.2, 3.3, 3.4, 3.6**

### Property 5: Deletion Removes Record

_For any_ existing article style, after deletion is confirmed, the style SHALL no longer exist in the database when queried.
**Validates: Requirements 4.2**

### Property 6: Article Display Completeness

_For any_ article, when rendered in the UI, the output SHALL contain the article subject, status, generation date, and associated style name (if available).
**Validates: Requirements 5.2**

### Property 7: Data Migration Preservation

_For any_ existing onboarding data record, after migration, a corresponding article_style record SHALL exist with equivalent data values.
**Validates: Requirements 6.5**

## Error Handling

### API Error Responses

```typescript
// Standard error response format
interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

// HTTP Status Codes
// 400 - Validation errors (missing fields, invalid data)
// 401 - Authentication required
// 403 - Not authorized to access resource
// 404 - Resource not found
// 500 - Internal server error
```

### Error Scenarios

1. **Style Creation Failure**
   - Validate all required fields before database operation
   - Return specific validation error messages
   - Roll back partial operations on failure

2. **Google Sheets Sync Failure**
   - Log error with full context
   - Continue with PostgreSQL operation (primary source of truth)
   - Queue retry for sheets sync
   - Notify user of partial success

3. **Deletion Failure**
   - Confirm deletion before executing
   - Handle cascade deletion of related articles
   - Clean up sheets data with error tolerance

## Testing Strategy

### Property-Based Testing

The system will use **fast-check** as the property-based testing library for TypeScript/JavaScript.

Each property-based test MUST:

- Be tagged with a comment referencing the correctness property: `**Feature: multi-article-workflow, Property {number}: {property_text}**`
- Run a minimum of 100 iterations
- Use smart generators that constrain to valid input spaces

### Unit Tests

Unit tests will cover:

- Validation functions for style samples, subjects, and delivery settings
- Data transformation utilities
- API route handlers with mocked dependencies

### Test File Structure

```
lib/
  article-styles.test.ts          - Service unit tests
  article-styles.property.test.ts - Property-based tests
components/articles/
  __tests__/
    style-card.test.tsx           - Component tests
```

### Testing Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx', '**/*.property.test.ts'],
  },
});
```
