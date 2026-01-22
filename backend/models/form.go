package models

import (
	"time"
	"gorm.io/gorm"
)

type Form struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `json:"name"`
	Elements  string         `gorm:"type:text" json:"elements"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type FormSubmission struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	FormSchemaID uint      `json:"form_schema_id"`
	Data         string    `gorm:"type:text" json:"data"` // JSON string of answers
	CreatedAt    time.Time `json:"created_at"`
}