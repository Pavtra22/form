package services

import (
	"errors"

	"backend/models"
	"backend/repositories"
)

// FormService defines the business logic interface
type FormService interface {
	CreateForm(name string, elements string) (*models.Form, error)
	GetAllForms() ([]models.Form, error)
	GetForm(id int) (*models.Form, error)
	SubmitForm(formID uint, data string) error
	GetSubmissions(formID int) ([]models.FormSubmission, error)
	DeleteSubmission(id int) error
	// NEW
	DeleteForm(id int) error
}

type formService struct {
	repo repositories.FormRepository
}

func NewFormService(repo repositories.FormRepository) FormService {
	return &formService{repo: repo}
}

func (s *formService) CreateForm(name string, elements string) (*models.Form, error) {
	if name == "" || elements == "" {
		return nil, errors.New("name and elements are required")
	}

	newForm := &models.Form{
		Name:     name,
		Elements: elements,
	}

	if err := s.repo.Create(newForm); err != nil {
		return nil, err
	}

	return newForm, nil
}

func (s *formService) GetAllForms() ([]models.Form, error) {
	return s.repo.FindAll()
}

func (s *formService) GetForm(id int) (*models.Form, error) {
	return s.repo.FindByID(id)
}

func (s *formService) SubmitForm(formID uint, data string) error {
	if data == "" {
		return errors.New("submission data cannot be empty")
	}

	submission := &models.FormSubmission{
		FormSchemaID: formID,
		Data:         data,
	}

	return s.repo.CreateSubmission(submission)
}

func (s *formService) GetSubmissions(formID int) ([]models.FormSubmission, error) {
	return s.repo.FindSubmissionsByFormID(formID)
}

func (s *formService) DeleteSubmission(id int) error {
	return s.repo.DeleteSubmission(id)
}

// NEW Implementation
func (s *formService) DeleteForm(id int) error {
	return s.repo.DeleteForm(id)
}
