# Requirements Document

## Introduction

This feature enables administrators to manage and customize the AI prompts used in the "Generate Ideas" functionality during Step 2 of the article style generation process. Currently, the prompts are hardcoded in the OpenAI service. This feature provides a plug-and-play admin interface where administrators can modify system and user prompts with dynamic variable support, allowing real-time customization of AI-generated topic suggestions without code changes.

## Glossary

- **Prompt_Management_System**: The administrative interface and backend services that handle storage, retrieval, and application of customizable AI prompts
- **System_Prompt**: The instruction text sent to the AI model that defines its role and behavior
- **User_Prompt**: The contextual text sent to the AI model containing user-specific data and instructions
- **Dynamic_Variable**: A placeholder token in the format `{{variable_name}}` that gets replaced with actual values at runtime
- **Topic_Suggestion**: An AI-generated LinkedIn post topic idea based on user context
- **app_config**: The existing database table used for storing application-wide configuration settings

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to view and edit the AI prompts used for topic generation, so that I can customize the AI behavior without modifying code.

#### Acceptance Criteria

1. WHEN an administrator navigates to the prompt management section THEN the Prompt_Management_System SHALL display the current system prompt and user prompt in editable text areas
2. WHEN an administrator modifies a prompt and clicks save THEN the Prompt_Management_System SHALL persist the updated prompt to the app_config table
3. WHEN the prompt management page loads THEN the Prompt_Management_System SHALL display default prompts if no custom prompts exist in the database
4. IF an administrator submits an empty prompt THEN the Prompt_Management_System SHALL prevent the save operation and display a field-level validation error

### Requirement 2

**User Story:** As an administrator, I want to use dynamic variables in prompts, so that I can create flexible templates that adapt to user context.

#### Acceptance Criteria

1. WHEN an administrator views the prompt editor THEN the Prompt_Management_System SHALL display a list of available dynamic variables with descriptions
2. WHEN a prompt contains dynamic variables in the format `{{variable_name}}` THEN the Prompt_Management_System SHALL replace them with actual values during topic generation
3. WHEN an administrator uses an unsupported variable THEN the Prompt_Management_System SHALL leave the variable text unchanged in the final prompt
4. THE Prompt_Management_System SHALL support the following dynamic variables: `{{job_title}}`, `{{existing_topics}}`, `{{count}}`, `{{style_samples}}`

### Requirement 3

**User Story:** As a user generating topic ideas, I want the AI to use the admin-configured prompts, so that I receive suggestions tailored to the platform's customization.

#### Acceptance Criteria

1. WHEN a user triggers the "Generate Ideas" action THEN the Prompt_Management_System SHALL retrieve the custom prompts from the database
2. WHEN custom prompts exist in the database THEN the Prompt_Management_System SHALL use them instead of the default hardcoded prompts
3. WHEN no custom prompts exist THEN the Prompt_Management_System SHALL fall back to the default prompts defined in the codebase
4. WHEN generating suggestions THEN the Prompt_Management_System SHALL replace all dynamic variables with their corresponding runtime values before sending to the AI

### Requirement 4

**User Story:** As an administrator, I want to preview how prompts will look with sample data, so that I can verify my changes before saving.

#### Acceptance Criteria

1. WHEN an administrator clicks the preview button THEN the Prompt_Management_System SHALL display the prompt with dynamic variables replaced by sample values
2. WHEN previewing a prompt THEN the Prompt_Management_System SHALL use realistic sample data for each variable type
3. WHEN the preview is displayed THEN the Prompt_Management_System SHALL clearly distinguish between the template and the rendered preview

### Requirement 5

**User Story:** As an administrator, I want to reset prompts to their default values, so that I can recover from unwanted changes.

#### Acceptance Criteria

1. WHEN an administrator clicks the reset button THEN the Prompt_Management_System SHALL display a confirmation dialog
2. WHEN the administrator confirms the reset THEN the Prompt_Management_System SHALL restore the default prompts and save them to the database
3. WHEN the reset is complete THEN the Prompt_Management_System SHALL display the default prompts in the editor
