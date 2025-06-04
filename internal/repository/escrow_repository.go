// package repository

// import (
// 	"context"
// 	"errors"
// 	"fmt"

// 	"github.com/google/uuid"
// 	"github.com/samuelarogbonlo/.escrow/backend/internal/models"
// 	"gorm.io/gorm"
// )

// // GormEscrowRepository is a GORM implementation of EscrowRepository
// type GormEscrowRepository struct {
// 	db *gorm.DB
// }

// // NewGormEscrowRepository creates a new GormEscrowRepository
// func NewGormEscrowRepository(db *gorm.DB) EscrowRepository {
// 	return &GormEscrowRepository{
// 		db: db,
// 	}
// }

// // WithTx implements Repository
// func (r *GormEscrowRepository) WithTx(tx *gorm.DB) Repository {
// 	return &GormEscrowRepository{
// 		db: tx,
// 	}
// }

// // Find finds an escrow by ID
// func (r *GormEscrowRepository) Find(ctx context.Context, id uuid.UUID) (*models.Escrow, error) {
// 	var escrow models.Escrow
// 	if err := r.db.WithContext(ctx).First(&escrow, "id = ?", id).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, fmt.Errorf("escrow not found with ID %s", id)
// 		}
// 		return nil, fmt.Errorf("error finding escrow: %w", err)
// 	}
// 	return &escrow, nil
// }

// // FindByContractID finds an escrow by its blockchain contract ID
// func (r *GormEscrowRepository) FindByContractID(ctx context.Context, contractID string) (*models.Escrow, error) {
// 	var escrow models.Escrow
// 	if err := r.db.WithContext(ctx).First(&escrow, "contract_id = ?", contractID).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			return nil, fmt.Errorf("escrow not found with contract ID %s", contractID)
// 		}
// 		return nil, fmt.Errorf("error finding escrow: %w", err)
// 	}
// 	return &escrow, nil
// }

// // FindByUser finds all escrows for a user (either client or provider)
// func (r *GormEscrowRepository) FindByUser(ctx context.Context, userAddress string) ([]models.Escrow, error) {
// 	var escrows []models.Escrow
// 	if err := r.db.WithContext(ctx).
// 		Where("client_address = ? OR provider_address = ?", userAddress, userAddress).
// 		Find(&escrows).Error; err != nil {
// 		return nil, fmt.Errorf("error finding escrows: %w", err)
// 	}
// 	return escrows, nil
// }

// // Create creates a new escrow
// func (r *GormEscrowRepository) Create(ctx context.Context, escrow *models.Escrow) error {
// 	if err := r.db.WithContext(ctx).Create(escrow).Error; err != nil {
// 		return fmt.Errorf("error creating escrow: %w", err)
// 	}
// 	return nil
// }

// // Update updates an escrow
// func (r *GormEscrowRepository) Update(ctx context.Context, escrow *models.Escrow) error {
// 	if err := r.db.WithContext(ctx).Save(escrow).Error; err != nil {
// 		return fmt.Errorf("error updating escrow: %w", err)
// 	}
// 	return nil
// }

// // Delete deletes an escrow
// func (r *GormEscrowRepository) Delete(ctx context.Context, id uuid.UUID) error {
// 	if err := r.db.WithContext(ctx).Delete(&models.Escrow{}, "id = ?", id).Error; err != nil {
// 		return fmt.Errorf("error deleting escrow: %w", err)
// 	}
// 	return nil
// }

// // Count counts escrows based on filter criteria
// func (r *GormEscrowRepository) Count(ctx context.Context, filters map[string]interface{}) (int64, error) {
// 	var count int64
// 	query := r.db.WithContext(ctx).Model(&models.Escrow{})
	
// 	for key, value := range filters {
// 		query = query.Where(key, value)
// 	}
	
// 	if err := query.Count(&count).Error; err != nil {
// 		return 0, fmt.Errorf("error counting escrows: %w", err)
// 	}
	
// 	return count, nil
// } 