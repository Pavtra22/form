package handlers

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"backend/services"

	"github.com/go-chi/chi/v5"
)

type FormHandler struct {
	service services.FormService
}

func NewFormHandler(service services.FormService) *FormHandler {
	return &FormHandler{service: service}
}

// Helper struct for template
type FormElement struct {
	ID          string `json:"id"`
	Type        string `json:"type"`
	Label       string `json:"label"`
	Required    bool   `json:"required"`
	Placeholder string `json:"placeholder"`
}

type TemplateData struct {
	ID       uint
	Name     string
	Elements []FormElement
}

// CreateForm
func (h *FormHandler) CreateForm(w http.ResponseWriter, r *http.Request) {
	type Request struct {
		Name     string `json:"name"`
		Elements string `json:"elements"`
	}
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	form, err := h.service.CreateForm(req.Name, req.Elements)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}

// GetForms
func (h *FormHandler) GetForms(w http.ResponseWriter, r *http.Request) {
	forms, err := h.service.GetAllForms()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(forms)
}

// GetForm
func (h *FormHandler) GetForm(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	form, err := h.service.GetForm(id)
	if err != nil {
		http.Error(w, "Form not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(form)
}

// ServeFormHTML
func (h *FormHandler) ServeFormHTML(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	form, err := h.service.GetForm(id)
	if err != nil {
		http.Error(w, "Form not found", http.StatusNotFound)
		return
	}

	var elements []FormElement
	if err := json.Unmarshal([]byte(form.Elements), &elements); err != nil {
		http.Error(w, "Failed to parse form data", http.StatusInternalServerError)
		return
	}

	data := TemplateData{
		ID:       form.ID,
		Name:     form.Name,
		Elements: elements,
	}

	// Template path resolution
	tmplPath := filepath.Join("backend", "templates", "view_form.html")
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		tmpl, err = template.ParseFiles(filepath.Join("templates", "view_form.html"))
		if err != nil {
			http.Error(w, "Template error: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "text/html")
	tmpl.Execute(w, data)
}

// SubmitForm handles Multipart requests (JSON data + Video Files)
func (h *FormHandler) SubmitForm(w http.ResponseWriter, r *http.Request) {
	// --- LOG START ---
	requestStart := time.Now()
	fmt.Println("\n--- [START] New Submission Request ---")

	// 1. Parse Multipart Form
	// Limit upload to 100 MB
	err := r.ParseMultipartForm(100 << 20)
	if err != nil {
		fmt.Println("Error parsing form:", err)
		http.Error(w, "File too large or invalid format", http.StatusBadRequest)
		return
	}
	fmt.Printf(">> Upload & Parse Duration: %v\n", time.Since(requestStart))

	// 2. Get Form Schema ID
	formIDStr := r.FormValue("form_schema_id")
	formID, err := strconv.Atoi(formIDStr)
	if err != nil {
		http.Error(w, "Invalid Form ID", http.StatusBadRequest)
		return
	}

	// 3. Get the Text Answers
	jsonData := r.FormValue("data")
	var answers map[string]interface{}
	if err := json.Unmarshal([]byte(jsonData), &answers); err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	// 4. Process Uploaded Files
	if err := os.MkdirAll("./uploads", os.ModePerm); err != nil {
		http.Error(w, "Server storage error", http.StatusInternalServerError)
		return
	}

	fileProcessStart := time.Now()
	filesSaved := 0

	// Iterate over all uploaded files
	for key, fileHeaders := range r.MultipartForm.File {
		for _, fileHeader := range fileHeaders {
			filesSaved++
			singleFileStart := time.Now()

			file, err := fileHeader.Open()
			if err != nil {
				continue
			}

			// Generate unique filename
			ext := filepath.Ext(fileHeader.Filename)
			if ext == "" {
				ext = ".webm"
			}
			newFilename := fmt.Sprintf("%d-%s%s", time.Now().Unix(), "video", ext)
			dstPath := filepath.Join("uploads", newFilename)

			// Save to disk
			dst, err := os.Create(dstPath)
			if err != nil {
				file.Close()
				fmt.Println("Error creating file:", err)
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}

			// Write file
			writtenBytes, err := io.Copy(dst, file)

			dst.Close()
			file.Close()

			if err != nil {
				fmt.Println("Error writing file:", err)
				continue
			}

			// Generate Public URL
			protocol := "http"
			if r.TLS != nil {
				protocol = "https"
			}
			publicURL := fmt.Sprintf("%s://%s/uploads/%s", protocol, r.Host, newFilename)

			// Save URL to database map
			answers[key] = publicURL

			fmt.Printf("   -> Saved: %s | Size: %.2f MB | Time: %v\n",
				newFilename, float64(writtenBytes)/(1024*1024), time.Since(singleFileStart))
		}
	}

	fmt.Printf(">> Disk Write Duration (%d files): %v\n", filesSaved, time.Since(fileProcessStart))

	// 6. Save to Database
	dbStart := time.Now()
	finalJSON, err := json.Marshal(answers)
	if err != nil {
		http.Error(w, "Failed to process submission", http.StatusInternalServerError)
		return
	}

	if err := h.service.SubmitForm(uint(formID), string(finalJSON)); err != nil {
		http.Error(w, "Failed to save submission: "+err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Printf(">> Database Save Duration: %v\n", time.Since(dbStart))
	fmt.Printf("--- [DONE] Total Request Duration: %v ---\n", time.Since(requestStart))

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Submission saved successfully"})
}

// GetSubmissions
func (h *FormHandler) GetSubmissions(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	submissions, err := h.service.GetSubmissions(id)
	if err != nil {
		http.Error(w, "Failed to fetch submissions", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submissions)
}

// DeleteSubmission
func (h *FormHandler) DeleteSubmission(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteSubmission(id); err != nil {
		http.Error(w, "Failed to delete submission", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Submission deleted"})
}

// DeleteForm
func (h *FormHandler) DeleteForm(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteForm(id); err != nil {
		http.Error(w, "Failed to delete form", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Form deleted"})
}
