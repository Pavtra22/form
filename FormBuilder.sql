-- Create Forms table
CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY, -- Using UUID v7
    name TEXT NOT NULL,
    elements TEXT NOT NULL, -- JSON string storing the form structure
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create FormSubmissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id TEXT PRIMARY KEY, -- Using UUID v7
    form_id TEXT NOT NULL, -- Foreign key referencing forms.id
    data TEXT NOT NULL, -- JSON string storing the submission data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
);