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

	// CORS Configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// --- FILE SERVER FOR VIDEO UPLOADS ---
	workDir, _ := os.Getwd()
	filesDir := http.Dir(filepath.Join(workDir, "uploads"))
	r.Handle("/uploads/*", http.StripPrefix("/uploads", http.FileServer(filesDir)))

	// 4. API Routes
	r.Route("/api", func(r chi.Router) {
		r.Post("/forms", handler.CreateForm)
		r.Get("/forms", handler.GetForms)
		r.Get("/forms/{id}", handler.GetForm)
		r.Delete("/forms/{id}", handler.DeleteForm)

		r.Post("/submit", handler.SubmitForm)
		r.Get("/forms/{id}/submissions", handler.GetSubmissions)
		r.Delete("/submissions/{id}", handler.DeleteSubmission)
		r.NotFound(func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, "../dist/index.html")
		})
		// Add the tag update route here
		r.Put("/submissions/{id}/tags", handler.UpdateTags)
	})

	// 5. Public Form Route (Server Side Rendered)
	r.Get("/public/forms/{id}", handler.ServeFormHTML)

	// 6. SPA FIX: Serve index.html for any route not caught by API or Public routes
	// This prevents 404 errors when refreshing pages like /forms or /responses
	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		// Verify if the request is for a file (like .js or .css) first
		path := filepath.Join(workDir, "../dist", r.URL.Path)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			// If file doesn't exist, serve index.html to let React handle routing
			http.ServeFile(w, r, filepath.Join(workDir, "../dist/index.html"))
		} else {
			// If file exists (static assets), serve the file
			http.ServeFile(w, r, path)
		}
	})

	log.Println("Server running on port 8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatal(err)
	}
}
