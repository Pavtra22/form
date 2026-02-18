package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"backend/database"
	"backend/handlers"
	"backend/repositories"
	"backend/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// 1. Initialize Database
	db := database.Connect()

	// 2. Initialize Layers
	repo := repositories.NewFormRepository(db)
	service := services.NewFormService(repo)
	handler := handlers.NewFormHandler(service)

	// 3. Setup Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// CORS Configuration (STRICT MODE)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// --- Serve Uploads Folder ---
	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads", http.FileServer(filesDir)))

	// 4. Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/forms", handler.CreateForm)
		r.Get("/forms", handler.GetForms)
		r.Get("/forms/{id}", handler.GetForm)
		r.Put("/forms/{id}", handler.UpdateForm) // NEW: Update Route
		r.Delete("/forms/{id}", handler.DeleteForm)

		r.Post("/submit", handler.SubmitForm)

		r.Get("/forms/{id}/submissions", handler.GetSubmissions)
		r.Delete("/submissions/{id}", handler.DeleteSubmission)
	})

	r.Get("/public/forms/{id}", handler.ServeFormHTML)

	log.Println("Server running on port 8080")
	http.ListenAndServe(":8080", r)
}
