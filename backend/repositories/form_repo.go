package repositories

import (
	"backend/models"

	"gorm.io/gorm"
)

// FormRepository defines the interface for database operations
type FormRepository interface {
	Create(form *models.Form) error
	FindAll() ([]models.Form, error)
	FindByID(id int) (*models.Form, error)
	CreateSubmission(submission *models.FormSubmission) error
	FindSubmissionsByFormID(formID int) ([]models.FormSubmission, error)
	DeleteSubmission(id int) error
	// NEW: Delete Form
	DeleteForm(id int) error
}

// formRepository is the concrete implementation
type formRepository struct {
	db *gorm.DB
}

// NewFormRepository creates a new instance
func NewFormRepository(db *gorm.DB) FormRepository {
	return &formRepository{db: db}
}

func (r *formRepository) Create(form *models.Form) error {
	return r.db.Create(form).Error
}

func (r *formRepository) FindAll() ([]models.Form, error) {
	var forms []models.Form
	err := r.db.Order("created_at desc").Find(&forms).Error
	return forms, err
}

func (r *formRepository) FindByID(id int) (*models.Form, error) {
	var form models.Form
	err := r.db.First(&form, id).Error
	if err != nil {
		return nil, err
	}
	return &form, nil
}

func (r *formRepository) CreateSubmission(submission *models.FormSubmission) error {
	return r.db.Create(submission).Error
}

func (r *formRepository) FindSubmissionsByFormID(formID int) ([]models.FormSubmission, error) {
	var submissions []models.FormSubmission
	err := r.db.Where("form_schema_id = ?", formID).Order("created_at desc").Find(&submissions).Error
	return submissions, err
}

func (r *formRepository) DeleteSubmission(id int) error {
	return r.db.Delete(&models.FormSubmission{}, id).Error
}

// NEW Implementation
func (r *formRepository) DeleteForm(id int) error {
	// Optional: Delete associated submissions first or rely on constraints
	// For GORM with constraints, we might just delete the form.
	return r.db.Delete(&models.Form{}, id).Error
}
