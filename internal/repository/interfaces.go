// package repository

// import (
// 	"context"

// 	"github.com/google/uuid"
// 	"github.com/samuelarogbonlo/.escrow/backend/internal/models"
// 	"gorm.io/gorm"
// )

// // Repository is the generic repository interface for all models
// type Repository interface {
// 	// WithTx performs a database operation within a transaction
// 	WithTx(tx *gorm.DB) Repository
// }

// // EscrowRepository handles data access for escrows
// type EscrowRepository interface {
// 	Repository
// 	// Find finds an escrow by ID
// 	Find(ctx context.Context, id uuid.UUID) (*models.Escrow, error)
// 	// FindByContractID finds an escrow by its blockchain contract ID
// 	FindByContractID(ctx context.Context, contractID string) (*models.Escrow, error)
// 	// FindByUser finds all escrows for a user (either client or provider)
// 	FindByUser(ctx context.Context, userAddress string) ([]models.Escrow, error)
// 	// Create creates a new escrow
// 	Create(ctx context.Context, escrow *models.Escrow) error
// 	// Update updates an escrow
// 	Update(ctx context.Context, escrow *models.Escrow) error
// 	// Delete deletes an escrow
// 	Delete(ctx context.Context, id uuid.UUID) error
// 	// Count counts escrows based on filter criteria
// 	Count(ctx context.Context, filters map[string]interface{}) (int64, error)
// }

// // MilestoneRepository handles data access for milestones
// type MilestoneRepository interface {
// 	Repository
// 	// Find finds a milestone by ID
// 	Find(ctx context.Context, id uuid.UUID) (*models.Milestone, error)
// 	// FindByEscrow finds all milestones for an escrow
// 	FindByEscrow(ctx context.Context, escrowID uuid.UUID) ([]models.Milestone, error)
// 	// Create creates a new milestone
// 	Create(ctx context.Context, milestone *models.Milestone) error
// 	// Update updates a milestone
// 	Update(ctx context.Context, milestone *models.Milestone) error
// 	// Delete deletes a milestone
// 	Delete(ctx context.Context, id uuid.UUID) error
// 	// UpdateEvidence adds evidence to a milestone
// 	UpdateEvidence(ctx context.Context, id uuid.UUID, evidenceHash, evidenceLink string) error
// 	// UpdateStatus updates the status of a milestone
// 	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
// }

// // ReleaseConditionRepository handles data access for release conditions
// type ReleaseConditionRepository interface {
// 	Repository
// 	// Find finds a release condition by ID
// 	Find(ctx context.Context, id uuid.UUID) (*models.ReleaseCondition, error)
// 	// FindByMilestone finds all release conditions for a milestone
// 	FindByMilestone(ctx context.Context, milestoneID uuid.UUID) ([]models.ReleaseCondition, error)
// 	// Create creates a new release condition
// 	Create(ctx context.Context, condition *models.ReleaseCondition) error
// 	// Update updates a release condition
// 	Update(ctx context.Context, condition *models.ReleaseCondition) error
// 	// Delete deletes a release condition
// 	Delete(ctx context.Context, id uuid.UUID) error
// 	// MarkAsMet marks a condition as met
// 	MarkAsMet(ctx context.Context, id uuid.UUID, verifiedBy string) error
// }

// // DisputeRepository handles data access for disputes
// type DisputeRepository interface {
// 	Repository
// 	// Find finds a dispute by ID
// 	Find(ctx context.Context, id uuid.UUID) (*models.Dispute, error)
// 	// FindByEscrow finds all disputes for an escrow
// 	FindByEscrow(ctx context.Context, escrowID uuid.UUID) ([]models.Dispute, error)
// 	// Create creates a new dispute
// 	Create(ctx context.Context, dispute *models.Dispute) error
// 	// Update updates a dispute
// 	Update(ctx context.Context, dispute *models.Dispute) error
// 	// Delete deletes a dispute
// 	Delete(ctx context.Context, id uuid.UUID) error
// 	// Resolve resolves a dispute
// 	Resolve(ctx context.Context, id uuid.UUID, resolution string, inFavorOfClient bool) error
// }

// // Factory creates repositories
// type Factory interface {
// 	// NewEscrowRepository creates a new escrow repository
// 	NewEscrowRepository() EscrowRepository
// 	// NewMilestoneRepository creates a new milestone repository
// 	NewMilestoneRepository() MilestoneRepository
// 	// NewReleaseConditionRepository creates a new release condition repository
// 	NewReleaseConditionRepository() ReleaseConditionRepository
// 	// NewDisputeRepository creates a new dispute repository
// 	NewDisputeRepository() DisputeRepository
// } 