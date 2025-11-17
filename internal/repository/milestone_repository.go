// package repository

// import (
// 	"context"
// 	"errors"
// 	"fmt"
// 	"time"

// 	"github.com/google/uuid"
// 	"github.com/samuelarogbonlo/.escrow/backend/internal/models"
// 	"gorm.io/gorm"
// )

// // GormMilestoneRepository is a GORM implementation of MilestoneRepository
// type GormMilestoneRepository struct {
// 	db *gorm.DB
// }

// // NewGormMilestoneRepository creates a new GormMilestoneRepository
// func NewGormMilestoneRepository(db *gorm.DB) MilestoneRepository {
// 	return &GormMilestoneRepository{
// 		db: db,
// 	}
// }

// // WithTx implements Repository
// func (r *GormMilestoneRepository) WithTx(tx *gorm.DB) Repository {
// 	return &GormMilestoneRepository{
// 		db: tx,
// 	}
// }

// // Find finds a milestone by ID
// func (r *GormMilestoneRepository) Find(ctx context.Context, id uuid.UUID) (*models.Milestone, error) {
// 	var milestone models.Milestone
// 	if err := r.db.WithContext(ctx).First(&milestone, "id = ?", id).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, fmt.Errorf("milestone not found with ID %s", id)
// 		}
// 		return nil, fmt.Errorf("error finding milestone: %w", err)
// 	}
// 	return &milestone, nil
// }

// // FindByEscrow finds all milestones for an escrow
// func (r *GormMilestoneRepository) FindByEscrow(ctx context.Context, escrowID uuid.UUID) ([]models.Milestone, error) {
// 	var milestones []models.Milestone
// 	if err := r.db.WithContext(ctx).
// 		Where("escrow_id = ?", escrowID).
// 		Order("created_at").
// 		Find(&milestones).Error; err != nil {
// 		return nil, fmt.Errorf("error finding milestones: %w", err)
// 	}
// 	return milestones, nil
// }

// // Create creates a new milestone
// func (r *GormMilestoneRepository) Create(ctx context.Context, milestone *models.Milestone) error {
// 	if err := r.db.WithContext(ctx).Create(milestone).Error; err != nil {
// 		return fmt.Errorf("error creating milestone: %w", err)
// 	}
// 	return nil
// }

// // Update updates a milestone
// func (r *GormMilestoneRepository) Update(ctx context.Context, milestone *models.Milestone) error {
// 	if err := r.db.WithContext(ctx).Save(milestone).Error; err != nil {
// 		return fmt.Errorf("error updating milestone: %w", err)
// 	}
// 	return nil
// }

// // Delete deletes a milestone
// func (r *GormMilestoneRepository) Delete(ctx context.Context, id uuid.UUID) error {
// 	if err := r.db.WithContext(ctx).Delete(&models.Milestone{}, "id = ?", id).Error; err != nil {
// 		return fmt.Errorf("error deleting milestone: %w", err)
// 	}
// 	return nil
// }

// // UpdateEvidence adds evidence to a milestone
// func (r *GormMilestoneRepository) UpdateEvidence(ctx context.Context, id uuid.UUID, evidenceHash, evidenceLink string) error {
// 	updates := map[string]interface{}{
// 		"evidence_hash":     evidenceHash,
// 		"evidence_link":     evidenceLink,
// 		"evidence_added_at": time.Now(),
// 		"updated_at":        time.Now(),
// 	}
	
// 	if err := r.db.WithContext(ctx).
// 		Model(&models.Milestone{}).
// 		Where("id = ?", id).
// 		Updates(updates).Error; err != nil {
// 		return fmt.Errorf("error updating milestone evidence: %w", err)
// 	}
// 	return nil
// }

// // UpdateStatus updates the status of a milestone
// func (r *GormMilestoneRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
// 	updates := map[string]interface{}{
// 		"status":     status,
// 		"updated_at": time.Now(),
// 	}
	
// 	// If status is "completed", also update the completed_at timestamp
// 	if status == "completed" {
// 		updates["completed_at"] = time.Now()
// 	}
	
// 	if err := r.db.WithContext(ctx).
// 		Model(&models.Milestone{}).
// 		Where("id = ?", id).
// 		Updates(updates).Error; err != nil {
// 		return fmt.Errorf("error updating milestone status: %w", err)
// 	}
// 	return nil
// } 