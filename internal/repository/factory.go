// package repository

// import (
// 	"github.com/samuelarogbonlo/.escrow/backend/internal/database"
// )

// // GormFactory is a GORM implementation of Factory
// type GormFactory struct {}

// // NewGormFactory creates a new GormFactory
// func NewGormFactory() Factory {
// 	return &GormFactory{}
// }

// // NewEscrowRepository creates a new escrow repository
// func (f *GormFactory) NewEscrowRepository() EscrowRepository {
// 	return NewGormEscrowRepository(database.GetDB())
// }

// // NewMilestoneRepository creates a new milestone repository
// func (f *GormFactory) NewMilestoneRepository() MilestoneRepository {
// 	return NewGormMilestoneRepository(database.GetDB())
// }

// // NewReleaseConditionRepository creates a new release condition repository
// func (f *GormFactory) NewReleaseConditionRepository() ReleaseConditionRepository {
// 	return NewGormReleaseConditionRepository(database.GetDB())
// }

// // NewDisputeRepository creates a new dispute repository
// func (f *GormFactory) NewDisputeRepository() DisputeRepository {
// 	return NewGormDisputeRepository(database.GetDB())
// } 