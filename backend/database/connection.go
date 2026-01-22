package database

import (
	"backend/models"
	"log"

	"github.com/glebarez/sqlite" // Pure Go SQLite driver (from your provided snippets)
	"gorm.io/gorm"
)

// Connect initializes the database and returns the instance
func Connect() *gorm.DB {
	// 1. Open Database
	// Try opening relative to root first, then relative to backend folder
	db, err := gorm.Open(sqlite.Open("backend/forms.db"), &gorm.Config{})
	if err != nil {
		// Fallback for running inside backend dir
		db, err = gorm.Open(sqlite.Open("forms.db"), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}
	}

	// 2. Auto Migrate
	if err := db.AutoMigrate(&models.Form{}, &models.FormSubmission{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database connected and migrated successfully")
	return db
}
