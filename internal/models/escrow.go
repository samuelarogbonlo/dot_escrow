// package models

// import (
// 	"time"

// 	"github.com/google/uuid"
// 	"gorm.io/gorm"
// )

// // Escrow represents an escrow agreement between a client and a provider
// type Escrow struct {
// 	ID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
// 	Title           string    `gorm:"not null" json:"title"`
// 	Description     string    `json:"description"`
// 	ClientAddress   string    `gorm:"not null" json:"clientAddress"`
// 	ClientName      string    `json:"clientName"`
// 	ProviderAddress string    `gorm:"not null" json:"providerAddress"`
// 	ProviderName    string    `json:"providerName"`
// 	TotalAmount     string    `gorm:"not null" json:"totalAmount"`
// 	ReleasedAmount  string    `gorm:"not null;default:0" json:"releasedAmount"`
// 	RemainingAmount string    `gorm:"not null" json:"remainingAmount"`
// 	Status          string    `gorm:"not null;default:'active'" json:"status"`
// 	CreatedAt       time.Time `json:"createdAt"`
// 	UpdatedAt       time.Time `json:"updatedAt"`
// 	DeadlineAt      time.Time `json:"deadlineAt,omitempty"`
	
// 	// Blockchain details
// 	ContractID      string    `gorm:"index" json:"contractId,omitempty"`
// 	TokenAddress    string    `json:"tokenAddress,omitempty"`
	
// 	// Relations
// 	Milestones []Milestone `gorm:"foreignKey:EscrowID" json:"milestones,omitempty"`
// 	Disputes   []Dispute   `gorm:"foreignKey:EscrowID" json:"disputes,omitempty"`
// }

// // BeforeCreate is a GORM hook that runs before creating a new record
// func (e *Escrow) BeforeCreate(tx *gorm.DB) error {
// 	if e.ID == uuid.Nil {
// 		e.ID = uuid.New()
// 	}
// 	e.CreatedAt = time.Now()
// 	e.UpdatedAt = time.Now()
// 	e.ReleasedAmount = "0"
// 	e.RemainingAmount = e.TotalAmount
// 	return nil
// } 