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

// // GormDisputeRepository is a GORM implementation of DisputeRepository
// type GormDisputeRepository struct {
// 	db *gorm.DB
// }

// // NewGormDisputeRepository creates a new GormDisputeRepository
// func NewGormDisputeRepository(db *gorm.DB) DisputeRepository {
// 	return &GormDisputeRepository{
// 		db: db,
// 	}
// }

// // WithTx implements Repository
// func (r *GormDisputeRepository) WithTx(tx *gorm.DB) Repository {
// 	return &GormDisputeRepository{
// 		db: tx,
// 	}
// }

// // Find finds a dispute by ID
// func (r *GormDisputeRepository) Find(ctx context.Context, id uuid.UUID) (*models.Dispute, error) {
// 	var dispute models.Dispute
// 	if err := r.db.WithContext(ctx).
// 		Preload("Messages").
// 		First(&dispute, "id = ?", id).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, fmt.Errorf("dispute not found with ID %s", id)
// 		}
// 		return nil, fmt.Errorf("error finding dispute: %w", err)
// 	}
// 	return &dispute, nil
// }

// // FindByEscrow finds all disputes for an escrow
// func (r *GormDisputeRepository) FindByEscrow(ctx context.Context, escrowID uuid.UUID) ([]models.Dispute, error) {
// 	var disputes []models.Dispute
// 	if err := r.db.WithContext(ctx).
// 		Where("escrow_id = ?", escrowID).
// 		Order("created_at DESC").
// 		Find(&disputes).Error; err != nil {
// 		return nil, fmt.Errorf("error finding disputes: %w", err)
// 	}
// 	return disputes, nil
// }

// // Create creates a new dispute
// func (r *GormDisputeRepository) Create(ctx context.Context, dispute *models.Dispute) error {
// 	if err := r.db.WithContext(ctx).Create(dispute).Error; err != nil {
// 		return fmt.Errorf("error creating dispute: %w", err)
// 	}
// 	return nil
// }

// // Update updates a dispute
// func (r *GormDisputeRepository) Update(ctx context.Context, dispute *models.Dispute) error {
// 	if err := r.db.WithContext(ctx).Save(dispute).Error; err != nil {
// 		return fmt.Errorf("error updating dispute: %w", err)
// 	}
// 	return nil
// }

// // Delete deletes a dispute
// func (r *GormDisputeRepository) Delete(ctx context.Context, id uuid.UUID) error {
// 	// First delete all associated messages
// 	if err := r.db.WithContext(ctx).
// 		Where("dispute_id = ?", id).
// 		Delete(&models.DisputeMessage{}).Error; err != nil {
// 		return fmt.Errorf("error deleting dispute messages: %w", err)
// 	}
	
// 	// Then delete the dispute
// 	if err := r.db.WithContext(ctx).Delete(&models.Dispute{}, "id = ?", id).Error; err != nil {
// 		return fmt.Errorf("error deleting dispute: %w", err)
// 	}
// 	return nil
// }

// // Resolve resolves a dispute
// func (r *GormDisputeRepository) Resolve(ctx context.Context, id uuid.UUID, resolution string, inFavorOfClient bool) error {
// 	updates := map[string]interface{}{
// 		"status":             "resolved",
// 		"resolution":         resolution,
// 		"in_favor_of_client": inFavorOfClient,
// 		"resolved_at":        time.Now(),
// 		"updated_at":         time.Now(),
// 	}
	
// 	if err := r.db.WithContext(ctx).
// 		Model(&models.Dispute{}).
// 		Where("id = ?", id).
// 		Updates(updates).Error; err != nil {
// 		return fmt.Errorf("error resolving dispute: %w", err)
// 	}
	
// 	return nil
// } 