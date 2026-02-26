package repositories

import (
	"backend/models"

	"gorm.io/gorm"
)

type FormRepository interface {
	CreateForm(form *models.Form) (*models.Form, error)
	GetAllForms() ([]models.Form, error)
	GetForm(id uint) (*models.Form, error)
	UpdateForm(form *models.Form) error
	DeleteForm(id uint) error
	SubmitForm(submission *models.FormSubmission) error
	GetSubmissions(formID uint) ([]models.FormSubmission, error)
	DeleteSubmission(id uint) error
}

type formRepository struct {
	db *gorm.DB
}

func NewFormRepository(db *gorm.DB) FormRepository {
	return &formRepository{db: db}
}

func (r *formRepository) CreateForm(form *models.Form) (*models.Form, error) {
	if err := r.db.Create(form).Error; err != nil { // Automatically handles Logic/Version
		return nil, err
	}
	return form, nil
}

func (r *formRepository) UpdateForm(form *models.Form) error {
	return r.db.Save(form).Error // Automatically handles Logic/Version
}

func (r *formRepository) GetAllForms() ([]models.Form, error) {
	var forms []models.Form
	if err := r.db.Order("created_at desc").Find(&forms).Error; err != nil {
		return nil, err
	}
	return forms, nil
}

func (r *formRepository) GetForm(id uint) (*models.Form, error) {
	var form models.Form
	if err := r.db.First(&form, id).Error; err != nil {
		return nil, err
	}
	return &form, nil
}

func (r *formRepository) DeleteForm(id uint) error {
	return r.db.Delete(&models.Form{}, id).Error
}

func (r *formRepository) SubmitForm(submission *models.FormSubmission) error {
	return r.db.Create(submission).Error
}

func (r *formRepository) GetSubmissions(formID uint) ([]models.FormSubmission, error) {
	var submissions []models.FormSubmission
	// FIXED: Querying 'form_schema_id' to match the model field
	if err := r.db.Where("form_schema_id = ?", formID).Order("created_at desc").Find(&submissions).Error; err != nil {
		return nil, err
	}
	return submissions, nil
}

func (r *formRepository) DeleteSubmission(id uint) error {
	return r.db.Delete(&models.FormSubmission{}, id).Error
}
