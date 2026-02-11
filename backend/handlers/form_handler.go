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

// Updated Structs for Multi-Page Support
type FormPage struct {
	ID       string        `json:"id"`
	Title    string        `json:"title"`
	Elements []FormElement `json:"elements"`
	// We don't strictly need LogicRules here for the server-side rendering loop,
	// but useful if we wanted to debug.
	// We will rely on RawElements for the JS logic.
}

type FormElement struct {
	ID          string   `json:"id"`
	Type        string   `json:"type"`
	Label       string   `json:"label"`
	Required    bool     `json:"required"`
	Placeholder string   `json:"placeholder"`
	Options     []string `json:"options"`
}

type TemplateData struct {
	ID          uint
	Name        string
	Pages       []FormPage
	RawElements string // Added to pass full JSON to frontend JS
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

// UpdateForm
func (h *FormHandler) UpdateForm(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	type Request struct {
		Name     string `json:"name"`
		Elements string `json:"elements"`
	}
	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	form, err := h.service.UpdateForm(uint(id), req.Name, req.Elements)
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

	// --- ROBUST PARSING LOGIC ---
	var raw []map[string]interface{}
	if err := json.Unmarshal([]byte(form.Elements), &raw); err != nil {
		http.Error(w, "JSON Parse Error", http.StatusInternalServerError)
		return
	}

	var pages []FormPage
	isMultiPage := false
	if len(raw) > 0 {
		if _, ok := raw[0]["elements"]; ok {
			isMultiPage = true
		}
	} else {
		isMultiPage = true
	}

	if isMultiPage {
		if err := json.Unmarshal([]byte(form.Elements), &pages); err != nil {
			http.Error(w, "Failed to parse pages", http.StatusInternalServerError)
			return
		}
	} else {
		var legacyElements []FormElement
		if err := json.Unmarshal([]byte(form.Elements), &legacyElements); err != nil {
			http.Error(w, "Failed to parse legacy elements", http.StatusInternalServerError)
			return
		}
		pages = []FormPage{
			{
				ID:       "default-page",
				Title:    "Form",
				Elements: legacyElements,
			},
		}
	}

	data := TemplateData{
		ID:          form.ID,
		Name:        form.Name,
		Pages:       pages,
		RawElements: form.Elements, // Passing raw JSON for JS logic
	}

	funcMap := template.FuncMap{
		"add": func(a, b int) int {
			return a + b
		},
	}

	tmplPath := filepath.Join("backend", "templates", "view_form.html")
	tmpl, err := template.New("view_form.html").Funcs(funcMap).ParseFiles(tmplPath)

	if err != nil {
		tmpl, err = template.New("view_form.html").Funcs(funcMap).ParseFiles(filepath.Join("templates", "view_form.html"))
		if err != nil {
			http.Error(w, "Template error: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "text/html")
	tmpl.Execute(w, data)
}

// SubmitForm
func (h *FormHandler) SubmitForm(w http.ResponseWriter, r *http.Request) {
	// Keep existing logic
	err := r.ParseMultipartForm(100 << 20)
	if err != nil {
		fmt.Println("Error parsing form:", err)
		http.Error(w, "File too large or invalid format", http.StatusBadRequest)
		return
	}

	formIDStr := r.FormValue("form_schema_id")
	formID, err := strconv.Atoi(formIDStr)
	if err != nil {
		http.Error(w, "Invalid Form ID", http.StatusBadRequest)
		return
	}

	jsonData := r.FormValue("data")
	var answers map[string]interface{}
	if err := json.Unmarshal([]byte(jsonData), &answers); err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	if err := os.MkdirAll("./uploads", os.ModePerm); err != nil {
		http.Error(w, "Server storage error", http.StatusInternalServerError)
		return
	}

	for key, fileHeaders := range r.MultipartForm.File {
		for _, fileHeader := range fileHeaders {
			file, err := fileHeader.Open()
			if err != nil {
				continue
			}

			ext := filepath.Ext(fileHeader.Filename)
			if ext == "" {
				ext = ".webm"
			}
			newFilename := fmt.Sprintf("%d-%s%s", time.Now().Unix(), "video", ext)
			dstPath := filepath.Join("uploads", newFilename)

			dst, err := os.Create(dstPath)
			if err != nil {
				file.Close()
				http.Error(w, "Failed to save file", http.StatusInternalServerError)
				return
			}

			_, err = io.Copy(dst, file)
			dst.Close()
			file.Close()

			if err != nil {
				continue
			}

			protocol := "http"
			if r.TLS != nil {
				protocol = "https"
			}
			publicURL := fmt.Sprintf("%s://%s/uploads/%s", protocol, r.Host, newFilename)
			answers[key] = publicURL
		}
	}

	finalJSON, err := json.Marshal(answers)
	if err != nil {
		http.Error(w, "Failed to process submission", http.StatusInternalServerError)
		return
	}

	if err := h.service.SubmitForm(uint(formID), string(finalJSON)); err != nil {
		http.Error(w, "Failed to save submission: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Submission saved successfully"})
}

// GetSubmissions
func (h *FormHandler) GetSubmissions(w http.ResponseWriter, r *http.Request) {
	// Keep existing logic
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
	// Keep existing logic
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
	// Keep existing logic
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
