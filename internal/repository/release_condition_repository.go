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

// // GormReleaseConditionRepository is a GORM implementation of ReleaseConditionRepository
// type GormReleaseConditionRepository struct {
// 	db *gorm.DB
// }

// // NewGormReleaseConditionRepository creates a new GormReleaseConditionRepository
// func NewGormReleaseConditionRepository(db *gorm.DB) ReleaseConditionRepository {
// 	return &GormReleaseConditionRepository{
// 		db: db,
// 	}
// }

// // WithTx implements Repository
// func (r *GormReleaseConditionRepository) WithTx(tx *gorm.DB) Repository {
// 	return &GormReleaseConditionRepository{
// 		db: tx,
// 	}
// }

// // Find finds a release condition by ID
// func (r *GormReleaseConditionRepository) Find(ctx context.Context, id uuid.UUID) (*models.ReleaseCondition, error) {
// 	var condition models.ReleaseCondition
// 	if err := r.db.WithContext(ctx).First(&condition, "id = ?", id).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, fmt.Errorf("release condition not found with ID %s", id)
// 		}
// 		return nil, fmt.Errorf("error finding release condition: %w", err)
// 	}
// 	return &condition, nil
// }

// // FindByMilestone finds all release conditions for a milestone
// func (r *GormReleaseConditionRepository) FindByMilestone(ctx context.Context, milestoneID uuid.UUID) ([]models.ReleaseCondition, error) {
// 	var conditions []models.ReleaseCondition
// 	if err := r.db.WithContext(ctx).
// 		Where("milestone_id = ?", milestoneID).
// 		Find(&conditions).Error; err != nil {
// 		return nil, fmt.Errorf("error finding release conditions: %w", err)
// 	}
// 	return conditions, nil
// }

// // Create creates a new release condition
// func (r *GormReleaseConditionRepository) Create(ctx context.Context, condition *models.ReleaseCondition) error {
// 	if err := r.db.WithContext(ctx).Create(condition).Error; err != nil {
// 		return fmt.Errorf("error creating release condition: %w", err)
// 	}
// 	return nil
// }

// // Update updates a release condition
// func (r *GormReleaseConditionRepository) Update(ctx context.Context, condition *models.ReleaseCondition) error {
// 	if err := r.db.WithContext(ctx).Save(condition).Error; err != nil {
// 		return fmt.Errorf("error updating release condition: %w", err)
// 	}
// 	return nil
// }

// // Delete deletes a release condition
// func (r *GormReleaseConditionRepository) Delete(ctx context.Context, id uuid.UUID) error {
// 	if err := r.db.WithContext(ctx).Delete(&models.ReleaseCondition{}, "id = ?", id).Error; err != nil {
// 		return fmt.Errorf("error deleting release condition: %w", err)
// 	}
// 	return nil
// }

// // MarkAsMet marks a condition as met
// func (r *GormReleaseConditionRepository) MarkAsMet(ctx context.Context, id uuid.UUID, verifiedBy string) error {
// 	updates := map[string]interface{}{
// 		"is_met":      true,
// 		"verified_at": time.Now(),
// 		"verified_by": verifiedBy,
// 	}
	
// 	if err := r.db.WithContext(ctx).
// 		Model(&models.ReleaseCondition{}).
// 		Where("id = ?", id).
// 		Updates(updates).Error; err != nil {
// 		return fmt.Errorf("error marking release condition as met: %w", err)
// 	}
	
// 	return nil
// } 