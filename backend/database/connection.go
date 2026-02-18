package database

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"backend/models"

	"github.com/glebarez/sqlite" // Pure Go SQLite driver
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect initializes the database and returns the instance
func Connect() *gorm.DB {
	// Ensure backend directory exists
	if err := os.MkdirAll("backend", 0755); err != nil {
		log.Fatal("Failed to create backend directory:", err)
	}

	dbPath := filepath.Join("backend", "forms.db")

	// Configure custom logger
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// 1. Open Database
	// Try opening relative to root first, then relative to backend folder
	// Note: glebarez/sqlite uses standard file paths
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: newLogger,
	})

	if err != nil {
		// Fallback: try opening simply "forms.db" if running from inside backend dir
		db, err = gorm.Open(sqlite.Open("forms.db"), &gorm.Config{
			Logger: newLogger,
		})
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}
	}

	// --- CRITICAL FIX FOR SQLITE LOCKING ---
	// Enable Write-Ahead Logging (WAL) mode.
	if err := db.Exec("PRAGMA journal_mode=WAL;").Error; err != nil {
		log.Println("Failed to enable WAL mode:", err)
	}

	// Set Busy Timeout
	if err := db.Exec("PRAGMA busy_timeout=5000;").Error; err != nil {
		log.Println("Failed to set busy timeout:", err)
	}
	// ---------------------------------------

	// 2. Auto Migrate
	if err := db.AutoMigrate(&models.Form{}, &models.FormSubmission{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Configure Connection Pool
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to get SQL DB object:", err)
	}

	// SQLite settings for concurrency safety
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Database connected and migrated successfully (WAL Mode Enabled)")
	return db
}
