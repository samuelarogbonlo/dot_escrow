// package repository

// import (
// 	"context"
// 	"fmt"

// 	"github.com/samuelarogbonlo/.escrow/backend/internal/database"
// 	"gorm.io/gorm"
// )

// // Transaction executes a function within a database transaction
// func Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
// 	db := database.GetDB()
// 	tx := db.WithContext(ctx).Begin()
// 	if tx.Error != nil {
// 		return fmt.Errorf("failed to begin transaction: %w", tx.Error)
// 	}

// 	defer func() {
// 		if r := recover(); r != nil {
// 			tx.Rollback()
// 			panic(r) // re-throw panic after rollback
// 		}
// 	}()

// 	if err := fn(tx); err != nil {
// 		tx.Rollback()
// 		return err
// 	}

// 	if err := tx.Commit().Error; err != nil {
// 		return fmt.Errorf("failed to commit transaction: %w", err)
// 	}

// 	return nil
// }

// // WithTransaction creates repository instances that use the provided transaction
// func WithTransaction(tx *gorm.DB, factory Factory) Factory {
// 	return &TransactionalFactory{
// 		tx:      tx,
// 		factory: factory,
// 	}
// }

// // TransactionalFactory is a factory that creates repositories that use a transaction
// type TransactionalFactory struct {
// 	tx      *gorm.DB
// 	factory Factory
// }

// // NewEscrowRepository creates a new escrow repository with transaction
// func (f *TransactionalFactory) NewEscrowRepository() EscrowRepository {
// 	return f.factory.NewEscrowRepository().WithTx(f.tx).(EscrowRepository)
// }

// // NewMilestoneRepository creates a new milestone repository with transaction
// func (f *TransactionalFactory) NewMilestoneRepository() MilestoneRepository {
// 	return f.factory.NewMilestoneRepository().WithTx(f.tx).(MilestoneRepository)
// }

// // NewReleaseConditionRepository creates a new release condition repository with transaction
// func (f *TransactionalFactory) NewReleaseConditionRepository() ReleaseConditionRepository {
// 	return f.factory.NewReleaseConditionRepository().WithTx(f.tx).(ReleaseConditionRepository)
// }

// // NewDisputeRepository creates a new dispute repository with transaction
// func (f *TransactionalFactory) NewDisputeRepository() DisputeRepository {
// 	return f.factory.NewDisputeRepository().WithTx(f.tx).(DisputeRepository)
// } 