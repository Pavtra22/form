package services

import (
	"backend/models"
	"backend/repositories"
)

type FormService interface {
	CreateForm(name, elements string) (*models.Form, error)
	GetAllForms() ([]models.Form, error)
	GetForm(id int) (*models.Form, error)
	UpdateForm(id uint, name, elements string) (*models.Form, error)
	DeleteForm(id int) error
	SubmitForm(formID uint, data string) error
	GetSubmissions(formID int) ([]models.FormSubmission, error)
	DeleteSubmission(id int) error
}

type formService struct {
	repo repositories.FormRepository
}

func NewFormService(repo repositories.FormRepository) FormService {
	return &formService{repo: repo}
}

func (s *formService) CreateForm(name, elements string) (*models.Form, error) {
	form := &models.Form{
		Name:     name,
		Elements: elements,
	}
	return s.repo.CreateForm(form)
}

func (s *formService) GetAllForms() ([]models.Form, error) {
	return s.repo.GetAllForms()
}

func (s *formService) GetForm(id int) (*models.Form, error) {
	return s.repo.GetForm(uint(id))
}

func (s *formService) UpdateForm(id uint, name, elements string) (*models.Form, error) {
	form, err := s.repo.GetForm(id)
	if err != nil {
		return nil, err
	}

	form.Name = name
	form.Elements = elements

	if err := s.repo.UpdateForm(form); err != nil {
		return nil, err
	}
	return form, nil
}

func (s *formService) DeleteForm(id int) error {
	return s.repo.DeleteForm(uint(id))
}

func (s *formService) SubmitForm(formID uint, data string) error {
	submission := &models.FormSubmission{
		FormSchemaID: formID, // FIXED: Matches your model's field name
		Data:         data,
	}
	return s.repo.SubmitForm(submission)
}

func (s *formService) GetSubmissions(formID int) ([]models.FormSubmission, error) {
	return s.repo.GetSubmissions(uint(formID))
}

func (s *formService) DeleteSubmission(id int) error {
	return s.repo.DeleteSubmission(uint(id))
}
