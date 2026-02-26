package models

import (
	"time"
)

type Form struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `json:"name"`
	Elements  string    `json:"elements"` // JSON string
	Logic     string    `json:"logic"`    // ADDED: Logic at root
	Version   int       `json:"version"`  // ADDED: Version field
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FormSubmission struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	FormSchemaID uint      `json:"form_schema_id"`
	Data         string    `gorm:"type:text" json:"data"` // JSON string of answers
	CreatedAt    time.Time `json:"created_at"`
}
